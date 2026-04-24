//! Generation of wallets for Genesis distribution (Whitepaper v1.0).
//!
//! Creates 4 wallets: Creator (vesting), Validator Reserve, Public & Liquidity, Ecosystem.
//! Run from the repo root: cargo run -p acp-wallet --example genesis_wallets
//!
//! IMPORTANT: Mnemonics must be kept in a safe place. Whoever owns mnemonics owns the means.

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
        ("Creator (vesting 7 years)", GENESIS_ACP_CREATOR),
        ("Validator Emission Reserve", GENESIS_ACP_VALIDATOR_RESERVE),
        ("Public & Liquidity", GENESIS_ACP_PUBLIC),
        ("Ecosystem Grants", GENESIS_ACP_ECOSYSTEM),
    ];

    for (idx, (role, amount_acp)) in roles.iter().enumerate() {
        let m = Mnemonic::generate_12()?;
        let seed = m.to_seed("");
        let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
        let receive_addr = id.receive_address_v0()?;

        // Ecosystem (4th): save the keystore for translations (the same mnemonic gives a different address due to random Dilithium)
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

    // Output to console
    println!();
    println!("==============================================");
    println!("  ACP Genesis Wallets (ANCAP token)");
    println!("  Chain ID: {}", CHAIN_ID);
    println!("==============================================");
    println!();

    for (i, w) in wallets.iter().enumerate() {
        println!("--- Wallet {}: {} ---", i + 1, w.role);
        println!("  ACP: {} ({} units)", w.amount_acp, w.amount_acp * UNITS_PER_ACP);
        println!(" Address: {}", w.address);
        println!(" Mnemonic: {}", w.mnemonic);
        println!();
    }

    println!("==============================================");
    println!("IMPORTANT: Keep the mnemonics in a safe place!");
    println!(" Loss of mnemonics = loss of access to tools.");
    println!("==============================================");
    println!();

    // Write addresses in JSON (without mnemonics) for the Genesis build
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
    println!("Addresses are written in: {}", path);
    println!("(Mnemonics above only - save them manually.)");

    Ok(())
}
