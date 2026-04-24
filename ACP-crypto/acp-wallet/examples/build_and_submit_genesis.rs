//! Assembling and sending the genesis block (block 1) using genesis-addresses.json.
//!
//! Requirements: the node is running (RPC on http://127.0.0.1:8545/rpc), the database is empty (no blocks yet).
//! First generate wallets: run-genesis-wallets.bat → get genesis-addresses.json.
//!
//! Launch: cargo run -p acp-wallet --example build_and_submit_genesis

use acp_crypto::{
    protocol_params::{BASE_SUPPLY_ACP, UNITS_PER_ACP},
    AddressV0, Block, BlockHeader, Mnemonic, Transaction, TxInput, TxOutput,
    WalletIdentity,
};
use rand_core::OsRng;
use reqwest::blocking::Client;
use serde_json::json;
use std::time::Duration;

const CHAIN_ID: u32 = 1001;
const DEFAULT_RPC_URL: &str = "http://127.0.0.1:8545/rpc";
const RPC_TIMEOUT_SECS: u64 = 120;
/// Deterministic mnemonic for genesis-tx signature only (no one stores funds on this key).
const GENESIS_SIGNER_PHRASE: &str =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

fn rpc(client: &Client, rpc_url: &str, method: &str, params: serde_json::Value) -> anyhow::Result<serde_json::Value> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
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
    let path = "genesis-addresses.json";
    let genesis: Vec<serde_json::Value> = serde_json::from_str(&std::fs::read_to_string(path)?)?;
    if genesis.len() != 4 {
        anyhow::bail!("genesis-addresses.json must contain 4 entries (Creator, Validator, Public, Ecosystem)");
    }

    let total_units = BASE_SUPPLY_ACP * UNITS_PER_ACP;
    let mut outputs = Vec::with_capacity(4);
    let mut sum: u64 = 0;
    for entry in &genesis {
        let addr_str = entry["address"].as_str().ok_or_else(|| anyhow::anyhow!("No address"))?;
        let amount_units: u64 = entry["amount_units"].as_u64().ok_or_else(|| anyhow::anyhow!("No amount_units"))?;
        let addr = AddressV0::decode(addr_str)?;
        outputs.push(TxOutput::to_address_v0(amount_units, &addr));
        sum = sum.saturating_add(amount_units);
    }
    if sum != total_units {
        anyhow::bail!(
            "The amount in genesis-addresses.json ({}) is not equal to base supply ({} units)",
            sum,
            total_units
        );
    }

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
        time: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs(),
        bits: 0x1d00ffff,
        nonce: 0,
    };
    let genesis_block = Block::build(genesis_header, vec![genesis_tx])?;
    let block_hex = hex::encode(genesis_block.to_wire()?);

    let block_file = "genesis-block.hex";
    std::fs::write(block_file, &block_hex)?;
    println!();
    println!("==============================================");
    println!("  Genesis block (height 1)");
    println!("==============================================");
    println!();
    println!("One tx, 4 outputs: Creator, Validator Reserve, Public & Liquidity, Ecosystem.");
    println!("Block saved in: {}", block_file);
    println!();

    let client = Client::builder()
        .timeout(Duration::from_secs(RPC_TIMEOUT_SECS))
        .build()?;

    match rpc(&client, &rpc_url, "getblockcount", json!({})) {
        Ok(_) => {}
        Err(e) => {
            eprintln!("[!] Node unavailable (getblockcount): {}", e);
            eprintln!();
            eprintln!("Send the block manually via PowerShell:");
            eprintln!("  run-submit-genesis-block.bat");
            eprintln!();
            return Err(e.into());
        }
    }

    let res = match rpc(&client, &rpc_url, "submitblock", json!({ "block": block_hex })) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("[!] Error sending block: {}", e);
            eprintln!();
            eprintln!("The block is already in file {}. Send manually:", block_file);
            eprintln!("  run-submit-genesis-block.bat");
            eprintln!();
            return Err(e.into());
        }
    };

    let accepted = res.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false);
    if !accepted {
        let reason = res.get("reason").and_then(|v| v.as_str()).unwrap_or("unknown");
        anyhow::bail!("Noda unblocked: {}", reason);
    }

    let blockhash = res.get("blockhash").and_then(|v| v.as_str());
    println!("[OK] Genesis applied. Block hash: {:?}", blockhash);
    println!();
    println!("Next: run-transfer-500-acp.bat (transfer 500 ACP from Ecosystem to a test wallet).");
    println!();
    Ok(())
}
