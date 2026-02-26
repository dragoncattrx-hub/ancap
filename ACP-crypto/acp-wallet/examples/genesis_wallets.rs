//! Генерация кошельков для распределения Genesis (Whitepaper v1.0).
//!
//! Создаёт 4 кошелька: Creator (вестинг), Validator Reserve, Public & Liquidity, Ecosystem.
//! Запуск из корня репо: cargo run -p acp-wallet --example genesis_wallets
//!
//! ВАЖНО: мнемоники нужно сохранить в безопасном месте. Кто владеет мнемоникой — владеет средствами.

use acp_crypto::{
    protocol_params::{
        GENESIS_ACP_CREATOR, GENESIS_ACP_ECOSYSTEM, GENESIS_ACP_PUBLIC, GENESIS_ACP_VALIDATOR_RESERVE,
        UNITS_PER_ACP,
    },
    Mnemonic, WalletIdentity,
};
use rand_core::OsRng;
use std::io::Write;

const CHAIN_ID: u32 = 1001;

struct GenesisWallet {
    role: &'static str,
    amount_acp: u64,
    mnemonic: String,
    address: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut wallets: Vec<GenesisWallet> = Vec::with_capacity(4);

    let roles: [(&str, u64); 4] = [
        ("Creator (vesting 7 лет)", GENESIS_ACP_CREATOR),
        ("Validator Emission Reserve", GENESIS_ACP_VALIDATOR_RESERVE),
        ("Public & Liquidity", GENESIS_ACP_PUBLIC),
        ("Ecosystem Grants", GENESIS_ACP_ECOSYSTEM),
    ];

    for (idx, (role, amount_acp)) in roles.iter().enumerate() {
        let m = Mnemonic::generate_12()?;
        let seed = m.to_seed("");
        let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
        let receive_addr = id.receive_address_v0()?;

        // Ecosystem (4-й): сохраняем keystore для переводов (одна и та же мнемоника даёт разный адрес из‑за случайного Dilithium)
        if idx == 3 {
            let path = "ecosystem.keystore.json";
            let _ = std::fs::remove_file(path); // remove stale keystore from previous run
            let ks = id.to_keystore_v3(&seed)?;
            std::fs::File::create(path)?.write_all(serde_json::to_string_pretty(&ks)?.as_bytes())?;
            println!("Ecosystem keystore written: {} (address: {})", path, receive_addr);
        }

        wallets.push(GenesisWallet {
            role,
            amount_acp: *amount_acp,
            mnemonic: m.words(),
            address: receive_addr,
        });
    }

    // Вывод в консоль
    println!();
    println!("==============================================");
    println!("  ACP Genesis Wallets (ANCAP token)");
    println!("  Chain ID: {}", CHAIN_ID);
    println!("==============================================");
    println!();

    for (i, w) in wallets.iter().enumerate() {
        println!("--- Кошелёк {}: {} ---", i + 1, w.role);
        println!("  ACP: {} ({} units)", w.amount_acp, w.amount_acp * UNITS_PER_ACP);
        println!("  Адрес:  {}", w.address);
        println!("  Мнемоника: {}", w.mnemonic);
        println!();
    }

    println!("==============================================");
    println!("  ВАЖНО: сохраните мнемоники в безопасном месте!");
    println!("  Потеря мнемоники = потеря доступа к средствам.");
    println!("==============================================");
    println!();

    // Записать адреса в JSON (без мнемоник) для сборки Genesis
    let out: Vec<serde_json::Value> = wallets
        .iter()
        .map(|w| {
            serde_json::json!({
                "role": w.role,
                "amount_acp": w.amount_acp,
                "amount_units": w.amount_acp * UNITS_PER_ACP,
                "address": w.address
            })
        })
        .collect();
    let path = "genesis-addresses.json";
    std::fs::write(path, serde_json::to_string_pretty(&out)?)?;
    println!("Адреса записаны в: {}", path);
    println!("(Мнемоники только выше — сохраните их вручную.)");

    Ok(())
}
