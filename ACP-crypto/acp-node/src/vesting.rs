use anyhow::Result;
use acp_crypto::{protocol_params, Block, Transaction, TxId, UNITS_PER_ACP};

use crate::mempool::Mempool;
use crate::storage::db::KvDb;
use crate::storage::rocks::Rocks;
use crate::storage::{schema::CF_TXS, Storage};

const SECONDS_PER_MONTH: u64 = 30 * 24 * 60 * 60;

fn creator_total_units() -> u64 {
    protocol_params::GENESIS_ACP_CREATOR.saturating_mul(UNITS_PER_ACP)
}

fn creator_unlock_limit_units(genesis_time: u64, now_time: u64) -> u64 {
    if now_time <= genesis_time {
        return 0;
    }
    let elapsed = now_time - genesis_time;
    let cliff = protocol_params::CREATOR_VESTING_CLIFF_MONTHS as u64 * SECONDS_PER_MONTH;
    if elapsed <= cliff {
        return 0;
    }

    let linear_months = protocol_params::CREATOR_VESTING_LINEAR_MONTHS as u64;
    let months_after_cliff = ((elapsed - cliff) / SECONDS_PER_MONTH).min(linear_months);
    if months_after_cliff == 0 {
        return 0;
    }

    let per_month_units =
        (protocol_params::CREATOR_VESTING_PER_MONTH as u128).saturating_mul(UNITS_PER_ACP as u128);
    let unlocked = per_month_units.saturating_mul(months_after_cliff as u128);
    unlocked.min(creator_total_units() as u128) as u64
}

fn creator_outpoint_and_genesis_time(storage: &Storage<Rocks>) -> Result<Option<(TxId, u32, u64)>> {
    let Some(bh) = storage.get_blockhash_by_height(1)? else {
        return Ok(None);
    };
    let Some(block_wire) = storage.get_block_wire(&bh)? else {
        return Ok(None);
    };
    let block = Block::from_wire(&block_wire).map_err(anyhow::Error::msg)?;
    let Some(first_tx) = block.txs.first() else {
        return Ok(None);
    };
    let txid = first_tx.txid().map_err(anyhow::Error::msg)?;
    Ok(Some((txid, 0, block.header.time)))
}

fn spent_from_outpoint_in_chain(storage: &Storage<Rocks>, prev_txid: &TxId, vout: u32) -> Result<u64> {
    let mut total: u128 = 0;
    let mut walk = |_: &[u8], wire: &[u8]| -> Result<bool> {
        let tx = match Transaction::from_wire(wire) {
            Ok(t) => t,
            Err(_) => return Ok(true),
        };
        for i in &tx.inputs {
            if &i.prev_txid == prev_txid && i.vout == vout {
                total = total.saturating_add(i.amount as u128);
            }
        }
        Ok(true)
    };
    storage.db.for_each_cf(CF_TXS, &mut walk)?;
    Ok(total.min(u64::MAX as u128) as u64)
}

fn spent_from_outpoint_in_mempool(mempool: &Mempool, prev_txid: &TxId, vout: u32) -> Result<u64> {
    let mut total: u128 = 0;
    for txid in mempool.txids() {
        let Some(wire) = mempool.get(&txid) else {
            continue;
        };
        let tx = match Transaction::from_wire(&wire) {
            Ok(t) => t,
            Err(_) => continue,
        };
        for i in &tx.inputs {
            if &i.prev_txid == prev_txid && i.vout == vout {
                total = total.saturating_add(i.amount as u128);
            }
        }
    }
    Ok(total.min(u64::MAX as u128) as u64)
}

fn spent_from_outpoint_in_tx(tx: &Transaction, prev_txid: &TxId, vout: u32) -> u64 {
    let mut total: u128 = 0;
    for i in &tx.inputs {
        if &i.prev_txid == prev_txid && i.vout == vout {
            total = total.saturating_add(i.amount as u128);
        }
    }
    total.min(u64::MAX as u128) as u64
}

pub fn validate_tx_creator_vesting(
    storage: &Storage<Rocks>,
    mempool: &Mempool,
    tx: &Transaction,
    now_time: u64,
) -> Result<()> {
    let Some((creator_txid, creator_vout, genesis_time)) = creator_outpoint_and_genesis_time(storage)? else {
        return Ok(());
    };

    let spend_in_tx = spent_from_outpoint_in_tx(tx, &creator_txid, creator_vout);
    if spend_in_tx == 0 {
        return Ok(());
    }

    let already_spent_chain = spent_from_outpoint_in_chain(storage, &creator_txid, creator_vout)?;
    let already_spent_mempool = spent_from_outpoint_in_mempool(mempool, &creator_txid, creator_vout)?;
    let unlock_limit = creator_unlock_limit_units(genesis_time, now_time);
    let would_be_spent = (already_spent_chain as u128)
        .saturating_add(already_spent_mempool as u128)
        .saturating_add(spend_in_tx as u128);

    if would_be_spent > unlock_limit as u128 {
        anyhow::bail!(
            "creator vesting: spend exceeds unlocked amount (unlocked_units={}, attempted_total_spent={})",
            unlock_limit,
            would_be_spent
        );
    }
    Ok(())
}

pub fn validate_block_creator_vesting(storage: &Storage<Rocks>, block: &Block) -> Result<()> {
    let Some((creator_txid, creator_vout, genesis_time)) = creator_outpoint_and_genesis_time(storage)? else {
        return Ok(());
    };
    let unlock_limit = creator_unlock_limit_units(genesis_time, block.header.time);
    let mut spent = spent_from_outpoint_in_chain(storage, &creator_txid, creator_vout)? as u128;

    for tx in &block.txs {
        spent = spent.saturating_add(spent_from_outpoint_in_tx(tx, &creator_txid, creator_vout) as u128);
    }
    if spent > unlock_limit as u128 {
        anyhow::bail!(
            "creator vesting: block spend exceeds unlocked amount (unlocked_units={}, attempted_total_spent={})",
            unlock_limit,
            spent
        );
    }
    Ok(())
}
