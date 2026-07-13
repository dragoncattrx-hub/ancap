//! Controlled regenesis (height 1) with spendable keystores for all operator wallets.
//!
//! Allocations:
//!   vout0  — new genesis treasury (remainder of BASE_SUPPLY after fixed + user allocs)
//!   vout1  — hot wallet (1M ACP)
//!   vout2  — project treasury (1M ACP)
//!   vout3  — bridge reserve (301K ACP)
//!   vout4+ — user wallets from user-allocs.json (ledger balances)
//!
//! Run:
//!   cargo run --release -p acp-wallet --example build_and_submit_genesis_v2
//!
//! Env:
//!   ACP_RPC_URL              (default http://127.0.0.1:8545/rpc)
//!   ACP_RPC_TOKEN            (optional)
//!   ACP_GENESIS_OUT_DIR      (default Sicret/genesis-v2)
//!   ACP_USER_ALLOCS_FILE     (default user-allocs.json)
//!   ACP_HOT_ADDRESS          (default acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9)
//!   ACP_PROJECT_TREASURY     (default acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902)
//!   ACP_BRIDGE_RESERVE       (default acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz)

use acp_crypto::{
    keystore::KeystoreV3,
    protocol_params::{BASE_SUPPLY_ACP, UNITS_PER_ACP},
    AddressV0, Block, BlockHeader, Mnemonic, Transaction, TxInput, TxOutput, WalletIdentity,
};
use rand_core::OsRng;
use reqwest::blocking::Client;
use serde::Deserialize;
use serde_json::json;
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

const CHAIN_ID: u32 = 1001;
const DEFAULT_RPC_URL: &str = "http://127.0.0.1:8545/rpc";
const DEFAULT_OUT_DIR: &str = "Sicret/genesis-v2";
const DEFAULT_USER_ALLOCS: &str = "user-allocs.json";
const DEFAULT_HOT: &str = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9";
const DEFAULT_PROJECT_TREASURY: &str = "acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902";
const DEFAULT_BRIDGE_RESERVE: &str = "acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz";
const HOT_ACP: u64 = 1_000_000;
const PROJECT_TREASURY_ACP: u64 = 1_000_000;
const BRIDGE_RESERVE_ACP: u64 = 301_000;
const RPC_TIMEOUT_SECS: u64 = 120;
const GENESIS_SIGNER_PHRASE: &str =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

#[derive(Debug, Deserialize)]
struct UserAlloc {
    address: String,
    acp: String,
}

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

fn acp_decimal_to_units(acp: &str) -> anyhow::Result<u64> {
    let s = acp.trim();
    if s.is_empty() || s == "0" || s == "0.0" {
        return Ok(0);
    }
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() > 2 {
        anyhow::bail!("invalid ACP amount: {s}");
    }
    let whole: u64 = parts[0].parse().map_err(|_| anyhow::anyhow!("invalid whole part: {s}"))?;
    let frac_str = if parts.len() == 2 { parts[1] } else { "" };
    if frac_str.len() > 8 {
        anyhow::bail!("too many decimal places in {s}");
    }
    let mut frac = frac_str.to_string();
    while frac.len() < 8 {
        frac.push('0');
    }
    let frac_u: u64 = if frac.is_empty() {
        0
    } else {
        frac.parse().map_err(|_| anyhow::anyhow!("invalid frac: {s}"))?
    };
    Ok(whole
        .checked_mul(UNITS_PER_ACP)
        .and_then(|w| w.checked_add(frac_u))
        .ok_or_else(|| anyhow::anyhow!("ACP amount overflow: {s}"))?)
}

