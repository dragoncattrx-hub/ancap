//! Custom Genesis: allocate `ACP_GENESIS_TARGET_AMOUNT_ACP` ACP to a fixed
//! `ACP_GENESIS_TARGET_ADDRESS` (defaults to the project's hot wallet) and put
//! the remainder of `BASE_SUPPLY_ACP` on a freshly-generated treasury address.
//!
//! Mnemonic for the treasury wallet is written to
//! `Sicret/genesis-treasury-mnemonic.txt` so the operator can move funds out
//! later if needed. The genesis is signed by the canonical genesis-only signer
//! mnemonic (same as `build_and_submit_genesis.rs`) and submitted to the
//! configured ACP node via JSON-RPC `submitblock`.
//!
//! Run:
//!   cargo run --release -p acp-wallet --example build_and_submit_genesis_custom
//!
//! Env vars:
//!   ACP_RPC_URL                       (default: http://127.0.0.1:8545/rpc)
//!   ACP_RPC_TOKEN                     (optional bearer for protected nodes)
//!   ACP_GENESIS_TARGET_ADDRESS        (default: hot wallet acp1qzfd...nqp9)
//!   ACP_GENESIS_TARGET_AMOUNT_ACP     (default: 1_000_000)
//!   ACP_GENESIS_TREASURY_OUT_PATH     (default: Sicret/genesis-treasury-mnemonic.txt)

use acp_crypto::{
    protocol_params::{BASE_SUPPLY_ACP, UNITS_PER_ACP},
    AddressV0, Block, BlockHeader, Mnemonic, Transaction, TxInput, TxOutput,
    WalletIdentity,
};
use rand_core::OsRng;
use reqwest::blocking::Client;
use serde_json::json;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const CHAIN_ID: u32 = 1001;
const DEFAULT_RPC_URL: &str = "http://127.0.0.1:8545/rpc";
const DEFAULT_TARGET_ADDRESS: &str = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9";
const DEFAULT_TARGET_AMOUNT_ACP: u64 = 1_000_000;
const DEFAULT_TREASURY_OUT_PATH: &str = "Sicret/genesis-treasury-mnemonic.txt";
const RPC_TIMEOUT_SECS: u64 = 120;

/// Same throwaway phrase as the canonical genesis script — only used to sign
/// the synthetic genesis input; nobody ever stores funds on this key.
const GENESIS_SIGNER_PHRASE: &str =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

fn rpc(
    client: &Client,
    rpc_url: &str,
    method: &str,
    params: serde_json::Value,
) -> anyhow::Result<serde_json::Value> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    });
    let mut req = client.post(rpc_url).json(&body);
    if let Ok(t) = std::env::var("ACP_RPC_TOKEN") {
        let t = t.trim().to_string();
        if !t.is_empty() {
            req = req.header("x-acp-rpc-token", t);
        }
    }
    let res: serde_json::Value = req.send()?.json()?;
    if let Some(err) = res.get("error") {
        anyhow::bail!("RPC error: {}", err);
    }
    Ok(res["result"].clone())
}

