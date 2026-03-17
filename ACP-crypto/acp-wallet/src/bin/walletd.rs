//! Minimal wallet helper for ANCAP backend (custodial hot-wallet).
//!
//! Commands (stdout is JSON):
//! - `walletd new` -> {"address":"acp1...","mnemonic":"..."}
//! - `walletd address --mnemonic "..."` -> {"address":"acp1..."}
//! - `walletd balance --rpc URL --address acp1...` -> {"address":"acp1...","units":"123","acp":"1.23"}
//! - `walletd transfer --rpc URL --mnemonic "..." --to acp1... --amount-acp 1.5`
//!     -> {"accepted":true,"txid":"..."} (accepted=false includes "reason")

use anyhow::{anyhow, Context};
use acp_crypto::{
    protocol_params::{MIN_FEE_UNITS, UNITS_PER_ACP},
    AddressV0, Mnemonic, Transaction, TxHex, TxInput, TxOutput, WalletIdentity,
};
use rand_core::OsRng;
use reqwest::blocking::Client;
use serde_json::{json, Value};
use std::collections::{BTreeMap, HashSet};
use std::time::Duration;

fn rpc(client: &Client, rpc_url: &str, method: &str, params: Value) -> anyhow::Result<Value> {
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
    let res: Value = req.send()?.json()?;
    if let Some(err) = res.get("error") {
        anyhow::bail!("RPC error: {}", err);
    }
    Ok(res["result"].clone())
}

fn best_height(client: &Client, rpc_url: &str) -> anyhow::Result<u64> {
    rpc(client, rpc_url, "getblockcount", json!({}))?
        .as_u64()
        .ok_or_else(|| anyhow!("getblockcount did not return u64"))
}

fn get_chain_id(client: &Client, rpc_url: &str) -> anyhow::Result<u32> {
    rpc(client, rpc_url, "getnetworkinfo", json!({}))?
        .get("chain_id")
        .and_then(|v| v.as_u64())
        .map(|v| v as u32)
        .ok_or_else(|| anyhow!("getnetworkinfo.chain_id missing"))
}

#[derive(Debug, Clone)]
struct Utxo {
    txid_hex: String,
    vout: u32,
    amount_units: u64,
}

/// Scan chain for UTXOs to a given bech32 address.
/// NOTE: This is O(chain) and intended for small chains / bootstrap.
fn scan_utxos(client: &Client, rpc_url: &str, address: &str) -> anyhow::Result<Vec<Utxo>> {
    let tip = best_height(client, rpc_url)?;
    if tip == 0 {
        return Ok(vec![]);
    }

    // Unspent outputs to `address`: key is "txid:vout"
    let mut unspent: BTreeMap<String, Utxo> = BTreeMap::new();
    let mut spent: HashSet<String> = HashSet::new();

    for h in 1..=tip {
        let bh = rpc(client, rpc_url, "getblockhash", json!({ "height": h }))?
            .as_str()
            .ok_or_else(|| anyhow!("getblockhash did not return string"))?
            .to_string();

        // verbose=2 returns {"tx": [decoded tx objects...]}
        let block = rpc(client, rpc_url, "getblock", json!({ "blockhash": bh, "verbose": 2 }))?;
        let txs = block
            .get("tx")
            .and_then(|v| v.as_array())
            .ok_or_else(|| anyhow!("getblock.tx missing"))?;

        for tx in txs {
            let txid = tx
                .get("txid")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow!("tx.txid missing"))?
                .to_string();

            if let Some(vin) = tx.get("vin").and_then(|v| v.as_array()) {
                for i in vin {
                    let prev = match i.get("prev_txid").and_then(|v| v.as_str()) {
                        Some(s) => s,
                        None => continue,
                    };
                    let vout = match i.get("vout").and_then(|v| v.as_u64()) {
                        Some(n) => n as u32,
                        None => continue,
                    };
                    let key = format!("{prev}:{vout}");
                    spent.insert(key.clone());
                    unspent.remove(&key);
                }
            }

            if let Some(vout) = tx.get("vout").and_then(|v| v.as_array()) {
                for (idx, o) in vout.iter().enumerate() {
                    let addr = o.get("recipient_address").and_then(|v| v.as_str());
                    if addr != Some(address) {
                        continue;
                    }
                    let amt = o
                        .get("amount")
                        .and_then(|v| v.as_u64())
                        .ok_or_else(|| anyhow!("vout.amount missing"))?;
                    let vout_index = idx as u32;
                    let key = format!("{txid}:{vout_index}");
                    if spent.contains(&key) {
                        continue;
                    }
                    unspent.insert(
                        key,
                        Utxo {
                            txid_hex: txid.clone(),
                            vout: vout_index,
                            amount_units: amt,
                        },
                    );
                }
            }
        }
    }

    Ok(unspent.into_values().collect())
}

fn format_acp(units: u64) -> String {
    let acp = (units as f64) / (UNITS_PER_ACP as f64);
    format!("{acp:.8}")
}

fn cmd_new() -> anyhow::Result<Value> {
    let m = Mnemonic::generate_12()?;
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
    let address = id.receive_address_v0()?;
    Ok(json!({ "address": address, "mnemonic": m.words() }))
}

fn cmd_address(mnemonic: &str) -> anyhow::Result<Value> {
    let m = Mnemonic::parse(mnemonic.trim())?;
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
    let address = id.receive_address_v0()?;
    Ok(json!({ "address": address }))
}

