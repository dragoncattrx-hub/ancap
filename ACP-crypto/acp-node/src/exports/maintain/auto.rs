//! maintain_run: orchestration (v1.0). Lock → scan → fingerprint → plan → safety → apply → log.

use super::gc_apply;
use super::gc_plan;
use super::log as maintain_log;
use super::plans;
use super::safety::{self, PlanOrPreview};
use super::types::{GcPlanRef, MaintainOpts, MaintainResult};
use crate::exports::gc;
use crate::exports::gc_apply::{self as gc_apply_mod};
use crate::exports::plans_store::PlanMatch;
use crate::util::fs_usage;
use crate::util::path_sanitize;
use serde_json::json;
use std::time::{SystemTime, UNIX_EPOCH};

struct AutoApplyOut {
    apply_result: Option<serde_json::Value>,
    applied: bool,
    blocked_reason: Option<String>,
    allowed: bool,
    allowed_reason: Option<String>,
}

fn try_auto_apply(
    export_dir: &str,
    plan_id: &str,
    plan_hash: &str,
    opts: &MaintainOpts,
    inprogress_count: u64,
    disk_used_ratio: f64,
    plan: &PlanOrPreview<'_>,
) -> AutoApplyOut {
    let (allowed, reason) = safety::check_allowed(
        inprogress_count,
        disk_used_ratio,
        plan,
        &opts.safety,
    );
    if !allowed {
        return AutoApplyOut {
            apply_result: None,
            applied: false,
            blocked_reason: reason.clone(),
            allowed: false,
            allowed_reason: reason,
        };
    }
    if opts.auto_apply_dry_run_only {
        return AutoApplyOut {
            apply_result: Some(json!({
                "applied": false,
                "dry_run_only": true,
                "reason": "auto_apply_dry_run_only"
            })),
            applied: false,
            blocked_reason: None,
            allowed: true,
            allowed_reason: reason,
        };
    }
    let max_del = if opts.safety.max_would_delete_total_bytes > 0 {
        Some(opts.safety.max_would_delete_total_bytes)
    } else {
        None
    };
    let max_count = if opts.safety.max_would_delete_count > 0 {
        Some(opts.safety.max_would_delete_count as usize)
    } else {
        None
    };
    match gc_apply::apply_plan(export_dir, plan_id, plan_hash, max_del, max_count, 50) {
        Ok(s) => AutoApplyOut {
            apply_result: Some(gc_apply_mod::success_to_json(&s)),
            applied: true,
            blocked_reason: None,
            allowed: true,
            allowed_reason: reason,
        },
        Err(e) => AutoApplyOut {
            apply_result: Some(gc_apply_mod::error_to_json(&e)),
            applied: false,
            blocked_reason: None,
            allowed: true,
            allowed_reason: reason,
        },
    }
}

fn count_stale_inprogress(export_dir: &str, max_age_minutes: u64, now_ts: u64) -> u64 {
    let rd = match std::fs::read_dir(export_dir) {
        Ok(r) => r,
        Err(_) => return 0,
    };
    let mut count = 0u64;
    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if !name.ends_with(".inprogress") {
            continue;
        }
        let mtime_ts = e
            .metadata()
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let age_minutes = if mtime_ts > 0 && now_ts >= mtime_ts {
            (now_ts - mtime_ts) / 60
        } else {
            0
        };
        if age_minutes >= max_age_minutes {
            count += 1;
        }
    }
    count
}

