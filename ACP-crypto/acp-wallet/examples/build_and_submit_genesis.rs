//! Сборка и отправка genesis-блока (блок 1) по genesis-addresses.json.
//!
//! Требования: нода запущена (RPC на http://127.0.0.1:8545/rpc), база пустая (ещё нет блоков).
//! Сначала сгенерируйте кошельки: run-genesis-wallets.bat → получите genesis-addresses.json.
//!
//! Запуск: cargo run -p acp-wallet --example build_and_submit_genesis

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
/// Детерминированная мнемоника только для подписи genesis-tx (никто не хранит средства на этом ключе).
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
        anyhow::bail!("genesis-addresses.json должен содержать 4 записи (Creator, Validator, Public, Ecosystem)");
    }

    let total_units = BASE_SUPPLY_ACP * UNITS_PER_ACP;
    let mut outputs = Vec::with_capacity(4);
    let mut sum: u64 = 0;
    for entry in &genesis {
        let addr_str = entry["address"].as_str().ok_or_else(|| anyhow::anyhow!("нет address"))?;
        let amount_units: u64 = entry["amount_units"].as_u64().ok_or_else(|| anyhow::anyhow!("нет amount_units"))?;
        let addr = AddressV0::decode(addr_str)?;
        outputs.push(TxOutput::to_address_v0(amount_units, &addr));
        sum = sum.saturating_add(amount_units);
    }
    if sum != total_units {
        anyhow::bail!(
            "Сумма в genesis-addresses.json ({}) не равна base supply ({} units)",
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
    println!("Одна tx, 4 выхода: Creator, Validator Reserve, Public & Liquidity, Ecosystem.");
    println!("Блок сохранён в: {}", block_file);
    println!();

    let client = Client::builder()
        .timeout(Duration::from_secs(RPC_TIMEOUT_SECS))
        .build()?;

    match rpc(&client, &rpc_url, "getblockcount", json!({})) {
        Ok(_) => {}
        Err(e) => {
            eprintln!("[!] Нода недоступна (getblockcount): {}", e);
            eprintln!();
            eprintln!("Отправьте блок вручную через PowerShell:");
            eprintln!("  run-submit-genesis-block.bat");
            eprintln!();
            return Err(e.into());
        }
    }

    let res = match rpc(&client, &rpc_url, "submitblock", json!({ "block": block_hex })) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("[!] Ошибка отправки блока: {}", e);
            eprintln!();
            eprintln!("Блок уже в файле {}. Отправьте вручную:", block_file);
            eprintln!("  run-submit-genesis-block.bat");
            eprintln!();
            return Err(e.into());
        }
    };

    let accepted = res.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false);
    if !accepted {
        let reason = res.get("reason").and_then(|v| v.as_str()).unwrap_or("unknown");
        anyhow::bail!("Нода отклонила блок: {}", reason);
    }

    let blockhash = res.get("blockhash").and_then(|v| v.as_str());
    println!("[OK] Genesis применён. Block hash: {:?}", blockhash);
    println!();
    println!("Дальше: run-transfer-500-acp.bat (перевод 500 ACP с Ecosystem на тестовый кошелёк).");
    println!();
    Ok(())
}