fn save_treasury_wallet(
    out_dir: &PathBuf,
    id: &WalletIdentity,
    seed: &acp_crypto::Seed,
    mnemonic: &Mnemonic,
    address: &str,
    amount_acp: u64,
) -> anyhow::Result<()> {
    std::fs::create_dir_all(out_dir)?;
    let ks = id.to_keystore_v3(seed)?;
    let ks_json = serde_json::to_string_pretty(&ks)?;
    std::fs::write(out_dir.join("genesis-treasury.keystore.json"), &ks_json)?;
    let wallet_txt = format!(
        "role: Genesis Treasury (spendable)\naddress: {address}\namount_acp: {amount_acp}\nmnemonic: {}\nkeystore_file: genesis-treasury.keystore.json\n",
        mnemonic.words()
    );
    std::fs::write(out_dir.join("genesis-treasury-wallet.txt"), wallet_txt)?;
    let manifest = json!({
        "address": address,
        "amount_acp": amount_acp,
        "keystore_file": "genesis-treasury.keystore.json",
        "wallet_file": "genesis-treasury-wallet.txt",
    });
    std::fs::write(
        out_dir.join("genesis-manifest.json"),
        serde_json::to_string_pretty(&manifest)?,
    )?;
    eprintln!(
        "[OK] Genesis treasury keystore saved to {}/genesis-treasury.keystore.json",
        out_dir.display()
    );
    Ok(())
}

