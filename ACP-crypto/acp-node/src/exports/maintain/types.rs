//! Typed options and results for exports maintenance (v1.0). JSON only at RPC boundary.

#[derive(Clone)]
pub struct MaintainPaths {
    pub exports_dir: String,
    pub plans_dir: String,
    pub lock_path: String,
    pub maintain_log_path: String,
}

#[derive(Clone)]
pub struct GcDefaults {
    pub strategy: String,
    pub keep_days: u64,
    pub protect_last_n: u64,
    pub plan_limit: u64,
    pub plan_ttl_seconds: u64,
    pub reuse_active_plan: bool,
    pub reuse_max_age_seconds: u64,
}

#[derive(Clone)]
pub struct ApplySafety {
    pub max_would_delete_total_bytes: u64,
    pub max_would_delete_count: u64,
    pub require_meets_target: bool,
    pub require_no_inprogress: bool,
    pub max_disk_pressure_ratio: f64,
}

#[derive(Clone)]
#[allow(dead_code)]
pub struct MaintainOpts {
    pub paths: MaintainPaths,
    pub max_total_bytes: u64,
    pub max_age_minutes: u64,

    pub auto_create_plan_if_pressure: bool,
    pub auto_apply_plan_if_pressure: bool,
    pub auto_apply_dry_run_only: bool,

    pub gc: GcDefaults,
    pub safety: ApplySafety,

    pub include_gc_plan_if_pressure: bool,
    pub include_parameter_suggestions: bool,

    pub local_log_enabled: bool,
    pub local_log_max_lines: usize,
    pub local_log_max_bytes: usize,
    pub local_log_include_timestamp: bool,
    pub local_log_prefix: String,
}

#[derive(Clone)]
pub struct StatusOpts {
    pub paths: MaintainPaths,
    pub max_total_bytes: Option<u64>,
    pub limit_samples: usize,
    pub max_age_minutes: u64,
    pub stale_sample_size: usize,
    pub include_maintain_log: bool,
    pub maintain_log_head_lines: usize,
    pub maintain_log_tail_lines: usize,
    pub maintain_log_max_bytes: usize,
}

#[derive(Debug)]
pub struct MaintainResult {
    pub accepted: bool,
    pub status_line: String,
    pub exit_code: i32,

    pub ok: bool,
    pub pressure: bool,
    pub disk_used_ratio: f64,
    pub stale_inprogress_count: u64,
    pub inprogress_count: u64,

    pub state_fingerprint: String,
    pub state_fingerprint_version: u32,

    pub gc_plan_ref: Option<GcPlanRef>,
    pub gc_plan: Option<GcPlanPreview>,
    pub apply_result: Option<serde_json::Value>,

    pub auto_apply_attempted: bool,
    pub auto_apply_allowed: Option<bool>,
    pub auto_apply_allowed_reason: Option<String>,
    pub auto_apply_applied: bool,
    pub auto_apply_blocked_reason: Option<String>,

    pub recommendation: Option<String>,
    pub recommendation_hint: Option<serde_json::Value>,
    pub suggestions: Vec<serde_json::Value>,

    pub local_log_written: bool,
    pub local_log_path: String,
    pub local_log_reason: Option<String>,
    pub local_log_path_sanitize_warning: Option<String>,
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct StatusResult {
    pub accepted: bool,
    pub status: serde_json::Value,
    pub samples: Option<serde_json::Value>,
}

#[derive(Clone, Debug)]
pub struct GcPlanRef {
    pub plan_id: String,
    pub plan_hash: String,
    pub expires_at_ts: u64,
    pub plan_source: String,
}

#[derive(Clone, Debug)]
pub struct GcPlanPreview {
    pub would_delete_count: u64,
    pub would_delete_total_bytes: u64,
    pub meets_target: bool,
    pub cannot_reach_target: bool,
    pub min_possible_total_bytes: Option<u64>,
    pub entries: Vec<serde_json::Value>,
}
