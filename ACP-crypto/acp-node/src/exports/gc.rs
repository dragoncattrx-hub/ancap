//! GC plan computation for export dir: no file deletion, only plan.

use std::collections::HashSet;
use std::fs;

#[derive(Clone)]
struct Unit {
    created_at_ts: u64,
    filename: String,
    export_path: String,
    manifest_path: String,
    bytes_export: u64,
    bytes_manifest: u64,
    window_days: Option<u64>,
    hash: Option<String>,
    rows: Option<u64>,
    sha256: Option<String>,
}

#[derive(Clone)]
pub struct GcPlanOpts {
    pub keep_days: u64,
    pub max_total_bytes: Option<u64>,
    pub strategy: String,
    pub protect_last_n: usize,
    pub plan_limit: usize,
    pub delete_limit: usize,
    pub protected_sample_size: usize,
    pub now_ts: u64,
}

pub struct GcPlanResult {
    pub before_total_bytes: u64,
    pub projected_after_total_bytes: u64,
    pub would_delete_count: usize,
    pub would_delete_total_bytes: u64,
    pub would_delete: Vec<serde_json::Value>,
    pub would_delete_manifests: HashSet<String>,
    pub cannot_reach_target: bool,
    pub min_possible_total_bytes: Option<u64>,
    pub protected_count: usize,
    pub cutoff_ts: u64,
    pub needed_to_free_bytes: Option<u64>,
    pub protected_sample: Vec<serde_json::Value>,
    pub protected_newest_created_at_ts: Option<u64>,
    pub kept_count: usize,
    pub kept_newest_created_at_ts: Option<u64>,
    pub kept_newest_day_iso: Option<String>,
    pub kept_total_bytes: u64,
    pub deleted_sample: Vec<serde_json::Value>,
    pub errors_sample: Vec<String>,
}