fn main() -> anyhow::Result<()> {
    let rpc_url = std::env::var("ACP_RPC_URL").unwrap_or_else(|_| DEFAULT_RPC_URL.to_string());
    let target_address = std::env::var("ACP_GENESIS_TARGET_ADDRESS")
        .unwrap_or_else(|_| DEFAULT_TARGET_ADDRESS.to_string());
    let target_amount_acp: u64 = std::env::var("ACP_GENESIS_TARGET_AMOUNT_ACP")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_TARGET_AMOUNT_ACP);
    let treasury_out_path = std::env::var("ACP_GENESIS_TREASURY_OUT_PATH")
        .unwrap_or_else(|_| DEFAULT_TREASURY_OUT_PATH.to_string());

    let total_units = BASE_SUPPLY_ACP
        .checked_mul(UNITS_PER_ACP)
        .ok_or_else(|| anyhow::anyhow!("BASE_SUPPLY_ACP * UNITS_PER_ACP overflowed"))?;
    let target_units = target_amount_acp
        .checked_mul(UNITS_PER_ACP)
        .ok_or_else(|| anyhow::anyhow!("target_amount * UNITS_PER_ACP overflowed"))?;
    if target_units > total_units {
        anyhow::bail!(
            "target amount ({} ACP) exceeds BASE_SUPPLY_ACP ({} ACP)",
            target_amount_acp,
            BASE_SUPPLY_ACP
        );
    }
    let treasury_units = total_units - target_units;

    // Treasury wallet for the remainder. Persist its mnemonic so the operator
    // keeps custody of the rest of the supply (otherwise it's permanently lost).
    let treasury_mnemonic = Mnemonic::generate_12()?;
    let treasury_seed = treasury_mnemonic.to_seed("");
    let treasury_id = WalletIdentity::new_from_seed(&treasury_seed, OsRng)?;
    let treasury_addr_obj = treasury_id.receive_address_v0_obj()?;
    let treasury_addr_str = treasury_id.receive_address_v0()?;
    {
        // Best-effort directory create.
        if let Some(parent) = std::path::Path::new(&treasury_out_path).parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let body = format!(
            "address: {}\namount_acp: {}\nmnemonic: {}\n",
            treasury_addr_str,
            BASE_SUPPLY_ACP - target_amount_acp,
            treasury_mnemonic.words()
        );
        std::fs::write(&treasury_out_path, body)?;
    }

    let target_addr_obj = AddressV0::decode(&target_address)?;
    let outputs = vec![
        TxOutput::to_address_v0(target_units, &target_addr_obj),
        TxOutput::to_address_v0(treasury_units, &treasury_addr_obj),
    ];

    let signer_mnemonic = Mnemonic::parse(GENESIS_SIGNER_PHRASE)?;
    let signer_seed = signer_mnemonic.to_seed("");
    let signer_id = WalletIdentity::new_from_seed(&signer_seed, OsRng)?;

    let genesis_tx = {
        let mut tx = Transaction::new_unsigned(
            CHAIN_ID,
            vec![TxInput {
                prev_txid: [0u8; 32],
                vout: 0,
                amount: total_units,
            }],
            outputs,
        );
        tx.sign(&signer_id.spend)?;
        tx
    };

    let genesis_header = BlockHeader {
        version: 1,
        chain_id: CHAIN_ID,
        height: 1,
        prev_blockhash: [0u8; 32],
        merkle_root: [0u8; 32],
        time: SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs(),
        bits: 0x1d00ffff,
        nonce: 0,
    };
    let genesis_block = Block::build(genesis_header, vec![genesis_tx])?;
    let block_hex = hex::encode(genesis_block.to_wire()?);

    let block_file = "genesis-block-custom.hex";
    std::fs::write(block_file, &block_hex)?;
    println!();
    println!("==============================================");
    println!("  Custom genesis (height 1)");
    println!("==============================================");
    println!("  Target  : {}  ({} ACP)", target_address, target_amount_acp);
    println!(
        "  Treasury: {}  ({} ACP)",
        treasury_addr_str,
        BASE_SUPPLY_ACP - target_amount_acp
    );
    println!("  Mnemonic stored at: {}", treasury_out_path);
    println!("  Block saved at:     {}", block_file);
    println!();

    let client = Client::builder()
        .timeout(Duration::from_secs(RPC_TIMEOUT_SECS))
        .build()?;

    if let Err(e) = rpc(&client, &rpc_url, "getblockcount", json!({})) {
        eprintln!("[!] Node unavailable at {}: {}", rpc_url, e);
        eprintln!("    Start the node first, e.g.:");
        eprintln!("      ACP_DATA_DIR=Sicret/acp-node-data-host \\");
        eprintln!("      ACP_RPC_LISTEN=127.0.0.1:8545 cargo run --release -p acp-node");
        return Err(e);
    }

    let res = rpc(&client, &rpc_url, "submitblock", json!({ "block": block_hex }))?;
    let accepted = res
        .get("accepted")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    if !accepted {
        let reason = res
            .get("reason")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        anyhow::bail!("Node rejected genesis: {}", reason);
    }
    let blockhash = res
        .get("blockhash")
        .and_then(|v| v.as_str())
        .unwrap_or("?");
    println!("[OK] Custom genesis accepted. Block hash: {}", blockhash);
    println!();
    println!(
        "Verify: curl -s {} -H 'content-type: application/json' \\",
        rpc_url
    );
    println!(
        "  -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getbalance\",\"params\":{{\"address\":\"{}\"}}}}'",
        target_address
    );
    println!();
    Ok(())
}
