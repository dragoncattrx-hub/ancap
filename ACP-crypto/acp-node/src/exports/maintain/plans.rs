//! Plan store: find reusable (v1.0). Thin wrapper over plans_store.

use crate::exports::plans_store::{self, PlanMatch};

pub fn find_reusable_active_plan(
    plans_dir: &str,
    now_ts: u64,
    reuse_max_age_seconds: u64,
    m: &PlanMatch,
    current_version: u32,
    current_fingerprint: &str,
) -> anyhow::Result<Option<plans_store::FoundPlan>> {
    plans_store::find_reusable_active_plan(
        plans_dir,
        now_ts,
        reuse_max_age_seconds,
        m,
        current_version,
        current_fingerprint,
    )
}
