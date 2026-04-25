//! Checking ACP balances by address (scanning blocks via RPC).
//!
//! Run: cargo run -p acp-wallet --example check_balances -- [address1] [address2] ...
//! Or without arguments - reads genesis-addresses.json and shows the balances of all four genesis addresses.

use std::collections::{HashMap, HashSet};

use reqwest::blocking::Client;
use serde_json::json;

fn rpc(client: &Client, rpc_url: &str, method: &str, params: serde_json::Value) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });
    let res: serde_json::Value = client.post(rpc_url).json(&body).send()?.json()?;
    if let Some(err) = res.get("error") {
        return Err(anyhow::anyhow!("RPC error: {}", err).into());
    }
    Ok(res["result"].clone())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let addresses: Vec<String> = if args.is_empty() {
        let path = "genesis-addresses.json";
        let genesis: Vec<serde_json::Value> = serde_json::from_str(&std::fs::read_to_string(path)?)?;
        genesis
            .into_iter()
            .map(|e| {
                e["address"]
                    .as_str()
                    .unwrap_or("")
                    .to_string()
            })
            .filter(|s| !s.is_empty())
            .collect()
    } else {
        args
    };

    if addresses.is_empty() {
        eprintln!("Specify addresses or run from the root of the repo with genesis-addresses.json");
        std::process::exit(1);
    }

    let want: HashSet<String> = addresses.iter().cloned().collect();
    let client = Client::new();
    let rpc_url: String = std::env::var("ACP_RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8545/rpc".to_string());

    let best_height: u64 = rpc(&client, &rpc_url, "getblockcount", json!([]))?
        .as_u64()
        .ok_or_else(|| anyhow::anyhow!("getblockcount did not return a number"))?;

    // UTXO: (txid_hex, vout_index) -> (amount, recipient_address)
    let mut utxo: HashMap<(String, u32), (u64, String)> = HashMap::new();

    for height in 1..=best_height {
        let block_hash: String = rpc(&client, &rpc_url, "getblockhash", json!({ "height": height }))?
            .as_str()
            .ok_or("getblockhash did not return a string")?
            .to_string();
        let block = rpc(&client, &rpc_url, "getblock", json!({ "blockhash": block_hash, "verbose": 2 }))?;
        let txs = block["tx"].as_array().ok_or("getblock: No tx")?;

        for tx in txs {
            let txid_hex: String = tx["txid"].as_str().ok_or("No txid")?.to_string();

            for (idx, inp) in tx["vin"].as_array().unwrap_or(&vec![]).iter().enumerate() {
                let prev = inp["prev_txid"].as_str().map(|s| s.to_string());
                let vout = inp["vout"].as_u64().unwrap_or(idx as u64) as u32;
                if let Some(prev_txid) = prev {
                    utxo.remove(&(prev_txid, vout));
                }
            }

            for (idx, out) in tx["vout"].as_array().unwrap_or(&vec![]).iter().enumerate() {
                let amount = out["amount"].as_u64().unwrap_or(0);
                let addr = out["recipient_address"]
                    .as_str()
                    .unwrap_or("")
                    .to_string();
                utxo.insert((txid_hex.clone(), idx as u32), (amount, addr));
            }
        }
    }

    let mut balances: HashMap<String, u64> = HashMap::new();
    for ((_, _), (amount, addr)) in utxo {
        if want.contains(&addr) {
            *balances.entry(addr).or_insert(0) += amount;
        }
    }

    const UNITS_PER_ACP: u64 = 100_000_000;
    println!();
    println!("==============================================");
    println!(" ACP balances (height {})", best_height);
    println!("==============================================");
    println!();
    for addr in &addresses {
        let units = balances.get(addr).copied().unwrap_or(0);
        let acp = units as f64 / UNITS_PER_ACP as f64;
        println!("  {} : {} ACP ({} units)", addr, acp, units);
    }
    println!();
    Ok(())
}
