//! Node config (chain_id, data_dir, rpc_listen, [exports], [protocol]).
//!
//! При реализации Genesis и PoS: лимиты эмиссии и правила по умолчанию берутся из
//! `acp_crypto::protocol_params`. Опциональные переопределения — через секцию `[protocol]` в TOML.
//!
//! Config file (--config path): supports [rpc] listen, [storage] data_dir, top-level peer_rpc_urls.

use serde::Deserialize;

/// Exports maintain apply_safety (v0.97: [exports.maintain.apply_safety]).
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct ExportsMaintainApplySafety {
    pub max_would_delete_total_bytes: Option<u64>,
    pub max_would_delete_count: Option<u64>,
    pub require_meets_target: Option<bool>,
    pub require_no_inprogress: Option<bool>,
    pub max_disk_pressure_ratio: Option<f64>,
}

/// Exports maintain gc_defaults (v0.97: [exports.maintain.gc_defaults]).
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct ExportsMaintainGcDefaults {
    pub strategy: Option<String>,
    pub keep_days: Option<u64>,
    pub protect_last_n: Option<usize>,
    pub plan_limit: Option<usize>,
    pub plan_ttl_seconds: Option<u64>,
    pub reuse_active_plan: Option<bool>,
    pub reuse_max_age_seconds: Option<u64>,
}

/// Exports maintain section (v0.97: [exports.maintain]).
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct ExportsMaintainConfig {
    pub max_total_bytes: Option<u64>,
    pub max_age_minutes: Option<u64>,
    pub auto_create_plan_if_pressure: Option<bool>,
    pub auto_apply_plan_if_pressure: Option<bool>,
    pub auto_apply_dry_run_only: Option<bool>,
    pub apply_safety: Option<ExportsMaintainApplySafety>,
    pub gc_defaults: Option<ExportsMaintainGcDefaults>,
}

/// Exports/GC section (e.g. in /etc/acp/acp-node.toml as [exports]).
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct ExportsConfig {
    /// Exports root directory.
    pub dir: Option<String>,
    /// Plans subdirectory (default: <dir>/.plans).
    pub plans_dir: Option<String>,
    /// TTL for new GC plans (seconds). Used when params.plan_ttl_seconds not set.
    pub plan_ttl_seconds: Option<u64>,
    pub default_keep_days: Option<u64>,
    pub default_protect_last_n: Option<usize>,
    pub default_plan_limit: Option<usize>,
    /// v0.97: [exports.maintain] — defaults for exports_auto_maintain.
    pub maintain: Option<ExportsMaintainConfig>,
}

/// Reference bits for difficulty (Bitcoin-like genesis). Used by difficulty_from_bits.
pub const GENESIS_BITS: u32 = 0x1d00ffff;

/// Max allowed header time drift into future (seconds).
pub const MAX_FUTURE_DRIFT_SECS: u64 = 2 * 60 * 60; // 2 hours

/// If an invalid ancestor is deeper than this distance, revalidate is denied (finality policy).
pub const REVALIDATE_INVALID_ANCESTOR_MAX_DEPTH: u64 = 2000;

/// Cap how deep we walk back when checking ancestors (DoS guard).
pub const REVALIDATE_ANCESTOR_SCAN_LIMIT: u64 = 50_000;

/// Max length of best header chain path returned by getbestheaderchainpath.
pub const BEST_CHAIN_PATH_LIMIT: usize = 200_000;

/// Max elements in each path returned by bestchaindiff.
pub const CHAIN_DIFF_LIMIT: usize = 10_000;

/// Safety bound when walking prev in find_common_ancestor / build_path.
pub const CHAIN_DIFF_SCAN_LIMIT: u64 = 200_000;

/// Optional protocol overrides (Genesis/PoS). Defaults = acp_crypto::protocol_params.
/// When loading from TOML, use [protocol] section. Omitted fields fall back to crate constants.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
pub struct ProtocolConfig {
    /// Base supply at Genesis (default: acp_crypto::BASE_SUPPLY_ACP).
    pub base_supply_acp: Option<u64>,
    /// Annual emission ACP (default: acp_crypto::ANNUAL_EMISSION_ACP).
    pub annual_emission_acp: Option<u64>,
    /// Stake cap per validator, percent of total staked (default: acp_crypto::STAKE_CAP_PCT).
    pub stake_cap_pct: Option<u8>,
    /// Unbonding period in days (default: acp_crypto::UNBONDING_DAYS).
    pub unbonding_days: Option<u16>,
}

