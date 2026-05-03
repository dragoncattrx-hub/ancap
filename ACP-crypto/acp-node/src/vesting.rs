//! Creator-vesting validation. The **on-chain rules** (69.3M vout0, cliff, linear unlock) are
//! only compiled in when you build with `--features enforced-creator-vesting`. The default
//! `cargo build --release` has **no** vesting checks, so custom genesis and local bulk sends
//! cannot be blocked by env/launcher mistakes.

use crate::storage::rocks::Rocks;
use crate::storage::Storage;

#[cfg(feature = "enforced-creator-vesting")]
use anyhow::Result;
#[cfg(feature = "enforced-creator-vesting")]
use acp_crypto::{Block, Transaction};
#[cfg(feature = "enforced-creator-vesting")]
use crate::mempool::Mempool;

#[cfg(feature = "enforced-creator-vesting")]
#[path = "enforced_vesting.rs"]
mod enforced_vesting;

/// For logs: which vesting env vars the process has (relevant when `enforced-creator-vesting` is enabled).
pub fn env_diagnostics() -> String {
    fn v(name: &str) -> String {
        match std::env::var(name) {
            Ok(s) if s.trim().is_empty() => "empty".to_string(),
            Ok(s) => s,
            Err(_) => "unset".to_string(),
        }
    }
    let suffix = if cfg!(feature = "enforced-creator-vesting") {
        " (enforced-creator-vesting feature: on)"
    } else {
        " (enforced-creator-vesting feature: off; vesting code not in binary)"
    };
    format!(
        "creator_vesting env: ACP_ENFORCE_CREATOR_VESTING={} ACP_DISABLE_CREATOR_VESTING={}{}",
        v("ACP_ENFORCE_CREATOR_VESTING"),
        v("ACP_DISABLE_CREATOR_VESTING"),
        suffix
    )
}

pub fn diagnostic_line(storage: &Storage<Rocks>) -> String {
    #[cfg(feature = "enforced-creator-vesting")]
    {
        enforced_vesting::diagnostic_line(storage)
    }
    #[cfg(not(feature = "enforced-creator-vesting"))]
    {
        let _ = storage;
        "creator_vesting: off (default build; recompile with --features enforced-creator-vesting for 69.3M rules)"
            .to_string()
    }
}

#[cfg(feature = "enforced-creator-vesting")]
pub fn validate_tx_creator_vesting(
    storage: &Storage<Rocks>,
    mempool: &Mempool,
    tx: &Transaction,
    now_time: u64,
) -> Result<()> {
    enforced_vesting::validate_tx_creator_vesting(storage, mempool, tx, now_time)
}

#[cfg(feature = "enforced-creator-vesting")]
pub fn validate_block_creator_vesting(storage: &Storage<Rocks>, block: &Block) -> Result<()> {
    enforced_vesting::validate_block_creator_vesting(storage, block)
}
