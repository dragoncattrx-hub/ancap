//! Build a single validator-emission block that pays `MINT_AMOUNT_ACP` ACP to
//! `MINT_TREASURY_ADDR` and print the block wire hex to stdout.
//!
//! The emission input is synthetic (prev_txid = 0, vout = 1 = EMISSION_VOUT_TAG)
//! and is signed by the canonical, publicly-known emission signer phrase. The
//! node accepts it up to the unlocked Validator Emission Reserve budget
//! (`validate_block_emission`). Nobody's private funds are touched.
//!
//! Env vars:
//!   MINT_TREASURY_ADDR   destination acp1... address (required)
//!   MINT_AMOUNT_ACP      whole ACP to emit (default 1_000_000)
//!   MINT_HEIGHT          new block height = best_height + 1 (required)
//!   MINT_PREV_HASH       best block hash hex (required)
//!   MINT_CHAIN_ID        chain id (default 1001)

use acp_crypto::{
    AddressV0, Block, BlockHeader, Mnemonic, Transaction, TxInput, TxOutput, WalletIdentity,
    UNITS_PER_ACP,
};
use rand_core::OsRng;
use std::time::{SystemTime, UNIX_EPOCH};

const EMISSION_VOUT_TAG: u32 = 1;
const GENESIS_BITS: u32 = 0x1d00ffff;
const EMISSION_SIGNER_PHRASE: &str =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

fn env(name: &str) -> Option<String> {
    std::env::var(name).ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let treasury = env("MINT_TREASURY_ADDR").ok_or("MINT_TREASURY_ADDR is required")?;
    let amount_acp: u64 = env("MINT_AMOUNT_ACP").as_deref().unwrap_or("1000000").parse()?;
    let height: u64 = env("MINT_HEIGHT").ok_or("MINT_HEIGHT is required")?.parse()?;
    let prev_hex = env("MINT_PREV_HASH").ok_or("MINT_PREV_HASH is required")?;
    let chain_id: u32 = env("MINT_CHAIN_ID").as_deref().unwrap_or("1001").parse()?;

    let amount_units = amount_acp
        .checked_mul(UNITS_PER_ACP)
        .ok_or("amount overflow")?;

    let prev_bytes = hex::decode(&prev_hex)?;
    if prev_bytes.len() != 32 {
        return Err("MINT_PREV_HASH must be 32 bytes hex".into());
    }
    let mut prev_blockhash = [0u8; 32];
    prev_blockhash.copy_from_slice(&prev_bytes);

    let addr = AddressV0::decode(&treasury).map_err(|e| format!("bad address: {e}"))?;

    let mut tx = Transaction::new_unsigned(
        chain_id,
        vec![TxInput {
            prev_txid: [0u8; 32],
            vout: EMISSION_VOUT_TAG,
            amount: amount_units,
        }],
        vec![TxOutput::to_address_v0(amount_units, &addr)],
    );
    let mnemonic = Mnemonic::parse(EMISSION_SIGNER_PHRASE).map_err(|e| format!("mnemonic: {e}"))?;
    let seed = mnemonic.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).map_err(|e| format!("identity: {e}"))?;
    tx.sign(&id.spend).map_err(|e| format!("sign: {e}"))?;

    let header = BlockHeader {
        version: 1,
        chain_id,
        height,
        prev_blockhash,
        merkle_root: [0u8; 32],
        time: SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs(),
        bits: GENESIS_BITS,
        nonce: 0,
    };
    let block = Block::build(header, vec![tx]).map_err(|e| format!("build: {e}"))?;
    let block_hex = hex::encode(block.to_wire().map_err(|e| format!("wire: {e}"))?);
    println!("{block_hex}");
    Ok(())
}
