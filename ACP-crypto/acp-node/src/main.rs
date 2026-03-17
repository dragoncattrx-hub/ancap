//! ACP node: RocksDB storage + mempool + JSON-RPC (ANCAP chain).

use std::env;

use tracing::info;
use tracing_subscriber::FmtSubscriber;

mod chain;
mod config;
mod exports;
mod mempool;
mod miner;
mod score;
mod rpc;
mod storage;
mod sync;
mod util;

use crate::config::{FileConfig, NodeConfig};
use crate::rpc::handlers::RpcCtx;
use crate::storage::rocks::Rocks;
use crate::storage::Storage;
use crate::chain::Chain;
use crate::mempool::Mempool;

fn load_config_from_env(mut cfg: NodeConfig) -> NodeConfig {
    if let Ok(v) = env::var("ACP_DATA_DIR") {
        cfg.data_dir = v;
    }
    if let Ok(v) = env::var("ACP_RPC_LISTEN") {
        cfg.rpc_listen = v;
    }
    if let Ok(v) = env::var("ACP_CHAIN_ID") {
        if let Ok(id) = v.parse::<u32>() {
            cfg.chain_id = id;
        }
    }
    if let Ok(v) = env::var("ACP_PEER_RPC_URLS") {
        let urls: Vec<String> = v.split(',').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();
        if !urls.is_empty() {
            cfg.peer_rpc_urls = Some(urls);
        }
    }
    if let Ok(v) = env::var("ACP_MINER_ENABLED") {
        cfg.miner_enabled = v.trim().eq_ignore_ascii_case("1") || v.trim().eq_ignore_ascii_case("true") || v.trim().eq_ignore_ascii_case("yes");
    }
    if let Ok(v) = env::var("ACP_MINER_INTERVAL_SECS") {
        if let Ok(n) = v.parse::<u64>() {
            cfg.miner_interval_secs = n.max(1);
        }
    }
    if let Ok(v) = env::var("ACP_RPC_TOKEN") {
        let v = v.trim().to_string();
        if !v.is_empty() {
            cfg.rpc_token = Some(v);
        }
    }
    cfg
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let subscriber = FmtSubscriber::new();
    tracing::subscriber::set_global_default(subscriber).unwrap();

    let mut cfg = NodeConfig::default();
    let args: Vec<String> = env::args().collect();
    if let Some(i) = args.iter().position(|a| a == "--config") {
        if let Some(path) = args.get(i + 1) {
            if let Some(file_cfg) = FileConfig::load(std::path::Path::new(path)) {
                file_cfg.apply_to(&mut cfg);
                info!("config loaded from {}", path);
            }
        }
    }
    let cfg = load_config_from_env(cfg);

    info!(
        "ACP node starting (chain_id={}, data_dir={})",
        cfg.chain_id, cfg.data_dir
    );

    let rocks = Rocks::open(&cfg.data_dir)?;
    let storage = Storage::new(rocks);
    let chain = Chain::new(cfg.chain_id, storage);
    let mempool = Mempool::new(crate::mempool::MempoolLimits::default());

    let ctx = std::sync::Arc::new(RpcCtx {
        chain,
        mempool,
        node_version: "acp-node/0.0.2-skeleton".into(),
        config: cfg.clone(),
    });

    if cfg.miner_enabled {
        let ctx_miner = ctx.clone();
        tokio::spawn(async move {
            miner::run_miner_loop(ctx_miner).await;
        });
    }

    // Peer sync loop (pull missing blocks over JSON-RPC).
    // This enables nodes to catch up after downtime and to sync over the public internet using peer_rpc_urls.
    {
        let ctx_sync = ctx.clone();
        tokio::spawn(async move {
            sync::run_peer_sync_loop(ctx_sync).await;
        });
    }

    let app = rpc::router(ctx);

    let listener = tokio::net::TcpListener::bind(&cfg.rpc_listen).await?;
    info!("RPC listening on {}", cfg.rpc_listen);
    axum::serve(listener, app).await?;

    Ok(())
}