pub fn maintain_run(opts: MaintainOpts) -> anyhow::Result<MaintainResult> {
    let _lock = crate::util::export_lock::ExportLock::acquire(&opts.paths.lock_path)?;

    let export_dir = &opts.paths.exports_dir;
    let plans_dir = &opts.paths.plans_dir;
    let now_ts: u64 = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let (total_bytes, ready_bytes, newest_ready, oldest_ready, inprogress_count, ready_count) =
        super::fingerprint::scan_exports_dir_for_fingerprint(export_dir)?;
    let fp = super::fingerprint::compute_exports_state_fingerprint_v2(
        total_bytes,
        ready_bytes,
        newest_ready,
        oldest_ready,
        inprogress_count,
        ready_count,
    );
    let stale_inprogress_count = count_stale_inprogress(export_dir, opts.max_age_minutes, now_ts);
    let disk_used_ratio = fs_usage::fs_usage(export_dir)
        .ok()
        .map(|u| u.used_ratio)
        .unwrap_or(0.0);
    let pressure = total_bytes > opts.max_total_bytes;

    let mut gc_plan_ref: Option<GcPlanRef> = None;
    let mut gc_plan_preview: Option<super::types::GcPlanPreview> = None;
    let mut apply_result: Option<serde_json::Value> = None;
    let mut auto_apply_attempted = false;
    let mut auto_apply_allowed: Option<bool> = None;
    let mut auto_apply_allowed_reason: Option<String> = None;
    let mut auto_apply_applied = false;
    let mut auto_apply_blocked_reason: Option<String> = None;
    let mut recommendation: Option<String> = None;
    let mut recommendation_hint: Option<serde_json::Value> = None;
    let suggestions: Vec<serde_json::Value> = Vec::new();

    if pressure && opts.auto_create_plan_if_pressure {
        let plan_ttl = opts.gc.plan_ttl_seconds.clamp(60, 3600);
        let reuse_match = PlanMatch {
            max_total_bytes: opts.max_total_bytes,
            strategy: opts.gc.strategy.clone(),
            keep_days: opts.gc.keep_days,
            protect_last_n: opts.gc.protect_last_n,
            plan_limit: opts.gc.plan_limit,
        };
        let reused = if opts.gc.reuse_active_plan {
            plans::find_reusable_active_plan(
                plans_dir,
                now_ts,
                opts.gc.reuse_max_age_seconds,
                &reuse_match,
                fp.version,
                &fp.fingerprint_hex,
            )?
        } else {
            None
        };

        if let Some(ref found) = reused {
            let ref_ = GcPlanRef {
                plan_id: found.plan_id.clone(),
                plan_hash: found.plan_hash.clone(),
                expires_at_ts: found.expires_at_ts,
                plan_source: "reused".to_string(),
            };
            gc_plan_ref = Some(ref_.clone());
            recommendation = Some("Apply plan via exports_gc_apply".to_string());
            recommendation_hint = Some(json!({
                "rpc": "exports_gc_apply",
                "params": { "plan_id": ref_.plan_id, "plan_hash": ref_.plan_hash }
            }));
            if pressure && opts.auto_apply_plan_if_pressure {
                auto_apply_attempted = true;
                let out = try_auto_apply(
                    export_dir,
                    &found.plan_id,
                    &found.plan_hash,
                    &opts,
                    inprogress_count,
                    disk_used_ratio,
                    &PlanOrPreview::Found(found),
                );
                auto_apply_allowed = Some(out.allowed);
                auto_apply_allowed_reason = out.allowed_reason;
                if !out.allowed {
                    auto_apply_blocked_reason = out.blocked_reason;
                }
                apply_result = out.apply_result;
                auto_apply_applied = out.applied;
            }
        } else {
            let gc_opts = gc::GcPlanOpts {
                keep_days: opts.gc.keep_days,
                max_total_bytes: Some(opts.max_total_bytes),
                strategy: opts.gc.strategy.clone(),
                protect_last_n: opts.gc.protect_last_n as usize,
                plan_limit: opts.gc.plan_limit as usize,
                delete_limit: 10_000,
                protected_sample_size: 50,
                now_ts,
            };
            let plan_id = crate::util::id::new_uuid();
            let expires_at_ts = now_ts.saturating_add(plan_ttl);
            let (ref_, preview) = gc_plan::compute_and_save(
                export_dir,
                &gc_opts,
                &plan_id,
                now_ts,
                expires_at_ts,
                Some(&fp.fingerprint_hex),
                Some(fp.version),
            )?;
            gc_plan_ref = Some(ref_.clone());
            gc_plan_preview = Some(preview.clone());
            recommendation = Some("Apply plan via exports_gc_apply".to_string());
            recommendation_hint = Some(json!({
                "rpc": "exports_gc_apply",
                "params": { "plan_id": ref_.plan_id, "plan_hash": ref_.plan_hash }
            }));
            if pressure && opts.auto_apply_plan_if_pressure {
                auto_apply_attempted = true;
                let out = try_auto_apply(
                    export_dir,
                    &ref_.plan_id,
                    &ref_.plan_hash,
                    &opts,
                    inprogress_count,
                    disk_used_ratio,
                    &PlanOrPreview::Preview(&preview),
                );
                auto_apply_allowed = Some(out.allowed);
                auto_apply_allowed_reason = out.allowed_reason;
                if !out.allowed {
                    auto_apply_blocked_reason = out.blocked_reason;
                }
                apply_result = out.apply_result;
                auto_apply_applied = out.applied;
            }
        }
    }

    let ok = !pressure || stale_inprogress_count == 0;
    let plan_src = gc_plan_ref
        .as_ref()
        .map(|r| r.plan_source.as_str())
        .unwrap_or("none");
    let apply_str = if auto_apply_attempted {
        if auto_apply_applied {
            "applied"
        } else {
            "skipped"
        }
    } else {
        "no"
    };
    let blocked = auto_apply_blocked_reason
        .as_deref()
        .unwrap_or("");
    let blocked_suffix = if blocked.is_empty() {
        String::new()
    } else {
        format!(" ({})", blocked)
    };
    let freed_est = gc_plan_preview
        .as_ref()
        .map(|p| p.would_delete_total_bytes)
        .unwrap_or(0);
    let meets_target_str = gc_plan_preview
        .as_ref()
        .map(|p| p.meets_target.to_string())
        .unwrap_or_else(|| "null".to_string());
    let status_line = format!(
        "exports_auto_maintain ok={} pressure={} disk={:.3} stale={} inprog={} plan={} apply={}{} freed_est={} meets_target={}",
        ok,
        pressure,
        disk_used_ratio,
        stale_inprogress_count,
        inprogress_count,
        plan_src,
        apply_str,
        &blocked_suffix,
        freed_est,
        meets_target_str
    );
    let exit_code: i32 = if !ok {
        3
    } else if auto_apply_attempted && !auto_apply_applied && !blocked.is_empty() {
        2
    } else if pressure || stale_inprogress_count > 0 || inprogress_count > 0 {
        1
    } else {
        0
    };

    let log_path = path_sanitize::sanitize_exports_path(&opts.paths.maintain_log_path)
        .unwrap_or_else(|| opts.paths.maintain_log_path.clone());
    let mut local_log_written = false;
    let mut local_log_reason: Option<String> = None;
    let mut local_log_path_sanitize_warning: Option<String> = None;
    if path_sanitize::sanitize_exports_path(&opts.paths.maintain_log_path).is_none()
        && opts.paths.maintain_log_path != log_path
    {
        local_log_path_sanitize_warning =
            Some("local_log path override ignored (invalid); using default".to_string());
    }
    if opts.local_log_enabled {
        let line = if opts.local_log_include_timestamp {
            let ts = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);
            format!("{} {}{}", ts, opts.local_log_prefix, status_line)
        } else {
            format!("{}{}", opts.local_log_prefix, status_line)
        };
        match maintain_log::write_maintain_line(
            &log_path,
            &line,
            opts.local_log_max_lines,
            opts.local_log_max_bytes,
        ) {
            Ok(_) => local_log_written = true,
            Err(e) => local_log_reason = Some(format!("write_failed: {}", e)),
        }
    } else {
        local_log_reason = Some("disabled".to_string());
    }

    Ok(MaintainResult {
        accepted: true,
        status_line,
        exit_code,
        ok,
        pressure,
        disk_used_ratio,
        stale_inprogress_count,
        inprogress_count,
        state_fingerprint: fp.fingerprint_hex,
        state_fingerprint_version: fp.version,
        gc_plan_ref,
        gc_plan: gc_plan_preview,
        apply_result,
        auto_apply_attempted,
        auto_apply_allowed,
        auto_apply_allowed_reason,
        auto_apply_applied,
        auto_apply_blocked_reason,
        recommendation,
        recommendation_hint,
        suggestions,
        local_log_written,
        local_log_path: log_path,
        local_log_reason,
        local_log_path_sanitize_warning,
    })
}