impl ProtocolConfig {
    /// Base supply: config override or acp_crypto default.
    pub fn base_supply_acp(&self) -> u64 {
        self.base_supply_acp
            .unwrap_or(acp_crypto::BASE_SUPPLY_ACP)
    }
    /// Annual emission: config override or acp_crypto default.
    pub fn annual_emission_acp(&self) -> u64 {
        self.annual_emission_acp
            .unwrap_or(acp_crypto::ANNUAL_EMISSION_ACP)
    }
    /// Stake cap percent: config override or acp_crypto default.
    pub fn stake_cap_pct(&self) -> u8 {
        self.stake_cap_pct
            .unwrap_or(acp_crypto::STAKE_CAP_PCT)
    }
    /// Unbonding days: config override or acp_crypto default.
    pub fn unbonding_days(&self) -> u16 {
        self.unbonding_days
            .unwrap_or(acp_crypto::UNBONDING_DAYS)
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default)]
pub struct NodeConfig {
    pub chain_id: u32,
    pub data_dir: String,

    pub rpc_listen: String, // "127.0.0.1:8545"
    /// Optional shared token for RPC authentication (recommended if exposed to the internet).
    pub rpc_token: Option<String>,

    /// URLs of peer RPC endpoints for block relay (POST submitblock). Example: ["http://node2:8545/rpc", "http://node3:8545/rpc"].
    pub peer_rpc_urls: Option<Vec<String>>,

    /// Exports/GC options. When loading from TOML, use [exports] section.
    pub exports: Option<ExportsConfig>,

    /// Protocol overrides (Genesis, emission, PoS). Defaults from acp_crypto::protocol_params.
    pub protocol: Option<ProtocolConfig>,

    /// If true, a background task builds a block from the first tx in mempool every miner_interval_secs and submits it.
    pub miner_enabled: bool,
    /// Interval in seconds between miner attempts (when mempool is non-empty).
    pub miner_interval_secs: u64,
}

impl Default for NodeConfig {
    fn default() -> Self {
        Self {
            chain_id: 1001,
            data_dir: "/var/lib/acp-node".into(),
            rpc_listen: "127.0.0.1:8545".into(),
            rpc_token: None,
            peer_rpc_urls: None,
            exports: None,
            protocol: None,
            miner_enabled: true,
            miner_interval_secs: 10,
        }
    }
}

/// TOML file layout: [rpc] listen, [storage] data_dir, optional peer_rpc_urls (sync over internet).
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct RpcSection {
    pub listen: Option<String>,
    pub token: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct StorageSection {
    pub data_dir: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct FileConfig {
    pub rpc: Option<RpcSection>,
    pub storage: Option<StorageSection>,
    /// Peer RPC URLs for block relay (submitblock). Enables sync over internet.
    pub peer_rpc_urls: Option<Vec<String>>,
}

impl FileConfig {
    /// Load from TOML path. Returns None if path missing or parse error.
    pub fn load(path: &std::path::Path) -> Option<Self> {
        let s = std::fs::read_to_string(path).ok()?;
        toml::from_str(&s).ok()
    }

    pub fn apply_to(&self, cfg: &mut NodeConfig) {
        if let Some(ref r) = self.rpc {
            if let Some(ref listen) = r.listen {
                if !listen.is_empty() {
                    cfg.rpc_listen = listen.clone();
                }
            }
            if let Some(ref token) = r.token {
                let t = token.trim();
                if !t.is_empty() {
                    cfg.rpc_token = Some(t.to_string());
                }
            }
        }
        if let Some(ref s) = self.storage {
            if let Some(ref d) = s.data_dir {
                if !d.is_empty() {
                    cfg.data_dir = d.clone();
                }
            }
        }
        if let Some(ref urls) = self.peer_rpc_urls {
            if !urls.is_empty() {
                cfg.peer_rpc_urls = Some(urls.clone());
            }
        }
    }
}
