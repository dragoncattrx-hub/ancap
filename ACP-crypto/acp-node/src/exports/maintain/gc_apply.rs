//! Apply GC plan (v1.0). Wraps gc_apply.

use crate::exports::gc_apply::{self, ApplyOpts};

pub fn apply_plan(
    export_dir: &str,
    plan_id: &str,
    plan_hash: &str,
    max_delete_bytes: Option<u64>,
    max_delete_count: Option<usize>,
    sample_size: usize,
) -> Result<gc_apply::ApplySuccess, gc_apply::ApplyError> {
    let opts = ApplyOpts {
        max_delete_bytes,
        max_delete_count: max_delete_count.map(|u| u as u64),
        sample_size,
    };
    gc_apply::apply_plan(export_dir, plan_id, plan_hash, &opts)
}
