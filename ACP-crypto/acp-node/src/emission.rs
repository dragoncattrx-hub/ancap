use anyhow::Result;
use acp_crypto::{protocol_params, AddressV0, Block, Mnemonic, Transaction, TxInput, TxOutput, UNITS_PER_ACP, WalletIdentity};
use rand_core::OsRng;
use std::fs;
use std::path::PathBuf;

use crate::storage::rocks::Rocks;
use crate::storage::Storage;

const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60;
const EMISSION_VOUT_TAG: u32 = 1;
const MINER_EMISSION_SIGNER_PHRASE: &str =
    "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const AUTO_MINER_MNEMONIC_FILE: &str = "miner-reward.mnemonic.txt";
const AUTO_MINER_ADDRESS_FILE: &str = "miner-reward.address.txt";
const AUTO_MINER_WALLET_FILE: &str = "miner-reward.wallet.txt";

fn reserve_total_units() -> u64 {
    protocol_params::GENESIS_ACP_VALIDATOR_RESERVE.saturating_mul(UNITS_PER_ACP)
}

fn annual_emission_units() -> u64 {
    protocol_params::ANNUAL_EMISSION_ACP.saturating_mul(UNITS_PER_ACP)
}

fn reserve_unlock_limit_units(genesis_time: u64, now_time: u64) -> u64 {
    if now_time <= genesis_time {
        return 0;
    }
    let elapsed = now_time - genesis_time;
    let unlocked = (annual_emission_units() as u128)
        .saturating_mul(elapsed as u128)
        / (SECONDS_PER_YEAR as u128);
    unlocked.min(reserve_total_units() as u128) as u64
}

fn genesis_time(storage: &Storage<Rocks>) -> Result<Option<u64>> {
    let Some(bh) = storage.get_blockhash_by_height(1)? else {
        return Ok(None);
    };
    let Some(block_wire) = storage.get_block_wire(&bh)? else {
        return Ok(None);
    };
    let block = Block::from_wire(&block_wire).map_err(anyhow::Error::msg)?;
    Ok(Some(block.header.time))
}

fn emission_amount_in_tx(tx: &Transaction) -> Option<u64> {
    if tx.inputs.len() != 1 || tx.outputs.len() != 1 {
        return None;
    }
    let i = &tx.inputs[0];
    let o = &tx.outputs[0];
    if i.prev_txid != [0u8; 32] || i.vout != EMISSION_VOUT_TAG {
        return None;
    }
    if i.amount != o.amount {
        return None;
    }
    Some(o.amount)
}

fn emitted_units_in_chain(storage: &Storage<Rocks>) -> Result<u64> {
    let best = storage.best_height()?;
    if best < 2 {
        return Ok(0);
    }
    let mut total: u128 = 0;
    for h in 2..=best {
        let Some(bh) = storage.get_blockhash_by_height(h)? else {
            continue;
        };
        let Some(block_wire) = storage.get_block_wire(&bh)? else {
            continue;
        };
        let block = match Block::from_wire(&block_wire) {
            Ok(b) => b,
            Err(_) => continue,
        };
        if let Some(tx0) = block.txs.first() {
            if let Some(amount) = emission_amount_in_tx(tx0) {
                total = total.saturating_add(amount as u128);
            }
        }
    }
    Ok(total.min(u64::MAX as u128) as u64)
}

fn emission_amount_in_block(block: &Block) -> Result<u64> {
    let mut seen: u64 = 0;
    for (idx, tx) in block.txs.iter().enumerate() {
        if let Some(amount) = emission_amount_in_tx(tx) {
            if idx != 0 {
                anyhow::bail!("emission tx must be first transaction in block");
            }
            if seen != 0 {
                anyhow::bail!("only one emission tx per block is allowed");
            }
            seen = amount;
        }
    }
    Ok(seen)
}

pub fn emission_available_now_units(storage: &Storage<Rocks>, now_time: u64) -> Result<u64> {
    let Some(genesis_time) = genesis_time(storage)? else {
        return Ok(0);
    };
    let unlocked = reserve_unlock_limit_units(genesis_time, now_time);
    let emitted = emitted_units_in_chain(storage)?;
    Ok(unlocked.saturating_sub(emitted))
}

pub fn build_miner_emission_tx(chain_id: u32, payout_address: &str, amount_units: u64) -> Result<Transaction> {
    let address = AddressV0::decode(payout_address).map_err(anyhow::Error::msg)?;
    let mut tx = Transaction::new_unsigned(
        chain_id,
        vec![TxInput {
            prev_txid: [0u8; 32],
            vout: EMISSION_VOUT_TAG,
            amount: amount_units,
        }],
        vec![TxOutput::to_address_v0(amount_units, &address)],
    );
    let mnemonic = Mnemonic::parse(MINER_EMISSION_SIGNER_PHRASE).map_err(anyhow::Error::msg)?;
    let seed = mnemonic.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).map_err(anyhow::Error::msg)?;
    tx.sign(&id.spend).map_err(anyhow::Error::msg)?;
    Ok(tx)
}

pub fn validate_block_emission(storage: &Storage<Rocks>, block: &Block) -> Result<()> {
    if block.header.height <= 1 {
        return Ok(());
    }
    let Some(genesis_time) = genesis_time(storage)? else {
        return Ok(());
    };
    let block_emission = emission_amount_in_block(block)?;
    if block_emission == 0 {
        return Ok(());
    }
    let emitted = emitted_units_in_chain(storage)?;
    let unlocked = reserve_unlock_limit_units(genesis_time, block.header.time);
    let attempted = (emitted as u128).saturating_add(block_emission as u128);
    if attempted > unlocked as u128 {
        anyhow::bail!(
            "validator emission: spend exceeds unlocked reserve (unlocked_units={}, attempted_total={})",
            unlocked,
            attempted
        );
    }
    Ok(())
}

pub fn load_or_create_local_miner_reward_address(data_dir: &str) -> Result<String> {
    let base = PathBuf::from(data_dir);
    fs::create_dir_all(&base)?;
    let mnemonic_path = base.join(AUTO_MINER_MNEMONIC_FILE);
    let address_path = base.join(AUTO_MINER_ADDRESS_FILE);

    let mnemonic = if mnemonic_path.exists() {
        fs::read_to_string(&mnemonic_path)?.trim().to_string()
    } else {
        let m = Mnemonic::generate_12().map_err(anyhow::Error::msg)?;
        let words = m.words();
        fs::write(&mnemonic_path, format!("{words}\n"))?;
        words
    };

    let parsed = Mnemonic::parse(&mnemonic).map_err(anyhow::Error::msg)?;
    let seed = parsed.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).map_err(anyhow::Error::msg)?;
    let address = id.receive_address_v0().map_err(anyhow::Error::msg)?;
    fs::write(&address_path, format!("{address}\n"))?;
    let wallet_export = format!("Role: Auto Miner Reward Wallet\nAddress: {address}\nMnemonic: {mnemonic}\n");
    fs::write(base.join(AUTO_MINER_WALLET_FILE), wallet_export)?;
    Ok(address)
}