pub fn compute_gc_plan(export_dir: &str, opts: GcPlanOpts) -> anyhow::Result<GcPlanResult> {
    let cutoff_ts = opts
        .now_ts
        .saturating_sub(opts.keep_days.saturating_mul(86_400));

    let mut units: Vec<Unit> = Vec::new();
    let mut errors: Vec<String> = Vec::new();

    let rd = fs::read_dir(export_dir)?;
    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if !name.ends_with(".json") {
            continue;
        }
        if name.contains("..") || name.contains('/') || name.contains('\\') {
            errors.push(format!("skip suspicious manifest name: {}", name));
            continue;
        }

        let manifest_path = format!("{}/{}", export_dir, name);
        let manifest_bytes = match fs::metadata(&manifest_path) {
            Ok(m) => m.len(),
            Err(e) => {
                errors.push(format!("metadata {}: {}", name, e));
                continue;
            }
        };

        let s = match fs::read_to_string(&manifest_path) {
            Ok(s) => s,
            Err(e) => {
                errors.push(format!("read {}: {}", name, e));
                continue;
            }
        };
        let mj: serde_json::Value = match serde_json::from_str(&s) {
            Ok(v) => v,
            Err(e) => {
                errors.push(format!("parse {}: {}", name, e));
                continue;
            }
        };

        let created_at_ts = match mj.get("created_at_ts").and_then(|v| v.as_u64()) {
            Some(t) => t,
            None => {
                errors.push(format!("manifest {} missing created_at_ts", name));
                continue;
            }
        };

        let filename = mj
            .get("filename")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| name.trim_end_matches(".json").to_string());

        if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
            errors.push(format!("skip suspicious export filename: {}", filename));
            continue;
        }

        let export_path = format!("{}/{}", export_dir, filename);
        let inprog_path = format!("{}.inprogress", &export_path);
        if fs::metadata(&inprog_path).is_ok() {
            continue;
        }
        let export_bytes = fs::metadata(&export_path).ok().map(|m| m.len()).unwrap_or(0);

        let window_days_val = mj
            .get("params")
            .and_then(|p| p.get("window_days"))
            .and_then(|v| v.as_u64());
        let hash_val = mj
            .get("params")
            .and_then(|p| p.get("hash"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
        let rows_val = mj.get("rows").and_then(|v| v.as_u64());
        let sha_val = mj
            .get("sha256")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        units.push(Unit {
            created_at_ts,
            filename,
            export_path,
            manifest_path,
            bytes_export: export_bytes,
            bytes_manifest: manifest_bytes,
            window_days: window_days_val,
            hash: hash_val,
            rows: rows_val,
            sha256: sha_val,
        });
    }

    let before_total_bytes: u64 = units
        .iter()
        .map(|u| u.bytes_export.saturating_add(u.bytes_manifest))
        .sum();

    let mut units_by_newest = units.clone();
    units_by_newest.sort_by(|a, b| b.created_at_ts.cmp(&a.created_at_ts));
    let protected: HashSet<String> = units_by_newest
        .iter()
        .take(opts.protect_last_n)
        .map(|u| u.manifest_path.clone())
        .collect();
    let protected_count = protected.len();
    let protected_newest_created_at_ts = units_by_newest.first().map(|u| u.created_at_ts);

    let mut protected_sample: Vec<serde_json::Value> = Vec::new();
    for u in units_by_newest
        .iter()
        .take(opts.protect_last_n)
        .take(opts.protected_sample_size)
    {
        let unit_bytes = u.bytes_export.saturating_add(u.bytes_manifest);
        let day_iso = {
            let di = (u.created_at_ts / 86_400) as i64;
            crate::util::date::day_iso_from_day_index(di)
        };
        protected_sample.push(serde_json::json!({
            "filename": u.filename,
            "created_at_ts": u.created_at_ts,
            "created_day_iso": day_iso,
            "bytes": unit_bytes,
            "window_days": u.window_days,
            "hash": u.hash,
            "rows": u.rows
        }));
    }

    units.sort_by(|a, b| a.created_at_ts.cmp(&b.created_at_ts));

    let days_enabled = opts.strategy == "days_only" || opts.strategy == "days_or_bytes";
    let bytes_enabled = opts.strategy == "bytes_only" || opts.strategy == "days_or_bytes";

    let mut projected_total_bytes = before_total_bytes;
    let mut would_delete_total_bytes: u64 = 0;
    let mut would_delete: Vec<serde_json::Value> = Vec::new();
    let mut would_delete_manifests: HashSet<String> = HashSet::new();
    let mut deleted_sample: Vec<serde_json::Value> = Vec::new();

    for u in units.iter() {
        if would_delete_manifests.len() >= opts.delete_limit {
            break;
        }
        if protected.contains(&u.manifest_path) {
            continue;
        }

        let age_eligible = days_enabled && u.created_at_ts < cutoff_ts;
        let bytes_pressure = if bytes_enabled {
            opts.max_total_bytes
                .map(|maxb| projected_total_bytes > maxb)
                .unwrap_or(false)
        } else {
            false
        };

        let should_delete = match opts.strategy.as_str() {
            "days_only" => age_eligible,
            "bytes_only" => bytes_pressure,
            _ => age_eligible || bytes_pressure,
        };

        if !should_delete {
            if opts.strategy == "days_only" {
                break;
            }
            if opts.strategy == "days_or_bytes" && !bytes_pressure {
                break;
            }
            if opts.strategy == "bytes_only" && !bytes_pressure {
                break;
            }
            continue;
        }

        let unit_bytes = u.bytes_export.saturating_add(u.bytes_manifest);

        if would_delete.len() < opts.plan_limit {
            let day_iso = {
                let di = (u.created_at_ts / 86_400) as i64;
                crate::util::date::day_iso_from_day_index(di)
            };
            would_delete.push(serde_json::json!({
                "filename": u.filename,
                "created_at_ts": u.created_at_ts,
                "manifest_path": u.manifest_path,
                "created_day_iso": day_iso,
                "bytes": unit_bytes,
                "window_days": u.window_days,
                "hash": u.hash,
                "rows": u.rows,
                "delete_reason": if age_eligible { "age" } else { "size" }
            }));
        }

        would_delete_manifests.insert(u.manifest_path.clone());
        would_delete_total_bytes = would_delete_total_bytes.saturating_add(unit_bytes);
        projected_total_bytes = projected_total_bytes.saturating_sub(unit_bytes);

        if deleted_sample.len() < 200 {
            deleted_sample.push(serde_json::json!({
                "name": u.filename,
                "export_path": u.export_path,
                "manifest_path": u.manifest_path,
                "created_at_ts": u.created_at_ts,
                "bytes": unit_bytes,
                "window_days": u.window_days,
                "hash": u.hash,
                "rows": u.rows,
                "sha256": u.sha256,
                "delete_reason": if age_eligible { "age" } else { "size" }
            }));
        }

        if bytes_enabled {
            if let Some(maxb) = opts.max_total_bytes {
                if projected_total_bytes <= maxb {
                    if opts.strategy == "bytes_only" {
                        break;
                    }
                    if opts.strategy == "days_or_bytes" {
                        break;
                    }
                }
            }
        }
    }

    let min_possible_total_bytes = if opts.max_total_bytes.is_some() {
        let minb = units
            .iter()
            .filter(|u| protected.contains(&u.manifest_path))
            .map(|u| u.bytes_export.saturating_add(u.bytes_manifest))
            .sum::<u64>();
        Some(minb)
    } else {
        None
    };
    let cannot_reach_target = if let Some(maxb) = opts.max_total_bytes {
        min_possible_total_bytes.map(|minb| minb > maxb).unwrap_or(false)
    } else {
        false
    };

    let needed_to_free_bytes = opts
        .max_total_bytes
        .map(|maxb| before_total_bytes.saturating_sub(maxb));

    let total_units = units.len();
    let kept_count = total_units.saturating_sub(would_delete_manifests.len());
    let mut kept_newest: Option<u64> = None;
    let mut kept_total_bytes: u64 = 0;
    for u in units.iter() {
        if would_delete_manifests.contains(&u.manifest_path) {
            continue;
        }
        kept_newest = Some(
            kept_newest
                .map(|x| x.max(u.created_at_ts))
                .unwrap_or(u.created_at_ts),
        );
        kept_total_bytes = kept_total_bytes
            .saturating_add(u.bytes_export.saturating_add(u.bytes_manifest));
    }
    let kept_newest_day_iso = kept_newest.map(|ts| {
        let day_index = (ts / 86_400) as i64;
        crate::util::date::day_iso_from_day_index(day_index)
    });

    Ok(GcPlanResult {
        before_total_bytes,
        projected_after_total_bytes: projected_total_bytes,
        would_delete_count: would_delete_manifests.len(),
        would_delete_total_bytes,
        would_delete,
        would_delete_manifests,
        cannot_reach_target,
        min_possible_total_bytes,
        protected_count,
        cutoff_ts,
        needed_to_free_bytes,
        protected_sample,
        protected_newest_created_at_ts,
        kept_count,
        kept_newest_created_at_ts: kept_newest,
        kept_newest_day_iso,
        kept_total_bytes,
        deleted_sample,
        errors_sample: errors.into_iter().take(200).collect(),
    })
}
