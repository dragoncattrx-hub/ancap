//! Exports maintenance v1.0: minimal public API. RPC are thin wrappers.

mod auto;
mod config;
mod fingerprint;
mod gc_apply;
mod gc_plan;
mod log;
mod plans;
mod safety;
mod status;
mod types;

pub use types::{MaintainOpts, MaintainPaths, MaintainResult, StatusOpts, StatusResult};

/// Run full maintain cycle: scan, fingerprint, plan (reuse or create), safety, apply, log.
pub fn maintain_run(opts: MaintainOpts) -> anyhow::Result<MaintainResult> {
    auto::maintain_run(opts)
}

/// Read exports status and optional samples (including maintain_log when requested).
pub fn exports_status(opts: StatusOpts) -> anyhow::Result<StatusResult> {
    status::exports_status(opts)
}

/// Build MaintainOpts defaults from node config. RPC overlays params on top.
pub fn opts_from_config(cfg: &crate::config::ExportsConfig, data_dir: &str) -> MaintainOpts {
    config::opts_from_config(cfg, data_dir)
}

/// MaintainOpts when exports config is absent (default_paths + literal defaults).
pub fn default_opts(data_dir: &str) -> MaintainOpts {
    config::default_opts(data_dir)
}

/// Apply JSON-RPC params overrides onto MaintainOpts (exports_auto_maintain / exports_health).
pub fn apply_param_overrides(opts: &mut MaintainOpts, params: &serde_json::Value) {
    config::apply_param_overrides(opts, params);
}

/// Default paths when exports config is absent. RPC uses this for StatusOpts/MaintainOpts.
pub fn default_paths(data_dir: &str) -> MaintainPaths {
    config::default_paths(data_dir)
}
