//! Transfer of 500 ACP from the Ecosystem Grants wallet to the test wallet.
//!
//! Requirements: the node is running, genesis has already been applied (block 1 with one tx and 4 outputs).
//! Store the Ecosystem mnemonic in ecosystem.mnemonic (one line, 12 words) or in ACP_ECOSYSTEM_MNEMONIC.
//!
//! Run: cargo run -p acp-wallet --example transfer_500_acp

use anyhow::anyhow;
use acp_crypto::{
    protocol_params::{MIN_FEE_UNITS, UNITS_PER_ACP},
    AddressV0, Mnemonic, Transaction, TxHex, TxInput, TxOutput, WalletIdentity,
};
use rand_core::OsRng;
use reqwest::blocking::Client;
use serde_json::json;

const CHAIN_ID: u32 = 1001;
const RPC_URL: &str = "http://127.0.0.1:8545/rpc";
const TRANSFER_ACP: u64 = 500;
const GENESIS_ECOSYSTEM_VOUT: u32 = 3; // order in genesis: Creator=0, Validator=1, Public=2, Ecosystem=3

fn rpc(client: &Client, method: &str, params: serde_json::Value) -> anyhow::Result<serde_json::Value> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });
    let res: serde_json::Value = client.post(RPC_URL).json(&body).send()?.json()?;
    if let Some(err) = res.get("error") {
        anyhow::bail!("RPC error: {}", err);
    }
    Ok(res["result"].clone())
}

fn main() -> anyhow::Result<()> {
    let mnemonic_str = std::env::var("ACP_ECOSYSTEM_MNEMONIC").or_else(|_| {
        std::fs::read_to_string("ecosystem.mnemonic").map(|s| s.trim().to_string())
    }).map_err(|_| anyhow!("Set ACP_ECOSYSTEM_MNEMONIC or create an ecosystem.mnemonic file with the Ecosystem Grants mnemonic (one line, 12 words)"))?;

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

    let m = Mnemonic::parse(mnemonic_str.trim())?;
    let seed = m.to_seed("");
    let ecosystem_id = WalletIdentity::new_from_seed(&seed, OsRng)?;
    let derived_addr = ecosystem_id.receive_address_v0()?;
    if derived_addr != ecosystem_addr_str {
        anyhow::bail!(
            "Mnemonic does not match Ecosystem address in genesis: expected {}, received {}",
            ecosystem_addr_str,
            derived_addr
        );
    }

    let client = Client::new();

    let block1_hash_hex: String = rpc(&client, "getblockhash", json!({ "height": 1 }))?
        .as_str()
        .ok_or_else(|| anyhow!("getblockhash(1) did not return a string"))?
        .to_string();
    let block1 = rpc(&client, "getblock", json!({ "blockhash": block1_hash_hex, "verbose": 2 }))?;
    let txs = block1["tx"].as_array().ok_or_else(|| anyhow!("getblock: No tx"))?;
    let genesis_tx = txs.first().ok_or_else(|| anyhow!("There are no transactions in block 1"))?;
    let genesis_txid_hex: String = genesis_tx["txid"]
        .as_str()
        .ok_or_else(|| anyhow!("No txid"))?
        .to_string();
    let genesis_txid = TxHex::decode_txid(&genesis_txid_hex)?;
    let vouts = genesis_tx["vout"].as_array().ok_or_else(|| anyhow!("No vout"))?;
    let vout3 = vouts
        .get(GENESIS_ECOSYSTEM_VOUT as usize)
        .ok_or_else(|| anyhow!("No vout {} (Ecosystem)", GENESIS_ECOSYSTEM_VOUT))?;
    let ecosystem_amount: u64 = vout3["amount"]
        .as_u64()
        .ok_or_else(|| anyhow!("vout amount not a number"))?;

    let test_mnemonic = Mnemonic::generate_12()?;
    let test_seed = test_mnemonic.to_seed("");
    let test_id = WalletIdentity::new_from_seed(&test_seed, OsRng)?;
    let test_addr = test_id.receive_address_v0()?;
    let test_addr_decoded = AddressV0::decode(&test_addr)?;

    let transfer_units = TRANSFER_ACP * UNITS_PER_ACP;
    let change = ecosystem_amount
        .checked_sub(transfer_units)
        .and_then(|x| x.checked_sub(MIN_FEE_UNITS))
        .ok_or_else(|| anyhow!("Insufficient funds for Ecosystem (need at least {} ACP + commission)", TRANSFER_ACP))?;

    let tx = {
        let mut t = Transaction::new_unsigned(
            CHAIN_ID,
            vec![TxInput {
                prev_txid: genesis_txid,
                vout: GENESIS_ECOSYSTEM_VOUT,
                amount: ecosystem_amount,
            }],
            vec![
                TxOutput::to_address_v0(transfer_units, &test_addr_decoded),
                TxOutput::to_address_v0(change, &ecosystem_addr),
            ],
        );
        t.sign(&ecosystem_id.spend)?;
        t
    };
    let tx_hex = TxHex::encode_tx(&tx)?;
    let txid = tx.txid()?;

    let send_res = rpc(&client, "sendrawtransaction", json!({ "tx": tx_hex }))?;
    let accepted = send_res.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false);
    if !accepted {
        let reason = send_res
            .get("reason")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        anyhow::bail!("Node rejected transaction: {}", reason);
    }

    println!();
    println!("==============================================");
    println!(" Translation {} ACP: Ecosystem -> Test wallet", TRANSFER_ACP);
    println!("==============================================");
    println!();
    println!("TxID: {}", TxHex::encode_txid(&txid));
    println!("Amount: {} ACP to test address", TRANSFER_ACP);
    println!();
    println!("Test wallet (save the mnemonic!):");
    println!(" Address: {}", test_addr);
    println!(" Mnemonic: {}", test_mnemonic.words());
    println!();
    println!("Check balances after including tx in the block:");
    println!("  run-check-acp-balances.bat");
    println!(
        "  (or: cargo run -p acp-wallet --example check_balances -- {} {})",
        ecosystem_addr_str, test_addr
    );
    println!();

    Ok(())
}
