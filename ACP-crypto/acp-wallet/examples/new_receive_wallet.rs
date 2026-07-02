//! Generating one wallet to accept ACP.
//!
//! Run from the repo root: cargo run -p acp-wallet --example new_receive_wallet
//! The address can be sent to the sender - transfer ACP to it.
//! Keep the mnemonics in a safe place: whoever owns the mnemonics owns the funds.

use acp_crypto::{Mnemonic, WalletIdentity};
use rand_core::OsRng;
use std::io::Write;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let m = Mnemonic::generate_12()?;
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng)?;
    let address = id.receive_address_v0()?;
    let ks = id.to_keystore_v3(&seed)?;

    println!();
    println!("==============================================");
    println!("ACP - address for receiving funds");
    println!("==============================================");
    println!();
    println!(" Address: {}", address);
    println!(" Mnemonic: {}", m.words());
    println!();
    println!("Send the address to the sender. ACPs come to this address.");
    println!("Keep mnemonic AND keystore in a safe place!");
    println!(" Mnemonic alone cannot recover hybrid (PQC) addresses.");
    println!("==============================================");
    println!();

    let out_path = "receive-address.txt";
    std::fs::write(out_path, format!("{}\n", address))?;
    let ks_path = "receive-wallet.keystore.json";
    std::fs::File::create(ks_path)?.write_all(serde_json::to_string_pretty(&ks)?.as_bytes())?;
    println!(" Address written in: {}", out_path);
    println!(" Keystore written in: {}", ks_path);
    println!();

    Ok(())
}
