//! Compute GC plan and save to store (v1.0). Wraps gc + gc_plan_store.

use super::types::{GcPlanPreview, GcPlanRef};
use crate::exports::gc;
use crate::exports::gc_plan_store;

pub fn compute_and_save(
    export_dir: &str,
    opts: &gc::GcPlanOpts,
    plan_id: &str,
    now_ts: u64,
    expires_at_ts: u64,
    state_fingerprint: Option<&str>,
    state_fingerprint_version: Option<u32>,
) -> anyhow::Result<(GcPlanRef, GcPlanPreview)> {
    let result = gc::compute_gc_plan(export_dir, opts.clone())?;
    let opts_stored = gc_plan_store::GcPlanOptsStored {
        keep_days: opts.keep_days,
        max_total_bytes: opts.max_total_bytes,
        strategy: opts.strategy.clone(),
        protect_last_n: opts.protect_last_n,
        plan_limit: opts.plan_limit,
        delete_limit: opts.delete_limit,
        protected_sample_size: opts.protected_sample_size,
    };
    let plan_hash = gc_plan_store::save_plan(
        export_dir,
        plan_id,
        now_ts,
        expires_at_ts,
        &opts_stored,
        &result,
        state_fingerprint,
        state_fingerprint_version,
    )?;
    let maxb = opts.max_total_bytes.unwrap_or(0);
    let meets_target = result.projected_after_total_bytes <= maxb;
    let ref_ = GcPlanRef {
        plan_id: plan_id.to_string(),
        plan_hash,
        expires_at_ts,
        plan_source: "created".to_string(),
    };
    let preview = GcPlanPreview {
        would_delete_count: result.would_delete_count as u64,
        would_delete_total_bytes: result.would_delete_total_bytes,
        meets_target,
        cannot_reach_target: result.cannot_reach_target,
        min_possible_total_bytes: result.min_possible_total_bytes,
        entries: result.would_delete,
    };
    Ok((ref_, preview))
}
