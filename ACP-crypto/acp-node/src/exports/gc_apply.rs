//! Shared apply logic for GC plans (exports_gc_apply RPC and exports_health auto_apply).
//! v0.90: safety limits max_delete_bytes / max_delete_count.

use crate::exports::gc;
use crate::exports::gc_plan_store;
use serde_json::json;
use std::fs;

/// Returns true if path is under dir (prevents path traversal when applying plans).
fn path_under_dir(path: &str, dir: &str) -> bool {
    let dir_trim = dir.trim_end_matches('/');
    let path_clean = path.replace('\\', "/");
    (path_clean == dir_trim || path_clean.starts_with(&format!("{}/", dir_trim)))
        && !path_clean.contains("..")
}

/// Options for apply (safety limits and sample size).
#[derive(Clone, Default)]
pub struct ApplyOpts {
    pub max_delete_bytes: Option<u64>,
    pub max_delete_count: Option<u64>,
    pub sample_size: usize,
}

/// Success result of apply (for JSON response).
#[derive(Clone)]
pub struct ApplySuccess {
    pub deleted_count: usize,
    pub bytes_freed: u64,
    pub applied_files_sample: Vec<serde_json::Value>,
    pub before_total_bytes: u64,
    pub after_total_bytes: u64,
}

/// Error reasons for apply (for JSON response).
#[derive(Clone)]
pub enum ApplyError {
    PlanNotFound,
    LoadFailed(String),
    PlanExpired { expires_at_ts: u64 },
    PlanHashMismatch,
    PlanChanged {
        current_plan_id: String,
        current_plan_hash: String,
        current_plan: serde_json::Value,
    },
    ComputeFailed(String),
    ExceedsMaxDeleteBytes {
        would_delete_total_bytes: u64,
        max_delete_bytes: u64,
    },
    ExceedsMaxDeleteCount {
        would_delete_count: usize,
        max_delete_count: usize,
    },
}

/// Run apply: load plan, verify, check safety limits, delete files, remove plan.
/// Caller must hold ExportLock.
pub fn apply_plan(
    export_dir: &str,
    plan_id: &str,
    plan_hash: &str,
    opts: &ApplyOpts,
) -> Result<ApplySuccess, ApplyError> {
    let now_ts: u64 = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let stored = match gc_plan_store::load_plan(export_dir, plan_id) {
        Ok(Some(s)) => s,
        Ok(None) => return Err(ApplyError::PlanNotFound),
        Err(e) => return Err(ApplyError::LoadFailed(e.to_string())),
    };

    if stored.expires_at_ts < now_ts {
        return Err(ApplyError::PlanExpired {
            expires_at_ts: stored.expires_at_ts,
        });
    }

    if stored.plan_hash != plan_hash {
        return Err(ApplyError::PlanHashMismatch);
    }

    if let Some(max_bytes) = opts.max_delete_bytes {
        if stored.would_delete_total_bytes > max_bytes {
            return Err(ApplyError::ExceedsMaxDeleteBytes {
                would_delete_total_bytes: stored.would_delete_total_bytes,
                max_delete_bytes: max_bytes,
            });
        }
    }
    if let Some(max_count) = opts.max_delete_count {
        let max_usize = max_count.min(usize::MAX as u64) as usize;
        if stored.would_delete_count > max_usize {
            return Err(ApplyError::ExceedsMaxDeleteCount {
                would_delete_count: stored.would_delete_count,
                max_delete_count: max_usize,
            });
        }
    }

    let gc_opts = gc::GcPlanOpts {
        keep_days: stored.opts.keep_days,
        max_total_bytes: stored.opts.max_total_bytes,
        strategy: stored.opts.strategy.clone(),
        protect_last_n: stored.opts.protect_last_n,
        plan_limit: stored.opts.plan_limit,
        delete_limit: stored.opts.delete_limit,
        protected_sample_size: stored.opts.protected_sample_size,
        now_ts,
    };

    let current = match gc::compute_gc_plan(export_dir, gc_opts) {
        Ok(p) => p,
        Err(e) => return Err(ApplyError::ComputeFailed(e.to_string())),
    };

    if !gc_plan_store::plan_matches(&stored, &current) {
        let new_plan_id = crate::util::id::new_uuid();
        let new_expires_at_ts = now_ts.saturating_add(gc_plan_store::plan_ttl_secs());
        let new_hash = match gc_plan_store::save_plan(
            export_dir,
            &new_plan_id,
            now_ts,
            new_expires_at_ts,
            &stored.opts,
            &current,
            None,
            None,
        ) {
            Ok(h) => h,
            Err(_) => String::new(),
        };
        return Err(ApplyError::PlanChanged {
            current_plan_id: new_plan_id,
            current_plan_hash: new_hash,
            current_plan: json!({
                "before_total_bytes": current.before_total_bytes,
                "projected_after_total_bytes": current.projected_after_total_bytes,
                "would_delete_count": current.would_delete_count,
                "would_delete_total_bytes": current.would_delete_total_bytes,
                "would_delete": current.would_delete,
                "protected_count": current.protected_count
            }),
        });
    }

    let sample_size = opts.sample_size.min(500);
    let mut applied_files_sample: Vec<serde_json::Value> = Vec::new();

    for (i, manifest_path) in stored.would_delete_manifests.iter().enumerate() {
        if !path_under_dir(manifest_path, export_dir) {
            continue; // skip tampered or invalid path
        }
        let (unit_bytes, created_at_ts, filename_from_plan) = if i < stored.deleted_sample.len() {
            let e = &stored.deleted_sample[i];
            (
                e.get("bytes").and_then(|v| v.as_u64()).unwrap_or(0),
                e.get("created_at_ts").and_then(|v| v.as_u64()).unwrap_or(0),
                e.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            )
        } else if i < stored.would_delete.len() {
            let e = &stored.would_delete[i];
            (
                e.get("bytes").and_then(|v| v.as_u64()).unwrap_or(0),
                e.get("created_at_ts").and_then(|v| v.as_u64()).unwrap_or(0),
                e.get("filename").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            )
        } else {
            (0u64, 0u64, String::new())
        };

        let filename = fs::read_to_string(manifest_path)
            .ok()
            .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
            .and_then(|mj| {
                mj.get("filename")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            })
            .or_else(|| {
                std::path::Path::new(manifest_path)
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .map(|s| format!("{}.csv", s))
            });

        if applied_files_sample.len() < sample_size {
            let f = filename.as_deref().unwrap_or(if filename_from_plan.is_empty() {
                "?"
            } else {
                &filename_from_plan
            });
            let export_path = format!("{}/{}", export_dir, f);
            applied_files_sample.push(json!({
                "filename": f,
                "export_path": export_path,
                "manifest_path": manifest_path,
                "bytes": unit_bytes,
                "created_at_ts": created_at_ts
            }));
        }

        if let Some(ref f) = filename {
            if !f.contains("..") && !f.contains('/') && !f.contains('\\') {
                let export_path = format!("{}/{}", export_dir, f);
                if path_under_dir(&export_path, export_dir) {
                    let _ = fs::remove_file(&export_path);
                }
            }
        }
        if path_under_dir(manifest_path, export_dir) {
            let _ = fs::remove_file(manifest_path);
        }
    }

    let bytes_freed = stored.would_delete_total_bytes;
    let _ = gc_plan_store::remove_plan(export_dir, plan_id);

    Ok(ApplySuccess {
        deleted_count: stored.would_delete_count,
        bytes_freed,
        applied_files_sample,
        before_total_bytes: stored.before_total_bytes,
        after_total_bytes: stored.projected_after_total_bytes,
    })
}

