//! Assembling block 2 from the first tx in the mempool and sending (submitblock).
//! Node itself does not create blocks - block 2 will only appear after this step.
//!
//! Launch: cargo run -p acp-wallet --example build_and_submit_block2
//! Or from Docker: see run-submit-block2-via-docker.bat

use acp_crypto::{Block, BlockHeader, Transaction, TxHex};
use reqwest::blocking::Client;
use serde_json::json;

const CHAIN_ID: u32 = 1001;

fn rpc(client: &Client, rpc_url: &str, method: &str, params: serde_json::Value) -> anyhow::Result<serde_json::Value> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });
    let res: serde_json::Value = client.post(rpc_url).json(&body).send()?.json()?;
    if let Some(err) = res.get("error") {
        anyhow::bail!("RPC error: {}", err);
    }
    Ok(res["result"].clone())
}

fn main() -> anyhow::Result<()> {
    let rpc_url: String = std::env::var("ACP_RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8545/rpc".to_string());
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?;

    let height: u64 = rpc(&client, &rpc_url, "getblockcount", json!([]))?
        .as_u64()
        .ok_or_else(|| anyhow::anyhow!("getblockcount did not return a number"))?;
    if height != 1 {
        anyhow::bail!("Expected height 1 (genesis only). Now: {}. Run on an empty node after genesis.", height);
    }

    let mempool: Vec<serde_json::Value> = rpc(&client, &rpc_url, "getrawmempool", json!([]))?
        .as_array()
        .cloned()
        .unwrap_or_default();
    let txid_str = mempool
        .first()
        .and_then(|v| v.as_str())
        .ok_or_else(|| anyhow::anyhow!("The mempool is empty. Send tx first (for example run-transfer-500-via-docker.bat)."))?;

    let tx_hex: String = rpc(
        &client,
        &rpc_url,
        "getrawtransaction",
        json!({ "txid": txid_str, "verbose": 0 }),
    )?
    .as_str()
    .ok_or_else(|| anyhow::anyhow!("getrawtransaction did not return hex"))?
    .to_string();
    let tx_wire = hex::decode(tx_hex.trim()).map_err(|e| anyhow::anyhow!("decode tx hex: {}", e))?;
    let tx = Transaction::from_wire(&tx_wire).map_err(|e| anyhow::anyhow!("from_wire: {}", e))?;

    let prev_hash_hex: String = rpc(&client, &rpc_url, "getblockhash", json!({ "height": 1 }))?
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("getblockhash did not return a string"))?
        .to_string();
    let prev_blockhash = TxHex::decode_blockhash(prev_hash_hex.trim())
        .map_err(|e| anyhow::anyhow!("decode blockhash: {}", e))?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let header = BlockHeader {
        version: 1,
        chain_id: CHAIN_ID,
        height: 2,
        prev_blockhash,
        merkle_root: [0u8; 32],
        time: now,
        bits: 0x1d00ffff,
        nonce: 0,
    };
    let block = Block::build(header, vec![tx])?;
    let block_hex = hex::encode(block.to_wire()?);

    let res = rpc(&client, &rpc_url, "submitblock", json!({ "block": block_hex }))?;
    let accepted = res.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false);
    if accepted {
        println!();
        println!("==============================================");
        println!("Block 2 accepted by node.");
        println!("==============================================");
        println!("  blockhash: {:?}", res.get("blockhash"));
        println!("  height: 2");
        println!();
        println!("Check balance: run-check-ecosystem-and-recipient-via-docker.bat");
        println!();
    } else {
        let reason = res.get("reason").and_then(|v| v.as_str()).unwrap_or("?");
        anyhow::bail!("Noda debugged block 2: {}", reason);
    }
    Ok(())
}
