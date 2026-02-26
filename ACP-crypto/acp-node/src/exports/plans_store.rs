//! Find a reusable active GC plan by matching opts (v0.93 idempotent auto_maintain).
//! v0.96: atomic_write_json for plan GC audit.

use std::fs;
use std::path::Path;

/// Options to match when looking for a reusable plan.
#[derive(Clone)]
pub struct PlanMatch {
    pub max_total_bytes: u64,
    pub strategy: String,
    pub keep_days: u64,
    pub protect_last_n: u64,
    pub plan_limit: u64,
}

/// A plan that can be reused (active, fresh, opts match).
#[derive(Clone)]
pub struct FoundPlan {
    pub plan_id: String,
    pub plan_hash: String,
    pub created_at_ts: u64,
    pub expires_at_ts: u64,
    pub summary_would_delete_total_bytes: u64,
    pub summary_would_delete_count: u64,
    pub meets_target: Option<bool>,
}

/// Find the newest active plan in `plans_dir` that is fresh (created_at_ts >= now_ts - reuse_max_age_seconds),
/// not expired (expires_at_ts >= now_ts), opts match `m`, state_fingerprint_version matches `current_version`,
/// and state_fingerprint matches `current_fingerprint` (v0.94/v0.95).
pub fn find_reusable_active_plan(
    plans_dir: &str,
    now_ts: u64,
    reuse_max_age_seconds: u64,
    m: &PlanMatch,
    current_version: u32,
    current_fingerprint: &str,
) -> anyhow::Result<Option<FoundPlan>> {
    let cutoff = now_ts.saturating_sub(reuse_max_age_seconds);
    let mut best: Option<FoundPlan> = None;

    let rd = match fs::read_dir(plans_dir) {
        Ok(r) => r,
        Err(_) => return Ok(None),
    };

    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if !name.ends_with(".json") {
            continue;
        }
        if name.contains(".stale.") {
            continue;
        }
        let path = format!("{}/{}", plans_dir, name);

        let s = match fs::read_to_string(&path) {
            Ok(s) => s,
            Err(_) => continue,
        };
        let v: serde_json::Value = match serde_json::from_str(&s) {
            Ok(v) => v,
            Err(_) => continue,
        };

        let status = v.get("status").and_then(|x| x.as_str()).unwrap_or("active");
        if status != "active" {
            continue;
        }

        let created_at_ts = v.get("created_at_ts").and_then(|x| x.as_u64()).unwrap_or(0);
        if created_at_ts < cutoff {
            continue;
        }

        let expires_at_ts = v.get("expires_at_ts").and_then(|x| x.as_u64()).unwrap_or(0);
        if expires_at_ts < now_ts {
            continue;
        }

        let vver = v
            .get("state_fingerprint_version")
            .and_then(|x| x.as_u64())
            .unwrap_or(0) as u32;
        if vver != current_version {
            continue;
        }

        let pfp = v
            .get("state_fingerprint")
            .and_then(|x| x.as_str())
            .unwrap_or("");
        if pfp != current_fingerprint {
            continue;
        }

        let opts = v.get("opts").cloned().unwrap_or(serde_json::Value::Null);
        let max_total_bytes = opts.get("max_total_bytes").and_then(|x| x.as_u64()).unwrap_or(0);
        let strategy = opts
            .get("strategy")
            .and_then(|x| x.as_str())
            .unwrap_or("")
            .to_string();
        let keep_days = opts.get("keep_days").and_then(|x| x.as_u64()).unwrap_or(0);
        let protect_last_n = opts.get("protect_last_n").and_then(|x| x.as_u64()).unwrap_or(0);
        let plan_limit = opts.get("plan_limit").and_then(|x| x.as_u64()).unwrap_or(0);

        if max_total_bytes != m.max_total_bytes {
            continue;
        }
        if strategy != m.strategy {
            continue;
        }
        if keep_days != m.keep_days {
            continue;
        }
        if protect_last_n != m.protect_last_n {
            continue;
        }
        if plan_limit != m.plan_limit {
            continue;
        }

        let plan_id = v.get("plan_id").and_then(|x| x.as_str()).unwrap_or("").to_string();
        let plan_hash = v.get("plan_hash").and_then(|x| x.as_str()).unwrap_or("").to_string();
        if plan_id.is_empty() || plan_hash.is_empty() {
            continue;
        }

        let summary = v.get("summary");
        let wd_bytes = summary
            .and_then(|s| s.get("would_delete_total_bytes"))
            .and_then(|x| x.as_u64())
            .unwrap_or(0);
        let wd_count = summary
            .and_then(|s| s.get("would_delete_count"))
            .and_then(|x| x.as_u64())
            .unwrap_or(0);
        let meets_target = v.get("meets_target").and_then(|x| x.as_bool());

        let cand = FoundPlan {
            plan_id,
            plan_hash,
            created_at_ts,
            expires_at_ts,
            summary_would_delete_total_bytes: wd_bytes,
            summary_would_delete_count: wd_count,
            meets_target,
        };

        let better = match &best {
            None => true,
            Some(b) => cand.created_at_ts > b.created_at_ts,
        };
        if better {
            best = Some(cand);
        }
    }

    Ok(best)
}

/// Write JSON to file atomically (write to .tmp then rename). Used for audit before plan delete (v0.96).
pub fn atomic_write_json(path: &str, value: &serde_json::Value) -> anyhow::Result<()> {
    let p = Path::new(path);
    let tmp_path = p
        .parent()
        .map(|parent| parent.join(p.file_name().unwrap_or_default().to_string_lossy().to_string() + ".tmp"))
        .unwrap_or_else(|| Path::new(&(path.to_string() + ".tmp")).to_path_buf());
    let json = serde_json::to_string_pretty(value)?;
    fs::write(&tmp_path, json)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}