fn main() -> anyhow::Result<()> {
    let rpc_url = std::env::var("ACP_RPC_URL").unwrap_or_else(|_| DEFAULT_RPC_URL.to_string());
    let out_dir = PathBuf::from(
        std::env::var("ACP_GENESIS_OUT_DIR").unwrap_or_else(|_| DEFAULT_OUT_DIR.to_string()),
    );
    let user_allocs_path = std::env::var("ACP_USER_ALLOCS_FILE")
        .unwrap_or_else(|_| DEFAULT_USER_ALLOCS.to_string());
    let hot_addr = std::env::var("ACP_HOT_ADDRESS").unwrap_or_else(|_| DEFAULT_HOT.to_string());
    let project_treasury = std::env::var("ACP_PROJECT_TREASURY")
        .unwrap_or_else(|_| DEFAULT_PROJECT_TREASURY.to_string());
    let bridge_reserve = std::env::var("ACP_BRIDGE_RESERVE")
        .unwrap_or_else(|_| DEFAULT_BRIDGE_RESERVE.to_string());

    if let Ok(hot_keystore_path) = std::env::var("ACP_HOT_KEYSTORE_FILE") {
        let ks_json = std::fs::read_to_string(&hot_keystore_path)?;
        let ks: KeystoreV3 = serde_json::from_str(&ks_json)?;
        let id = WalletIdentity::from_keystore_v3(&ks)?;
        let derived = id.receive_address_v0()?;
        if derived != hot_addr {
            anyhow::bail!(
                "ACP_HOT_KEYSTORE_FILE derives {derived} but ACP_HOT_ADDRESS is {hot_addr}"
            );
        }
        std::fs::copy(&hot_keystore_path, out_dir.join("custodial-hot.keystore.json"))?;
        eprintln!("[OK] Custodial hot keystore verified and copied to {}/custodial-hot.keystore.json", out_dir.display());
    } else {
        eprintln!("[!] ACP_HOT_KEYSTORE_FILE not set — genesis will fund {hot_addr} but operator cannot spend without KeystoreV3");
    }

    let total_units = BASE_SUPPLY_ACP
        .checked_mul(UNITS_PER_ACP)
        .ok_or_else(|| anyhow::anyhow!("BASE_SUPPLY overflow"))?;

    let hot_units = HOT_ACP.checked_mul(UNITS_PER_ACP).unwrap();
    let pt_units = PROJECT_TREASURY_ACP.checked_mul(UNITS_PER_ACP).unwrap();
    let br_units = BRIDGE_RESERVE_ACP.checked_mul(UNITS_PER_ACP).unwrap();

    let user_allocs: Vec<UserAlloc> =
        serde_json::from_str(&std::fs::read_to_string(&user_allocs_path)?)?;
    let mut user_outputs: Vec<(String, u64)> = Vec::new();
    let mut user_sum: u64 = 0;
    for entry in &user_allocs {
        let units = acp_decimal_to_units(&entry.acp)?;
        if units == 0 {
            continue;
        }
        user_sum = user_sum
            .checked_add(units)
            .ok_or_else(|| anyhow::anyhow!("user alloc sum overflow"))?;
        user_outputs.push((entry.address.clone(), units));
    }

    let fixed_sum = hot_units
        .saturating_add(pt_units)
        .saturating_add(br_units)
        .saturating_add(user_sum);
    if fixed_sum >= total_units {
        anyhow::bail!(
            "fixed + user allocations ({fixed_sum} units) exceed BASE_SUPPLY ({total_units} units)"
        );
    }
    let treasury_units = total_units - fixed_sum;
    let treasury_acp = treasury_units / UNITS_PER_ACP;

    // New spendable genesis treasury wallet.
    let treasury_mnemonic = Mnemonic::generate_12()?;
    let treasury_seed = treasury_mnemonic.to_seed("");
    let treasury_id = WalletIdentity::new_from_seed(&treasury_seed, OsRng)?;
    let treasury_addr = treasury_id.receive_address_v0()?;
    save_treasury_wallet(
        &out_dir,
        &treasury_id,
        &treasury_seed,
        &treasury_mnemonic,
        &treasury_addr,
        treasury_acp,
    )?;

    let treasury_addr_obj = AddressV0::decode(&treasury_addr)?;
    let hot_addr_obj = AddressV0::decode(&hot_addr)?;
    let pt_addr_obj = AddressV0::decode(&project_treasury)?;
    let br_addr_obj = AddressV0::decode(&bridge_reserve)?;

    let mut outputs = vec![
        TxOutput::to_address_v0(treasury_units, &treasury_addr_obj),
        TxOutput::to_address_v0(hot_units, &hot_addr_obj),
        TxOutput::to_address_v0(pt_units, &pt_addr_obj),
        TxOutput::to_address_v0(br_units, &br_addr_obj),
    ];
    for (addr, units) in &user_outputs {
        let addr_obj = AddressV0::decode(addr)?;
        outputs.push(TxOutput::to_address_v0(*units, &addr_obj));
    }

    let out_sum: u64 = outputs.iter().map(|o| o.amount).sum();
    if out_sum != total_units {
        anyhow::bail!("output sum {out_sum} != total {total_units}");
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
        time: SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs(),
        bits: 0x1d00ffff,
        nonce: 0,
    };
    let genesis_block = Block::build(genesis_header, vec![genesis_tx])?;
    let block_hex = hex::encode(genesis_block.to_wire()?);

    let block_file = out_dir.join("genesis-block-v2.hex");
    std::fs::write(&block_file, &block_hex)?;

    println!();
    println!("==============================================");
    println!("  Genesis v2 (height 1) — controlled regenesis");
    println!("==============================================");
    println!("  Treasury (NEW):  {}  ({} ACP)", treasury_addr, treasury_acp);
    println!("  Hot wallet:      {}  ({} ACP)", hot_addr, HOT_ACP);
    println!("  Project treasury:{}  ({} ACP)", project_treasury, PROJECT_TREASURY_ACP);
    println!("  Bridge reserve:  {}  ({} ACP)", bridge_reserve, BRIDGE_RESERVE_ACP);
    println!("  User outputs:    {} wallets", user_outputs.len());
    println!("  Keystore dir:    {}", out_dir.display());
    println!("  Block file:      {}", block_file.display());
    println!();

    let client = Client::builder()
        .timeout(Duration::from_secs(RPC_TIMEOUT_SECS))
        .build()?;

    if let Err(e) = rpc(&client, &rpc_url, "getblockcount", json!({})) {
        eprintln!("[!] Node unavailable at {rpc_url}: {e}");
        eprintln!("    Block saved — submit manually when node is ready.");
        return Err(e.into());
    }

    let count = rpc(&client, &rpc_url, "getblockcount", json!({}))?
        .as_u64()
        .unwrap_or(0);
    if count > 0 {
        eprintln!("[!] WARNING: chain already has {count} blocks — regenesis requires empty data-dir");
    }

    let res = rpc(
        &client,
        &rpc_url,
        "submitblock",
        json!({ "block": block_hex }),
    )?;
    let accepted = res.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false);
    if !accepted {
        let reason = res
            .get("reason")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        anyhow::bail!("Node rejected genesis v2: {reason}");
    }
    let blockhash = res
        .get("blockhash")
        .and_then(|v| v.as_str())
        .unwrap_or("?");
    println!("[OK] Genesis v2 accepted. Block hash: {blockhash}");
    println!();
    Ok(())
}
