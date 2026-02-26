//! Apply safety checks (v1.0): allowed? + reason.

use super::types::{ApplySafety, GcPlanPreview};
use crate::exports::plans_store::FoundPlan;

pub fn check_allowed(
    inprogress_count: u64,
    disk_used_ratio: f64,
    plan: &PlanOrPreview,
    safety: &ApplySafety,
) -> (bool, Option<String>) {
    if safety.require_no_inprogress && inprogress_count > 0 {
        return (false, Some("inprogress_present".to_string()));
    }
    if disk_used_ratio >= safety.max_disk_pressure_ratio {
        return (false, Some("disk_pressure_too_high".to_string()));
    }
    let (wd_bytes, wd_count, meets_target) = match plan {
        PlanOrPreview::Found(f) => (
            f.summary_would_delete_total_bytes,
            f.summary_would_delete_count as u64,
            f.meets_target.unwrap_or(false),
        ),
        PlanOrPreview::Preview(p) => (
            p.would_delete_total_bytes,
            p.would_delete_count,
            p.meets_target,
        ),
    };
    if safety.require_meets_target && !meets_target {
        return (false, Some("plan_does_not_meet_target".to_string()));
    }
    if safety.max_would_delete_total_bytes > 0 && wd_bytes > safety.max_would_delete_total_bytes {
        return (false, Some("safety_limits_exceeded".to_string()));
    }
    if safety.max_would_delete_count > 0 && wd_count > safety.max_would_delete_count {
        return (false, Some("safety_limits_exceeded".to_string()));
    }
    (true, Some("ok".to_string()))
}

pub enum PlanOrPreview<'a> {
    Found(&'a FoundPlan),
    Preview(&'a GcPlanPreview),
}
