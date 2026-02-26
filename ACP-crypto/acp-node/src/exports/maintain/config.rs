//! Build MaintainOpts defaults from node config (v1.0).

use crate::config::ExportsConfig;
use super::types::{ApplySafety, GcDefaults, MaintainOpts, MaintainPaths};

// Single source of default values (used by default_opts and opts_from_config).
const DEFAULT_STRATEGY: &str = "bytes_only";
const DEFAULT_KEEP_DAYS: u64 = 7;
const DEFAULT_PROTECT_LAST_N: u64 = 5;
const DEFAULT_PLAN_LIMIT: u64 = 200;
const DEFAULT_PLAN_TTL_SECONDS: u64 = 600;
const DEFAULT_REUSE_MAX_AGE_SECONDS: u64 = 300;
const DEFAULT_MAX_TOTAL_BYTES: u64 = 3_000_000_000;
const DEFAULT_MAX_AGE_MINUTES: u64 = 60;
const DEFAULT_MAX_WOULD_DELETE_BYTES: u64 = 2_000_000_000;
const DEFAULT_MAX_WOULD_DELETE_COUNT: u64 = 500;
const DEFAULT_MAX_DISK_PRESSURE_RATIO: f64 = 0.95;
const DEFAULT_LOCAL_LOG_MAX_LINES: usize = 2000;
const DEFAULT_LOCAL_LOG_MAX_BYTES: usize = 2_000_000;

/// MaintainOpts when exports config is absent (default_paths + literal defaults).
pub fn default_opts(data_dir: &str) -> MaintainOpts {
    let paths = default_paths(data_dir);
    let gc = GcDefaults {
        strategy: DEFAULT_STRATEGY.to_string(),
        keep_days: DEFAULT_KEEP_DAYS,
        protect_last_n: DEFAULT_PROTECT_LAST_N,
        plan_limit: DEFAULT_PLAN_LIMIT,
        plan_ttl_seconds: DEFAULT_PLAN_TTL_SECONDS,
        reuse_active_plan: true,
        reuse_max_age_seconds: DEFAULT_REUSE_MAX_AGE_SECONDS,
    };
    let safety = ApplySafety {
        max_would_delete_total_bytes: DEFAULT_MAX_WOULD_DELETE_BYTES,
        max_would_delete_count: DEFAULT_MAX_WOULD_DELETE_COUNT,
        require_meets_target: true,
        require_no_inprogress: true,
        max_disk_pressure_ratio: DEFAULT_MAX_DISK_PRESSURE_RATIO,
    };
    MaintainOpts {
        paths,
        max_total_bytes: DEFAULT_MAX_TOTAL_BYTES,
        max_age_minutes: DEFAULT_MAX_AGE_MINUTES,
        auto_create_plan_if_pressure: true,
        auto_apply_plan_if_pressure: false,
        auto_apply_dry_run_only: true,
        gc,
        safety,
        include_gc_plan_if_pressure: false,
        include_parameter_suggestions: false,
        local_log_enabled: true,
        local_log_max_lines: DEFAULT_LOCAL_LOG_MAX_LINES,
        local_log_max_bytes: DEFAULT_LOCAL_LOG_MAX_BYTES,
        local_log_include_timestamp: true,
        local_log_prefix: "acp ".to_string(),
    }
}

/// Apply JSON-RPC params overrides onto MaintainOpts (for exports_auto_maintain / exports_health).
pub fn apply_param_overrides(opts: &mut MaintainOpts, params: &serde_json::Value) {
    let p = match params.as_object() {
        Some(m) => m,
        None => return,
    };
    if let Some(v) = p.get("max_total_bytes").and_then(|v| v.as_u64()) {
        opts.max_total_bytes = v;
    }
    if let Some(v) = p.get("max_age_minutes").and_then(|v| v.as_u64()) {
        opts.max_age_minutes = v;
    }
    if let Some(v) = p.get("auto_create_plan_if_pressure").and_then(|v| v.as_bool()) {
        opts.auto_create_plan_if_pressure = v;
    }
    if let Some(v) = p.get("auto_apply_plan_if_pressure").and_then(|v| v.as_bool()) {
        opts.auto_apply_plan_if_pressure = v;
    }
    if let Some(v) = p.get("auto_apply_dry_run_only").and_then(|v| v.as_bool()) {
        opts.auto_apply_dry_run_only = v;
    }
    if let Some(gc) = p.get("gc").and_then(|v| v.as_object()) {
        if let Some(v) = gc.get("keep_days").and_then(|v| v.as_u64()) {
            opts.gc.keep_days = v;
        }
        if let Some(v) = gc.get("protect_last_n").and_then(|v| v.as_u64()) {
            opts.gc.protect_last_n = v;
        }
        if let Some(v) = gc.get("plan_limit").and_then(|v| v.as_u64()) {
            opts.gc.plan_limit = v;
        }
        if let Some(v) = gc.get("strategy").and_then(|v| v.as_str()) {
            opts.gc.strategy = v.to_string();
        }
    }
    if let Some(safe) = p.get("safety").and_then(|v| v.as_object()) {
        if let Some(v) = safe.get("max_would_delete_total_bytes").and_then(|v| v.as_u64()) {
            opts.safety.max_would_delete_total_bytes = v;
        }
        if let Some(v) = safe.get("max_would_delete_count").and_then(|v| v.as_u64()) {
            opts.safety.max_would_delete_count = v;
        }
    }
}

