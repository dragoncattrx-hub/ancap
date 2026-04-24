//! Transfer of ACP from the Ecosystem Grants wallet to the specified address.
//!
//! Run: cargo run -p acp-wallet --example transfer_ecosystem_to_address -- <address> [ACP_amount]
//! Or: ACP_TO_ADDRESS=acp1... ACP_AMOUNT=1000 cargo run -p acp-wallet --example transfer_ecosystem_to_address
//! RPC: ACP_RPC_URL=http://127.0.0.1:8545/rpc (default)
//!
//! Requirements: node is running, genesis is applied, ecosystem.keystore.json or ecosystem.mnemonic.

use anyhow::anyhow;
use acp_crypto::{
    protocol_params::{MIN_FEE_UNITS, UNITS_PER_ACP},
    AddressV0, Mnemonic, Transaction, TxHex, TxInput, TxOutput, WalletIdentity,
};
use rand_core::OsRng;
use reqwest::blocking::Client;
use serde_json::json;

const CHAIN_ID: u32 = 1001;
const DEFAULT_RPC_URL: &str = "http://127.0.0.1:8545/rpc";
const DEFAULT_TRANSFER_ACP: u64 = 500;
const GENESIS_ECOSYSTEM_VOUT: u32 = 3;

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
    let to_address = std::env::args()
        .nth(1)
        .or_else(|| std::env::var("ACP_TO_ADDRESS").ok())
        .ok_or_else(|| anyhow!("Specify the recipient's address: cargo run -p acp-wallet --example transfer_ecosystem_to_address -- acp1... [amount]"))?;
    let to_address = to_address.trim();
    let transfer_acp: u64 = std::env::args()
        .nth(2)
        .or_else(|| std::env::var("ACP_AMOUNT").ok())
        .unwrap_or_else(|| DEFAULT_TRANSFER_ACP.to_string())
        .parse()
        .map_err(|_| anyhow!("Amount must be a number (ACP)"))?;
    let rpc_url = std::env::var("ACP_RPC_URL").unwrap_or_else(|_| DEFAULT_RPC_URL.to_string());
    let to_addr_decoded = AddressV0::decode(to_address)?;

    let genesis_path = "genesis-addresses.json";
    let genesis_json: Vec<serde_json::Value> =
        serde_json::from_str(&std::fs::read_to_string(genesis_path)?)?;
    let ecosystem_entry = genesis_json
        .iter()
        .find(|e| e.get("role").and_then(|r| r.as_str()).map_or(false, |r| r.contains("Ecosystem")))
        .ok_or_else(|| anyhow!("IN genesis-addresses.json no role Ecosystem Grants"))?;
    let ecosystem_addr_str = ecosystem_entry["address"]
        .as_str()
        .ok_or_else(|| anyhow!("Ecosystem address not a string"))?;
    let ecosystem_addr = AddressV0::decode(ecosystem_addr_str)?;

    // First keystore (same key as run-genesis-wallets; mnemonic gives different address due to random Dilithium)
    let ecosystem_id = if let Ok(ks_json) = std::fs::read_to_string("ecosystem.keystore.json") {
        let ks: acp_crypto::KeystoreV3 = serde_json::from_str(&ks_json)?;
        WalletIdentity::from_keystore_v3(&ks)?
    } else {
        let mnemonic_str = std::env::var("ACP_ECOSYSTEM_MNEMONIC").or_else(|_| {
            std::fs::read_to_string("ecosystem.mnemonic").map(|s| {
                s.lines().next().unwrap_or("").trim().to_string()
            })
        }).map_err(|_| anyhow!("No ecosystem.keystore.json and no ecosystem.mnemonic. Run run-genesis-wallets.bat (will create a keystore), then run-apply-genesis and run-submit-genesis-block."))?;
        let m = Mnemonic::parse(mnemonic_str.trim())?;
        let seed = m.to_seed("");
        let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
        let derived_addr = id.receive_address_v0()?;
        if derived_addr != ecosystem_addr_str {
            anyhow::bail!(
                "Mnemonic does not match Ecosystem address in genesis: expected {}, received {}. Use ecosystem.keystore.json from run-genesis-wallets.",
                ecosystem_addr_str,
                derived_addr
            )
        }
        id
    };
    if ecosystem_id.receive_address_v0()? != ecosystem_addr_str {
        anyhow::bail!(
            "ecosystem.keystore.json does not match the Ecosystem address in genesis. Recreate: run-genesis-wallets.bat, run-apply-genesis.bat, reset node, run-submit-genesis-block.bat."
        );
    }

    let client = Client::new();

    let block1_hash_hex: String = rpc(&client, &rpc_url, "getblockhash", json!({ "height": 1 }))?
        .as_str().ok_or_else(|| anyhow!("getblockhash(1) did not return a string"))?.to_string();
    let block1 = rpc(&client, &rpc_url, "getblock", json!({ "blockhash": block1_hash_hex, "verbose": 2 }))?;
    let txs = block1["tx"].as_array().ok_or_else(|| anyhow!("getblock: No tx"))?;
    let genesis_tx = txs.first().ok_or_else(|| anyhow!("There are no transactions in block 1"))?;
    let genesis_txid_hex: String = genesis_tx["txid"].as_str().ok_or_else(|| anyhow!("No txid"))?.to_string();
    let genesis_txid = TxHex::decode_txid(&genesis_txid_hex)?;
    let vouts = genesis_tx["vout"].as_array().ok_or_else(|| anyhow!("No vout"))?;
    let vout3 = vouts.get(GENESIS_ECOSYSTEM_VOUT as usize).ok_or_else(|| anyhow!("No vout 3 (Ecosystem)"))?;
    let ecosystem_amount: u64 = vout3["amount"].as_u64().ok_or_else(|| anyhow!("vout amount not a number"))?;

    let transfer_units = transfer_acp * UNITS_PER_ACP;
    let change = ecosystem_amount
        .checked_sub(transfer_units)
        .and_then(|x| x.checked_sub(MIN_FEE_UNITS))
        .ok_or_else(|| anyhow!("Insufficient funds for Ecosystem (need {} ACP + commission)", transfer_acp))?;

    let tx = {
        let mut t = Transaction::new_unsigned(
            CHAIN_ID,
            vec![TxInput {
                prev_txid: genesis_txid,
                vout: GENESIS_ECOSYSTEM_VOUT,
                amount: ecosystem_amount,
            }],
            vec![
                TxOutput::to_address_v0(transfer_units, &to_addr_decoded),
                TxOutput::to_address_v0(change, &ecosystem_addr),
            ],
        );
        t.sign(&ecosystem_id.spend)?;
        t
    };
    let tx_hex = TxHex::encode_tx(&tx)?;
    let txid = tx.txid()?;

    let send_ok = match rpc(&client, &rpc_url, "sendrawtransaction", json!({ "tx": tx_hex.clone() })) {
        Ok(send_res) => {
            let accepted = send_res.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false);
            if !accepted {
                let reason = send_res.get("reason").and_then(|v| v.as_str()).unwrap_or("unknown");
                eprintln!("Node debugged: {}", reason);
                false
            } else {
                true
            }
        }
        Err(e) => {
            eprintln!("RPC from host unavailable (often on Windows): {}", e);
            if std::fs::write("transfer_pending.hex", tx_hex.as_str()).is_ok() {
                println!();
                println!("Tx built. Raw tx written to: transfer_pending.hex");
                println!("Run run-broadcast-pending-tx.bat to send via Docker.");
                println!();
            }
            false
        }
    };

    if send_ok {
        println!();
        println!("==============================================");
        println!("  {} ACP: Ecosystem -> {}", transfer_acp, to_address);
        println!("==============================================");
        println!();
        println!("TxID: {}", TxHex::encode_txid(&txid));
        println!("Amount: {} ACP to recipient's address.", transfer_acp);
        println!();
        println!("Check balances: run-check-acp-balances.bat");
        println!();
    }

    Ok(())
}