fn cmd_balance(rpc_url: &str, address: &str) -> anyhow::Result<Value> {
    AddressV0::decode(address).context("invalid ACP address")?;
    let client = Client::builder().timeout(Duration::from_secs(30)).build()?;
    let utxos = scan_utxos(&client, rpc_url, address)?;
    let units: u64 = utxos.iter().map(|u| u.amount_units).sum();
    Ok(json!({
        "address": address,
        "units": units.to_string(),
        "acp": format_acp(units),
        "utxo_count": utxos.len()
    }))
}

fn cmd_transfer(rpc_url: &str, mnemonic: &str, to: &str, amount_acp: &str) -> anyhow::Result<Value> {
    let amount_acp_f: f64 = amount_acp
        .trim()
        .parse()
        .map_err(|_| anyhow!("amount-acp must be a number"))?;
    if amount_acp_f <= 0.0 {
        anyhow::bail!("amount-acp must be > 0");
    }
    let transfer_units = (amount_acp_f * (UNITS_PER_ACP as f64)).round() as u64;
    if transfer_units == 0 {
        anyhow::bail!("amount-acp too small");
    }

    let client = Client::builder().timeout(Duration::from_secs(60)).build()?;
    let chain_id = get_chain_id(&client, rpc_url)?;

    let m = Mnemonic::parse(mnemonic.trim())?;
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
    let from_address = id.receive_address_v0()?;

    let to_addr_decoded = AddressV0::decode(to.trim()).context("invalid 'to' address")?;

    let mut utxos = scan_utxos(&client, rpc_url, &from_address)?;
    // simple greedy: largest-first to minimize inputs
    utxos.sort_by_key(|u| std::cmp::Reverse(u.amount_units));

    let mut picked: Vec<Utxo> = vec![];
    let mut sum: u64 = 0;
    for u in utxos {
        picked.push(u.clone());
        sum = sum.saturating_add(u.amount_units);
        if sum >= transfer_units.saturating_add(MIN_FEE_UNITS) {
            break;
        }
    }
    if sum < transfer_units.saturating_add(MIN_FEE_UNITS) {
        return Ok(json!({
            "accepted": false,
            "reason": "insufficient funds"
        }));
    }

    let change = sum - transfer_units - MIN_FEE_UNITS;
    let mut outputs = vec![TxOutput::to_address_v0(transfer_units, &to_addr_decoded)];
    if change > 0 {
        let from_addr_decoded = AddressV0::decode(&from_address)?;
        outputs.push(TxOutput::to_address_v0(change, &from_addr_decoded));
    }

    let inputs: Vec<TxInput> = picked
        .iter()
        .map(|u| TxInput {
            prev_txid: TxHex::decode_txid(&u.txid_hex).expect("txid decode"),
            vout: u.vout,
            amount: u.amount_units,
        })
        .collect();

    let mut tx = Transaction::new_unsigned(chain_id, inputs, outputs);
    tx.sign(&id.spend)?;
    let tx_hex = TxHex::encode_tx(&tx)?;
    let txid = TxHex::encode_txid(&tx.txid()?);

    let send_res = rpc(&client, rpc_url, "sendrawtransaction", json!({ "tx": tx_hex }))?;
    let accepted = send_res.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false);
    if accepted {
        Ok(json!({ "accepted": true, "txid": txid }))
    } else {
        Ok(json!({
            "accepted": false,
            "txid": txid,
            "reason": send_res.get("reason").and_then(|v| v.as_str()).unwrap_or("unknown")
        }))
    }
}

fn main() {
    if let Err(e) = real_main() {
        println!("{}", json!({ "ok": false, "error": e.to_string() }));
        std::process::exit(1);
    }
}

fn real_main() -> anyhow::Result<()> {
    let mut args = std::env::args().skip(1);
    let cmd = args.next().ok_or_else(|| anyhow!("missing command"))?;

    let out = match cmd.as_str() {
        "new" => cmd_new()?,
        "address" => {
            let mut mnemonic: Option<String> = None;
            while let Some(a) = args.next() {
                if a == "--mnemonic" {
                    mnemonic = args.next();
                }
            }
            let m = mnemonic.ok_or_else(|| anyhow!("--mnemonic is required"))?;
            cmd_address(&m)?
        }
        "balance" => {
            let mut rpc_url: Option<String> = None;
            let mut address: Option<String> = None;
            while let Some(a) = args.next() {
                match a.as_str() {
                    "--rpc" => rpc_url = args.next(),
                    "--address" => address = args.next(),
                    _ => {}
                }
            }
            let rpc_url = rpc_url.ok_or_else(|| anyhow!("--rpc is required"))?;
            let address = address.ok_or_else(|| anyhow!("--address is required"))?;
            cmd_balance(&rpc_url, &address)?
        }
        "transfer" => {
            let mut rpc_url: Option<String> = None;
            let mut mnemonic: Option<String> = None;
            let mut to: Option<String> = None;
            let mut amount_acp: Option<String> = None;
            while let Some(a) = args.next() {
                match a.as_str() {
                    "--rpc" => rpc_url = args.next(),
                    "--mnemonic" => mnemonic = args.next(),
                    "--to" => to = args.next(),
                    "--amount-acp" => amount_acp = args.next(),
                    _ => {}
                }
            }
            let rpc_url = rpc_url.ok_or_else(|| anyhow!("--rpc is required"))?;
            let mnemonic = mnemonic.ok_or_else(|| anyhow!("--mnemonic is required"))?;
            let to = to.ok_or_else(|| anyhow!("--to is required"))?;
            let amount_acp = amount_acp.ok_or_else(|| anyhow!("--amount-acp is required"))?;
            cmd_transfer(&rpc_url, &mnemonic, &to, &amount_acp)?
        }
        _ => anyhow::bail!("unknown command: {cmd}"),
    };

    println!("{}", json!({ "ok": true, "result": out }));
    Ok(())
}