pub fn default_paths(data_dir: &str) -> MaintainPaths {
    let base = data_dir.trim_end_matches('/');
    let exports_dir = format!("{}/exports", base);
    MaintainPaths {
        exports_dir: exports_dir.clone(),
        plans_dir: format!("{}/.plans", exports_dir),
        lock_path: format!("{}/.lock", exports_dir),
        maintain_log_path: format!("{}/maintain.log", exports_dir),
    }
}

pub fn opts_from_config(cfg: &ExportsConfig, data_dir: &str) -> MaintainOpts {
    let paths = cfg.dir.as_deref().map(|d| {
        let plans_dir = cfg.plans_dir.clone().unwrap_or_else(|| format!("{}/.plans", d));
        MaintainPaths {
            exports_dir: d.to_string(),
            plans_dir: plans_dir.clone(),
            lock_path: format!("{}/.lock", d),
            maintain_log_path: format!("{}/maintain.log", d),
        }
    }).unwrap_or_else(|| default_paths(data_dir));

    let m = cfg.maintain.as_ref();
    let gc_cfg = m.and_then(|x| x.gc_defaults.as_ref());
    let safe_cfg = m.and_then(|x| x.apply_safety.as_ref());

    let gc = GcDefaults {
        strategy: gc_cfg.and_then(|g| g.strategy.clone()).unwrap_or_else(|| DEFAULT_STRATEGY.to_string()),
        keep_days: gc_cfg.and_then(|g| g.keep_days).or(cfg.default_keep_days).unwrap_or(DEFAULT_KEEP_DAYS),
        protect_last_n: gc_cfg.and_then(|g| g.protect_last_n).map(|u| u as u64).or(cfg.default_protect_last_n.map(|u| u as u64)).unwrap_or(DEFAULT_PROTECT_LAST_N),
        plan_limit: gc_cfg.and_then(|g| g.plan_limit).map(|u| u as u64).or(cfg.default_plan_limit.map(|u| u as u64)).unwrap_or(DEFAULT_PLAN_LIMIT),
        plan_ttl_seconds: gc_cfg.and_then(|g| g.plan_ttl_seconds).or(cfg.plan_ttl_seconds).unwrap_or(DEFAULT_PLAN_TTL_SECONDS),
        reuse_active_plan: gc_cfg.and_then(|g| g.reuse_active_plan).unwrap_or(true),
        reuse_max_age_seconds: gc_cfg.and_then(|g| g.reuse_max_age_seconds).unwrap_or(DEFAULT_REUSE_MAX_AGE_SECONDS),
    };

    let safety = ApplySafety {
        max_would_delete_total_bytes: safe_cfg.and_then(|s| s.max_would_delete_total_bytes).unwrap_or(DEFAULT_MAX_WOULD_DELETE_BYTES),
        max_would_delete_count: safe_cfg.and_then(|s| s.max_would_delete_count).unwrap_or(DEFAULT_MAX_WOULD_DELETE_COUNT),
        require_meets_target: safe_cfg.and_then(|s| s.require_meets_target).unwrap_or(true),
        require_no_inprogress: safe_cfg.and_then(|s| s.require_no_inprogress).unwrap_or(true),
        max_disk_pressure_ratio: safe_cfg.and_then(|s| s.max_disk_pressure_ratio).unwrap_or(DEFAULT_MAX_DISK_PRESSURE_RATIO),
    };

    MaintainOpts {
        paths: paths.clone(),
        max_total_bytes: m.and_then(|x| x.max_total_bytes).unwrap_or(DEFAULT_MAX_TOTAL_BYTES),
        max_age_minutes: m.and_then(|x| x.max_age_minutes).unwrap_or(DEFAULT_MAX_AGE_MINUTES),
        auto_create_plan_if_pressure: m.and_then(|x| x.auto_create_plan_if_pressure).unwrap_or(true),
        auto_apply_plan_if_pressure: m.and_then(|x| x.auto_apply_plan_if_pressure).unwrap_or(false),
        auto_apply_dry_run_only: m.and_then(|x| x.auto_apply_dry_run_only).unwrap_or(true),
        gc,
        safety,
        include_gc_plan_if_pressure: false,
        include_parameter_suggestions: false,
        local_log_enabled: true,
        local_log_max_lines: DEFAULT_LOCAL_LOG_MAX_LINES,
        local_log_max_bytes: DEFAULT_LOCAL_LOG_MAX_BYTES,
        local_log_include_timestamp: true,
        local_log_prefix: "acp ".to_string(),
    }
}