/// Build JSON response for apply success (exports_gc_apply RPC).
pub fn success_to_json(s: &ApplySuccess) -> serde_json::Value {
    json!({
        "accepted": true,
        "applied": true,
        "plan_deleted": true,
        "deleted_count": s.deleted_count,
        "bytes_freed": s.bytes_freed,
        "applied_files_sample": s.applied_files_sample,
        "before_total_bytes": s.before_total_bytes,
        "after_total_bytes": s.after_total_bytes
    })
}

/// Build JSON response for apply error (exports_gc_apply RPC or exports_health auto_apply).
pub fn error_to_json(e: &ApplyError) -> serde_json::Value {
    match e {
        ApplyError::PlanNotFound => json!({
            "accepted": false,
            "reason": "plan_not_found"
        }),
        ApplyError::LoadFailed(msg) => json!({
            "accepted": false,
            "reason": format!("load_plan failed: {}", msg)
        }),
        ApplyError::PlanExpired { expires_at_ts } => json!({
            "accepted": false,
            "reason": "plan_expired",
            "expires_at_ts": expires_at_ts
        }),
        ApplyError::PlanHashMismatch => json!({
            "accepted": false,
            "reason": "plan_hash_mismatch"
        }),
        ApplyError::PlanChanged {
            current_plan_id,
            current_plan_hash,
            current_plan,
        } => json!({
            "accepted": false,
            "reason": "plan_changed",
            "current_plan_id": current_plan_id,
            "current_plan_hash": current_plan_hash,
            "current_plan": current_plan
        }),
        ApplyError::ComputeFailed(msg) => json!({
            "accepted": false,
            "reason": format!("compute_gc_plan failed: {}", msg)
        }),
        ApplyError::ExceedsMaxDeleteBytes {
            would_delete_total_bytes,
            max_delete_bytes,
        } => json!({
            "accepted": false,
            "reason": "exceeds_max_delete_bytes",
            "would_delete_total_bytes": would_delete_total_bytes,
            "max_delete_bytes": max_delete_bytes
        }),
        ApplyError::ExceedsMaxDeleteCount {
            would_delete_count,
            max_delete_count,
        } => json!({
            "accepted": false,
            "reason": "exceeds_max_delete_count",
            "would_delete_count": would_delete_count,
            "max_delete_count": max_delete_count
        }),
    }
}
