//! Automatic miner: periodically build a block from the first tx in mempool and submit it.
//! Controlled by config miner_enabled and miner_interval_secs (env: ACP_MINER_ENABLED, ACP_MINER_INTERVAL_SECS).

use std::sync::Arc;

use acp_crypto::{Block, BlockHeader, Transaction, TxHex};
use tracing::{debug, info, warn};

use crate::config::GENESIS_BITS;
use crate::rpc::handlers::RpcCtx;

pub async fn run_miner_loop(ctx: Arc<RpcCtx>) {
    let interval_secs = ctx.config.miner_interval_secs;
    let chain_id = ctx.config.chain_id;

    info!(
        "miner started (interval_secs={}, chain_id={})",
        interval_secs, chain_id
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

        let txids = ctx.mempool.txids();
        if txids.is_empty() {
            continue;
        }

        let txid = txids[0];
        let wire = match ctx.mempool.get(&txid) {
            Some(w) => w,
            None => continue,
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

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let mut txs: Vec<Transaction> = Vec::with_capacity(2);
        if let Some(ref payout_address) = ctx.config.miner_reward_address {
            match crate::emission::emission_available_now_units(&ctx.chain.storage, now) {
                Ok(available) if available > 0 => {
                    // Smooth emission over time using target block cadence.
                    let target_per_block = (acp_crypto::protocol_params::ANNUAL_EMISSION_ACP as u128)
                        .saturating_mul(acp_crypto::UNITS_PER_ACP as u128)
                        / ((365u128 * 24 * 60 * 60)
                            / (acp_crypto::protocol_params::TARGET_BLOCK_TIME_SEC as u128).max(1));
                    let reward_units = available.min(target_per_block.max(1) as u64);
                    match crate::emission::build_miner_emission_tx(chain_id, payout_address, reward_units) {
                        Ok(reward_tx) => txs.push(reward_tx),
                        Err(e) => warn!("miner: emission tx build failed: {}", e),
                    }
                }
                Ok(_) => {}
                Err(e) => warn!("miner: emission availability failed: {}", e),
            }
        }
        txs.push(tx);

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

        match ctx.chain.submit_block(&block) {
            Ok(_) => {
                let _ = ctx.chain.storage.recompute_best_header_tip_v52();
                let _ = ctx.mempool.remove(&txid);
                info!(
                    "miner: block height {} accepted (txid={})",
                    best_height + 1,
                    TxHex::encode_txid(&txid)
                );

                if let Some(ref urls) = ctx.config.peer_rpc_urls {
                    let block_hex_relay = block_hex.clone();
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
                                "params": { "block": block_hex_relay },
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
            }
            Err(e) => {
                debug!("miner: submit_block failed: {}", e);
            }
        }
    }
}
