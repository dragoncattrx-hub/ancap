//! Best-effort peer sync over JSON-RPC.
//!
//! ACP currently uses HTTP JSON-RPC endpoints as the peer transport (see `peer_rpc_urls`).
//! This module periodically pulls missing blocks from peers by height:
//! - getblockcount -> getblockhash(height) -> getblock(verbose=false) -> submitblock
//!
//! This is intentionally simple (no headers-first, no fork-choice negotiation beyond "best height wins").
//! It is meant to make multi-node setups work over the public internet.

use std::sync::Arc;
use std::time::Duration;

use serde_json::json;

use crate::rpc::handlers::RpcCtx;

const SYNC_INTERVAL_SECS: u64 = 5;
const SYNC_MAX_BLOCKS_PER_TICK: u64 = 200;

async fn rpc_call<T: serde::de::DeserializeOwned>(
    client: &reqwest::Client,
    url: &str,
    method: &str,
    params: serde_json::Value,
    token: Option<&str>,
) -> anyhow::Result<T> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });

    let mut req = client.post(url).json(&body);
    if let Some(t) = token {
        req = req.header("x-acp-rpc-token", t);
    }
    let resp = req.send().await?;
    let v: serde_json::Value = resp.json().await?;

    if let Some(err) = v.get("error") {
        anyhow::bail!("rpc error: {}", err);
    }
    let result = v
        .get("result")
        .ok_or_else(|| anyhow::anyhow!("missing result"))?;
    Ok(serde_json::from_value(result.clone())?)
}

async fn sync_from_peer(client: &reqwest::Client, peer_url: &str, ctx: &RpcCtx) -> anyhow::Result<()> {
    let local_best: u64 = ctx.chain.storage.best_height()?;
    let token = ctx.config.rpc_token.as_deref();
    let peer_best: u64 = rpc_call(client, peer_url, "getblockcount", json!([]), token).await?;

    if peer_best <= local_best {
        return Ok(());
    }

    let mut applied = 0u64;
    let target = peer_best.min(local_best.saturating_add(SYNC_MAX_BLOCKS_PER_TICK));

    for h in (local_best + 1)..=target {
        let bh: String = rpc_call(client, peer_url, "getblockhash", json!({ "height": h }), token).await?;
        let block_hex: String =
            rpc_call(client, peer_url, "getblock", json!({ "blockhash": bh, "verbose": false }), token).await?;

        // We cannot reuse rpc_call for local submit because we don't have a public URL for ourselves here.
        // Call the handler directly to avoid having to know our own bind address.
        let res = crate::rpc::handlers::handle(ctx, "submitblock", &json!({ "block": block_hex }))?;
        if res.get("accepted").and_then(|v| v.as_bool()) != Some(true) {
            // Stop early on rejection (fork or invalid block); next tick may pick another peer.
            break;
        }

        applied += 1;
    }

    if applied > 0 {
        tracing::info!(peer_url = %peer_url, applied, local_best, peer_best, "peer sync applied blocks");
    }

    Ok(())
}

pub async fn run_peer_sync_loop(ctx: Arc<RpcCtx>) {
    let Some(peer_urls) = ctx.config.peer_rpc_urls.clone() else {
        return;
    };
    if peer_urls.is_empty() {
        return;
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());

    loop {
        for url in &peer_urls {
            if let Err(e) = sync_from_peer(&client, url, ctx.as_ref()).await {
                tracing::warn!(peer_url = %url, "peer sync failed: {}", e);
            }
        }

        tokio::time::sleep(Duration::from_secs(SYNC_INTERVAL_SECS)).await;
    }
}

