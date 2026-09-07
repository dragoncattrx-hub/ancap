//! Automatic miner: packs fee-prioritized mempool txs into blocks and optionally
//! emits energy-efficient heartbeat (emission-only) blocks when idle.
//!
//! Controlled by config: miner_enabled, miner_interval_secs, miner_heartbeat_*,
//! miner_max_txs_per_block (env: ACP_MINER_*).

use std::sync::Arc;

use acp_crypto::{protocol_params, Block, BlockHeader, Transaction};
use tracing::{debug, info, warn};

use crate::config::GENESIS_BITS;
use crate::rpc::handlers::RpcCtx;

struct PackedTx {
    txid: [u8; 32],
    tx: Transaction,
    wire_len: usize,
}

fn pack_mempool_txs(ctx: &RpcCtx, chain_id: u32, reserve_bytes: usize) -> Vec<PackedTx> {
    let max_txs = ctx.config.miner_max_txs_per_block.max(1);
    let budget = (protocol_params::MAX_BLOCK_BYTES as usize).saturating_sub(reserve_bytes.max(256));

    let mut candidates: Vec<(u64, PackedTx)> = Vec::new();
    for txid in ctx.mempool.txids() {
        let Some(wire) = ctx.mempool.get(&txid) else {
            continue;
        };
        let tx = match Transaction::from_wire(&wire) {
            Ok(t) => t,
            Err(e) => {
                warn!("miner: decode tx failed: {}", e);
                let _ = ctx.mempool.remove(&txid);
                continue;
            }
        };
        if tx.chain_id != chain_id {
            let _ = ctx.mempool.remove(&txid);
            continue;
        }
        let fee = tx.fee().unwrap_or(0);
        candidates.push((
            fee,
            PackedTx {
                txid,
                tx,
                wire_len: wire.len(),
            },
        ));
    }

    // Highest fee first — competitive inclusion under load.
    candidates.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.wire_len.cmp(&b.1.wire_len)));

    let mut packed = Vec::new();
    let mut used = 0usize;
    for (_fee, item) in candidates {
        if packed.len() >= max_txs {
            break;
        }
        let next = used.saturating_add(item.wire_len).saturating_add(4);
        if next > budget {
            continue;
        }
        used = next;
        packed.push(item);
    }
    packed
}

async fn relay_block(ctx: &RpcCtx, block_hex: String) {
    let Some(ref urls) = ctx.config.peer_rpc_urls else {
        return;
    };
    let urls_relay = urls.clone();
    let token = ctx.config.rpc_token.clone();
    tokio::spawn(async move {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| reqwest::Client::new());
        for url in urls_relay {
            let body = serde_json::json!({
                "jsonrpc": "2.0",
                "method": "submitblock",
                "params": { "block": block_hex },
                "id": 1
            });
            let mut req = client.post(&url).json(&body);
            if let Some(t) = token.as_deref() {
                req = req.header("x-acp-rpc-token", t);
            }
            if let Err(e) = req.send().await {
                tracing::warn!(%url, "miner block relay failed: {}", e);
            }
        }
    });
}

pub async fn run_miner_loop(ctx: Arc<RpcCtx>) {
    let interval_secs = ctx.config.miner_interval_secs.max(1);
    let chain_id = ctx.config.chain_id;
    let heartbeat_every = ctx.config.miner_heartbeat_every_n_ticks.max(1);
    let mut idle_ticks: u64 = 0;

    info!(
        "miner started (lean packer: interval_secs={}, max_txs={}, heartbeat={}, every_n={}, chain_id={})",
        interval_secs,
        ctx.config.miner_max_txs_per_block,
        ctx.config.miner_heartbeat_enabled,
        heartbeat_every,
        chain_id
    );

    let mut interval = tokio::time::interval(std::time::Duration::from_secs(interval_secs));
    interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

    loop {
        interval.tick().await;

        let best_height = match ctx.chain.storage.best_height() {
            Ok(h) => h,
            Err(e) => {
                warn!("miner: best_height failed: {}", e);
                continue;
            }
        };

        let prev_blockhash = match ctx.chain.storage.get_blockhash_by_height(best_height) {
            Ok(Some(bh)) => bh,
            Ok(None) => {
                debug!("miner: no block at height {} (empty chain?)", best_height);
                continue;
            }
            Err(e) => {
                warn!("miner: get_blockhash_by_height failed: {}", e);
                continue;
            }
        };

        let packed = pack_mempool_txs(&ctx, chain_id, 512);
        let heartbeat_due = ctx.config.miner_heartbeat_enabled
            && packed.is_empty()
            && {
                idle_ticks = idle_ticks.saturating_add(1);
                idle_ticks >= heartbeat_every
            };

        if packed.is_empty() && !heartbeat_due {
            continue;
        }
        if heartbeat_due {
            idle_ticks = 0;
        } else {
            idle_ticks = 0;
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let mut txs: Vec<Transaction> = Vec::with_capacity(packed.len() + 1);
        let mut included_ids: Vec<[u8; 32]> = Vec::with_capacity(packed.len());

        if let Some(ref payout_address) = ctx.config.miner_reward_address {
            match crate::emission::emission_available_now_units(&ctx.chain.storage, now) {
                Ok(available) if available > 0 => {
                    let target_per_block = (protocol_params::ANNUAL_EMISSION_ACP as u128)
                        .saturating_mul(acp_crypto::UNITS_PER_ACP as u128)
                        / ((365u128 * 24 * 60 * 60)
                            / (protocol_params::TARGET_BLOCK_TIME_SEC as u128).max(1));
                    let reward_units = available.min(target_per_block.max(1) as u64);
                    match crate::emission::build_miner_emission_tx(chain_id, payout_address, reward_units)
                    {
                        Ok(reward_tx) => txs.push(reward_tx),
                        Err(e) => warn!("miner: emission tx build failed: {}", e),
                    }
                }
                Ok(_) => {}
                Err(e) => warn!("miner: emission availability failed: {}", e),
            }
        }

        for item in packed {
            included_ids.push(item.txid);
            txs.push(item.tx);
        }

        // Blocks require ≥1 tx; skip empty heartbeat when no emission payout configured.
        if txs.is_empty() {
            debug!("miner: skip empty assemble (no mempool txs and no emission tx)");
            continue;
        }

        let header = BlockHeader {
            version: 1,
            chain_id,
            height: best_height + 1,
            prev_blockhash,
            merkle_root: [0u8; 32],
            time: now,
            bits: GENESIS_BITS,
            nonce: 0,
        };

        let block = match Block::build(header, txs) {
            Ok(b) => b,
            Err(e) => {
                warn!("miner: Block::build failed: {}", e);
                continue;
            }
        };

        let block_wire = match block.to_wire() {
            Ok(w) => w,
            Err(e) => {
                warn!("miner: block to_wire failed: {}", e);
                continue;
            }
        };
        let block_hex = hex::encode(block_wire);
        let tx_count = block.txs.len();

        match ctx.chain.submit_block(&block) {
            Ok(_) => {
                let _ = ctx.chain.storage.recompute_best_header_tip_v52();
                for txid in &included_ids {
                    let _ = ctx.mempool.remove(txid);
                }
                info!(
                    "miner: block height {} accepted (txs={}, packed={}, heartbeat={})",
                    best_height + 1,
                    tx_count,
                    included_ids.len(),
                    included_ids.is_empty()
                );
                relay_block(&ctx, block_hex).await;
            }
            Err(e) => {
                debug!("miner: submit_block failed: {}", e);
            }
        }
    }
}
