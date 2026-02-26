//! Перевод 500 ACP с кошелька Ecosystem Grants на тестовый кошелёк.
//!
//! Требования: нода запущена, genesis уже применён (блок 1 с одной tx и 4 выходами).
//! Мнемонику Ecosystem храните в ecosystem.mnemonic (одна строка, 12 слов) или в ACP_ECOSYSTEM_MNEMONIC.
//!
//! Запуск: cargo run -p acp-wallet --example transfer_500_acp

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
const GENESIS_ECOSYSTEM_VOUT: u32 = 3; // порядок в genesis: Creator=0, Validator=1, Public=2, Ecosystem=3

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
    }).map_err(|_| anyhow!("Задайте ACP_ECOSYSTEM_MNEMONIC или создайте файл ecosystem.mnemonic с мнемоникой Ecosystem Grants (одна строка, 12 слов)"))?;

    let genesis_path = "genesis-addresses.json";
    let genesis_json: Vec<serde_json::Value> =
        serde_json::from_str(&std::fs::read_to_string(genesis_path)?)?;
    let ecosystem_entry = genesis_json
        .iter()
        .find(|e| e.get("role").and_then(|r| r.as_str()).map_or(false, |r| r.contains("Ecosystem")))
        .ok_or_else(|| anyhow!("В genesis-addresses.json нет роли Ecosystem Grants"))?;
    let ecosystem_addr_str = ecosystem_entry["address"]
        .as_str()
        .ok_or_else(|| anyhow!("Ecosystem address не строка"))?;
    let ecosystem_addr = AddressV0::decode(ecosystem_addr_str)?;

    let m = Mnemonic::parse(mnemonic_str.trim())?;
    let seed = m.to_seed("");
    let ecosystem_id = WalletIdentity::new_from_seed(&seed, OsRng)?;
    let derived_addr = ecosystem_id.receive_address_v0()?;
    if derived_addr != ecosystem_addr_str {
        anyhow::bail!(
            "Мнемоника не совпадает с адресом Ecosystem в genesis: ожидался {}, получен {}",
            ecosystem_addr_str,
            derived_addr
        );
    }

    let client = Client::new();

    let block1_hash_hex: String = rpc(&client, "getblockhash", json!({ "height": 1 }))?
        .as_str()
        .ok_or_else(|| anyhow!("getblockhash(1) не вернул строку"))?
        .to_string();
    let block1 = rpc(&client, "getblock", json!({ "blockhash": block1_hash_hex, "verbose": 2 }))?;
    let txs = block1["tx"].as_array().ok_or_else(|| anyhow!("getblock: нет tx"))?;
    let genesis_tx = txs.first().ok_or_else(|| anyhow!("В блоке 1 нет транзакций"))?;
    let genesis_txid_hex: String = genesis_tx["txid"]
        .as_str()
        .ok_or_else(|| anyhow!("нет txid"))?
        .to_string();
    let genesis_txid = TxHex::decode_txid(&genesis_txid_hex)?;
    let vouts = genesis_tx["vout"].as_array().ok_or_else(|| anyhow!("нет vout"))?;
    let vout3 = vouts
        .get(GENESIS_ECOSYSTEM_VOUT as usize)
        .ok_or_else(|| anyhow!("нет vout {} (Ecosystem)", GENESIS_ECOSYSTEM_VOUT))?;
    let ecosystem_amount: u64 = vout3["amount"]
        .as_u64()
        .ok_or_else(|| anyhow!("vout amount не число"))?;

    let test_mnemonic = Mnemonic::generate_12()?;
    let test_seed = test_mnemonic.to_seed("");
    let test_id = WalletIdentity::new_from_seed(&test_seed, OsRng)?;
    let test_addr = test_id.receive_address_v0()?;
    let test_addr_decoded = AddressV0::decode(&test_addr)?;

    let transfer_units = TRANSFER_ACP * UNITS_PER_ACP;
    let change = ecosystem_amount
        .checked_sub(transfer_units)
        .and_then(|x| x.checked_sub(MIN_FEE_UNITS))
        .ok_or_else(|| anyhow!("Недостаточно средств на Ecosystem (нужно как минимум {} ACP + комиссия)", TRANSFER_ACP))?;

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
        anyhow::bail!("Нода отклонила транзакцию: {}", reason);
    }

    println!();
    println!("==============================================");
    println!("  Перевод {} ACP: Ecosystem -> Test кошелёк", TRANSFER_ACP);
    println!("==============================================");
    println!();
    println!("TxID: {}", TxHex::encode_txid(&txid));
    println!("Сумма: {} ACP на тестовый адрес", TRANSFER_ACP);
    println!();
    println!("Тестовый кошелёк (сохраните мнемонику!):");
    println!("  Адрес:    {}", test_addr);
    println!("  Мнемоника: {}", test_mnemonic.words());
    println!();
    println!("Проверить балансы после включения tx в блок:");
    println!("  run-check-acp-balances.bat");
    println!(
        "  (или: cargo run -p acp-wallet --example check_balances -- {} {})",
        ecosystem_addr_str, test_addr
    );
    println!();

    Ok(())
}
