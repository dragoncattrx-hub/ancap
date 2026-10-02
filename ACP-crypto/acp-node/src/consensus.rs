//! Stateful monetary consensus for ACP.
//!
//! The transaction wire carries an input amount for signing and display, but
//! consensus must always resolve the referenced output and use its amount.
//! This module enforces UTXO existence, ownership, single-spend, conservation,
//! the 210M genesis cap, and release schedules for the locked genesis buckets.
//!
//! AddressV0 commits to the view public key, so ownership is the matching
//! view signature. Changing that commitment would remint every published
//! address and is therefore out of scope for this recovery.

use std::collections::HashSet;
use std::time::{SystemTime, UNIX_EPOCH};

use acp_crypto::{
    protocol_params, subaddress_hash20, Block, Transaction, TxId, TxOutput,
    DEFAULT_SUBADDR_SCAN_WINDOW, MIN_FEE_UNITS, UNITS_PER_ACP,
};
use anyhow::Result;

use crate::config::MAX_FUTURE_DRIFT_SECS;
use crate::storage::db::KvDb;
use crate::storage::rocks::Rocks;
use crate::storage::schema::{
    CF_META, CF_SPENT_OUTPOINTS, CF_UTXO_ROLES, KEY_CHAIN_ID, KEY_CREATOR_RELEASED_UNITS,
    KEY_GENESIS_HASH, KEY_ISSUED_SUPPLY_UNITS, KEY_UTXO_COUNT, KEY_UTXO_SUPPLY_UNITS,
    KEY_VALIDATOR_RELEASED_UNITS,
};
use crate::storage::Storage;

const SECONDS_PER_MONTH: u64 = 30 * 24 * 60 * 60;
const SECONDS_PER_YEAR: u64 = 365 * 24 * 60 * 60;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum LockedRole {
    Creator = 1,
    Validator = 2,
}

impl LockedRole {
    fn from_byte(value: u8) -> Option<Self> {
        match value {
            1 => Some(Self::Creator),
            2 => Some(Self::Validator),
            _ => None,
        }
    }

    pub(crate) fn as_byte(self) -> u8 {
        self as u8
    }
}

#[derive(Debug)]
pub(crate) struct ConsensusUpdate {
    pub(crate) spent_outpoints: Vec<([u8; 36], TxId)>,
    pub(crate) output_roles: Vec<([u8; 36], LockedRole)>,
    pub(crate) utxo_supply_units: u64,
    pub(crate) issued_supply_units: u64,
    pub(crate) utxo_count: u64,
    pub(crate) creator_released_units: u64,
    pub(crate) validator_released_units: u64,
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct SupplyInfo {
    pub(crate) max_supply_units: u64,
    pub(crate) issued_supply_units: u64,
    pub(crate) utxo_supply_units: u64,
    pub(crate) utxo_count: u64,
    pub(crate) creator_released_units: u64,
    pub(crate) validator_released_units: u64,
}

#[derive(Debug)]
struct ValidatedTx {
    txid: TxId,
    spent_outpoints: Vec<[u8; 36]>,
    output_roles: Vec<([u8; 36], LockedRole)>,
    input_units: u64,
    output_units: u64,
    creator_release_units: u64,
    validator_release_units: u64,
}

pub(crate) fn outpoint_key(txid: &TxId, vout: u32) -> [u8; 36] {
    let mut key = [0u8; 36];
    key[..32].copy_from_slice(txid);
    key[32..].copy_from_slice(&vout.to_le_bytes());
    key
}

fn checked_units(value: u128, label: &str) -> Result<u64> {
    u64::try_from(value).map_err(|_| anyhow::anyhow!("{label} exceeds u64"))
}

fn output_sum(tx: &Transaction) -> Result<u64> {
    let mut total = 0u128;
    for output in &tx.outputs {
        if output.amount == 0 {
            anyhow::bail!("consensus: zero-value outputs are not allowed");
        }
        total = total
            .checked_add(output.amount as u128)
            .ok_or_else(|| anyhow::anyhow!("consensus: output sum overflow"))?;
    }
    checked_units(total, "consensus: output sum")
}

fn sender_controls_output(tx: &Transaction, output: &TxOutput) -> Result<bool> {
    let recipient = output.recipient_hash20().map_err(anyhow::Error::msg)?;
    for index in 0..=DEFAULT_SUBADDR_SCAN_WINDOW {
        if subaddress_hash20(&tx.sender_pubkey_wire, index) == recipient {
            return Ok(true);
        }
    }
    Ok(false)
}

fn base_supply_units() -> u64 {
    protocol_params::BASE_SUPPLY_ACP
        .checked_mul(UNITS_PER_ACP)
        .expect("BASE_SUPPLY_ACP must fit in u64 units")
}

fn creator_total_units() -> u64 {
    protocol_params::GENESIS_ACP_CREATOR
        .checked_mul(UNITS_PER_ACP)
        .expect("creator allocation must fit in u64 units")
}

fn validator_total_units() -> u64 {
    protocol_params::GENESIS_ACP_VALIDATOR_RESERVE
        .checked_mul(UNITS_PER_ACP)
        .expect("validator allocation must fit in u64 units")
}

fn creator_unlock_limit(genesis_time: u64, at_time: u64) -> u64 {
    if at_time <= genesis_time {
        return 0;
    }
    let elapsed = at_time - genesis_time;
    let cliff = protocol_params::CREATOR_VESTING_CLIFF_MONTHS as u64 * SECONDS_PER_MONTH;
    if elapsed <= cliff {
        return 0;
    }
    let months = ((elapsed - cliff) / SECONDS_PER_MONTH)
        .min(protocol_params::CREATOR_VESTING_LINEAR_MONTHS as u64);
    let unlocked = (protocol_params::CREATOR_VESTING_PER_MONTH as u128)
        .saturating_mul(UNITS_PER_ACP as u128)
        .saturating_mul(months as u128);
    unlocked.min(creator_total_units() as u128) as u64
}

fn validator_unlock_limit(genesis_time: u64, at_time: u64) -> u64 {
    if at_time <= genesis_time {
        return 0;
    }
    let elapsed = at_time - genesis_time;
    let unlocked = (protocol_params::ANNUAL_EMISSION_ACP as u128)
        .saturating_mul(UNITS_PER_ACP as u128)
        .saturating_mul(elapsed as u128)
        / SECONDS_PER_YEAR as u128;
    unlocked.min(validator_total_units() as u128) as u64
}

impl Storage<Rocks> {
    fn consensus_u64(&self, key: &[u8]) -> Result<Option<u64>> {
        let Some(raw) = self.db.get_cf(CF_META, key)? else {
            return Ok(None);
        };
        if raw.len() != 8 {
            anyhow::bail!("consensus metadata is corrupt");
        }
        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&raw);
        Ok(Some(u64::from_le_bytes(bytes)))
    }

    fn require_consensus_u64(&self, key: &[u8], label: &str) -> Result<u64> {
        self.consensus_u64(key)?.ok_or_else(|| {
            anyhow::anyhow!(
                "consensus state missing {label}; legacy/unaudited chain requires regenesis"
            )
        })
    }

    pub(crate) fn ensure_consensus_ready(&self) -> Result<()> {
        if self.best_height()? == 0 {
            return Ok(());
        }
        let info = self.supply_info()?;
        if info.issued_supply_units != base_supply_units()
            || info.utxo_supply_units > info.issued_supply_units
        {
            anyhow::bail!("ACP supply invariant failed; refuse to start");
        }
        Ok(())
    }

    pub(crate) fn persist_chain_identity(
        &self,
        batch: &mut rocksdb::WriteBatch,
        chain_id: u32,
        genesis_hash: &[u8; 32],
    ) -> Result<()> {
        let dbref = self.db.db();
        Rocks::batch_put_cf(
            batch,
            dbref,
            CF_META,
            KEY_CHAIN_ID,
            &chain_id.to_le_bytes(),
        )?;
        Rocks::batch_put_cf(batch, dbref, CF_META, KEY_GENESIS_HASH, genesis_hash)?;
        Ok(())
    }

    pub(crate) fn ensure_chain_identity(&self, expected_chain_id: u32) -> Result<()> {
        if self.best_height()? == 0 {
            return Ok(());
        }
        let stored = self
            .db
            .get_cf(CF_META, KEY_CHAIN_ID)?
            .ok_or_else(|| anyhow::anyhow!("consensus: stored chain id is missing"))?;
        if stored.len() != 4 {
            anyhow::bail!("consensus: stored chain id is corrupt");
        }
        let mut bytes = [0u8; 4];
        bytes.copy_from_slice(&stored);
        let stored_id = u32::from_le_bytes(bytes);
        if stored_id != expected_chain_id {
            anyhow::bail!(
                "consensus: stored chain_id {stored_id} does not match configured {expected_chain_id}"
            );
        }
        let stored_genesis = self
            .db
            .get_cf(CF_META, KEY_GENESIS_HASH)?
            .ok_or_else(|| anyhow::anyhow!("consensus: stored genesis hash is missing"))?;
        let live_genesis = self
            .get_blockhash_by_height(1)?
            .ok_or_else(|| anyhow::anyhow!("consensus: genesis block missing"))?;
        if stored_genesis.as_slice() != live_genesis.as_slice() {
            anyhow::bail!("consensus: stored genesis hash does not match height-1 block");
        }
        Ok(())
    }

    pub(crate) fn supply_info(&self) -> Result<SupplyInfo> {
        Ok(SupplyInfo {
            max_supply_units: base_supply_units(),
            issued_supply_units: self
                .require_consensus_u64(KEY_ISSUED_SUPPLY_UNITS, "issued supply")?,
            utxo_supply_units: self.require_consensus_u64(KEY_UTXO_SUPPLY_UNITS, "UTXO supply")?,
            utxo_count: self.require_consensus_u64(KEY_UTXO_COUNT, "UTXO count")?,
            creator_released_units: self
                .require_consensus_u64(KEY_CREATOR_RELEASED_UNITS, "creator release counter")?,
            validator_released_units: self
                .require_consensus_u64(KEY_VALIDATOR_RELEASED_UNITS, "validator release counter")?,
        })
    }

    fn genesis_time(&self) -> Result<u64> {
        let hash = self
            .get_blockhash_by_height(1)?
            .ok_or_else(|| anyhow::anyhow!("consensus: genesis block missing"))?;
        let wire = self
            .get_block_wire(&hash)?
            .ok_or_else(|| anyhow::anyhow!("consensus: genesis block body missing"))?;
        let block = Block::from_wire(&wire).map_err(anyhow::Error::msg)?;
        Ok(block.header.time)
    }

    fn previous_output(&self, txid: &TxId, vout: u32) -> Result<TxOutput> {
        let wire = self
            .get_tx_wire(txid)?
            .ok_or_else(|| anyhow::anyhow!("consensus: referenced transaction does not exist"))?;
        let tx = Transaction::from_wire(&wire).map_err(anyhow::Error::msg)?;
        tx.outputs
            .get(vout as usize)
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("consensus: referenced output does not exist"))
    }

    fn outpoint_role(&self, key: &[u8; 36]) -> Result<Option<LockedRole>> {
        let Some(raw) = self.db.get_cf(CF_UTXO_ROLES, key)? else {
            return Ok(None);
        };
        let role = raw
            .first()
            .copied()
            .and_then(LockedRole::from_byte)
            .ok_or_else(|| anyhow::anyhow!("consensus: invalid locked-role metadata"))?;
        Ok(Some(role))
    }

    fn validate_regular_tx(
        &self,
        tx: &Transaction,
        block_spends: &mut HashSet<[u8; 36]>,
    ) -> Result<ValidatedTx> {
        tx.verify().map_err(anyhow::Error::msg)?;
        if tx.inputs.is_empty() {
            anyhow::bail!("consensus: transaction has no inputs");
        }
        if tx.outputs.is_empty() {
            anyhow::bail!("consensus: transaction has no outputs");
        }

        let txid = tx.txid().map_err(anyhow::Error::msg)?;
        let output_units = output_sum(tx)?;
        let mut input_total = 0u128;
        let mut spent_outpoints = Vec::with_capacity(tx.inputs.len());
        let mut locked_role: Option<LockedRole> = None;
        let mut locked_input_units = 0u128;

        for input in &tx.inputs {
            let key = outpoint_key(&input.prev_txid, input.vout);
            if !block_spends.insert(key) {
                anyhow::bail!("consensus: duplicate/double-spent input in block");
            }
            if self.db.get_cf(CF_SPENT_OUTPOINTS, &key)?.is_some() {
                anyhow::bail!("consensus: referenced output is already spent");
            }

            let previous = self.previous_output(&input.prev_txid, input.vout)?;
            if input.amount != previous.amount {
                anyhow::bail!(
                    "consensus: input amount mismatch (declared={}, actual={})",
                    input.amount,
                    previous.amount
                );
            }
            if !sender_controls_output(tx, &previous)? {
                anyhow::bail!("consensus: signer does not own referenced output");
            }

            input_total = input_total
                .checked_add(previous.amount as u128)
                .ok_or_else(|| anyhow::anyhow!("consensus: input sum overflow"))?;
            if let Some(role) = self.outpoint_role(&key)? {
                if let Some(existing) = locked_role {
                    if existing != role {
                        anyhow::bail!("consensus: cannot mix locked genesis roles");
                    }
                }
                locked_role = Some(role);
                locked_input_units = locked_input_units
                    .checked_add(previous.amount as u128)
                    .ok_or_else(|| anyhow::anyhow!("consensus: locked input sum overflow"))?;
            } else if locked_role.is_some() {
                anyhow::bail!("consensus: cannot mix locked and ordinary inputs");
            }
            spent_outpoints.push(key);
        }

        if locked_role.is_some() && locked_input_units != input_total {
            anyhow::bail!("consensus: cannot mix locked and ordinary inputs");
        }

        let input_units = checked_units(input_total, "consensus: input sum")?;
        if output_units > input_units {
            anyhow::bail!("consensus: outputs exceed referenced inputs");
        }
        let fee = input_units - output_units;
        if fee < MIN_FEE_UNITS {
            anyhow::bail!(
                "consensus: fee too low (actual={}, minimum={})",
                fee,
                MIN_FEE_UNITS
            );
        }

        let mut output_roles = Vec::new();
        let mut creator_release_units = 0;
        let mut validator_release_units = 0;
        if let Some(role) = locked_role {
            let mut locked_change = 0u128;
            for (vout, output) in tx.outputs.iter().enumerate() {
                if sender_controls_output(tx, output)? {
                    locked_change = locked_change
                        .checked_add(output.amount as u128)
                        .ok_or_else(|| anyhow::anyhow!("consensus: locked change overflow"))?;
                    output_roles.push((outpoint_key(&txid, vout as u32), role));
                }
            }
            if locked_change > locked_input_units {
                anyhow::bail!("consensus: locked change exceeds locked input");
            }
            let released = checked_units(
                locked_input_units - locked_change,
                "consensus: locked release",
            )?;
            match role {
                LockedRole::Creator => creator_release_units = released,
                LockedRole::Validator => validator_release_units = released,
            }
        }

        Ok(ValidatedTx {
            txid,
            spent_outpoints,
            output_roles,
            input_units,
            output_units,
            creator_release_units,
            validator_release_units,
        })
    }

    pub(crate) fn validate_mempool_transaction(&self, tx: &Transaction) -> Result<()> {
        if self.best_height()? == 0 {
            anyhow::bail!("consensus: genesis is not initialized");
        }
        self.ensure_consensus_ready()?;
        let mut spends = HashSet::new();
        let validated = self.validate_regular_tx(tx, &mut spends)?;
        let info = self.supply_info()?;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let genesis_time = self.genesis_time()?;
        let creator_total = info
            .creator_released_units
            .checked_add(validated.creator_release_units)
            .ok_or_else(|| anyhow::anyhow!("consensus: creator release overflow"))?;
        if creator_total > creator_unlock_limit(genesis_time, now) {
            anyhow::bail!("consensus: creator spend exceeds unlocked allocation");
        }
        let validator_total = info
            .validator_released_units
            .checked_add(validated.validator_release_units)
            .ok_or_else(|| anyhow::anyhow!("consensus: validator release overflow"))?;
        if validator_total > validator_unlock_limit(genesis_time, now) {
            anyhow::bail!("consensus: validator spend exceeds unlocked reserve");
        }
        Ok(())
    }

    fn validate_genesis(&self, block: &Block) -> Result<ConsensusUpdate> {
        if block.header.version != 1 {
            anyhow::bail!("consensus: genesis version must be 1");
        }
        if block.header.nonce != 0 {
            anyhow::bail!("consensus: genesis nonce must be 0");
        }
        if block.header.bits != crate::config::GENESIS_BITS {
            anyhow::bail!("consensus: genesis bits must be GENESIS_BITS");
        }
        if block.header.prev_blockhash != [0u8; 32] {
            anyhow::bail!("consensus: genesis prev hash must be zero");
        }
        if block.header.time == 0 {
            anyhow::bail!("consensus: genesis timestamp must not be zero");
        }
        if block.txs.len() != 1 {
            anyhow::bail!("consensus: genesis must contain exactly one transaction");
        }
        let tx = &block.txs[0];
        if tx.inputs.len() != 1 {
            anyhow::bail!("consensus: genesis must contain exactly one synthetic input");
        }
        let input = &tx.inputs[0];
        let supply = base_supply_units();
        if input.prev_txid != [0u8; 32] || input.vout != 0 || input.amount != supply {
            anyhow::bail!("consensus: invalid genesis issuance input");
        }
        if tx.outputs.len() != 4 {
            anyhow::bail!("consensus: genesis must contain the four canonical allocations");
        }
        let expected = [
            protocol_params::GENESIS_ACP_CREATOR * UNITS_PER_ACP,
            protocol_params::GENESIS_ACP_VALIDATOR_RESERVE * UNITS_PER_ACP,
            protocol_params::GENESIS_ACP_PUBLIC * UNITS_PER_ACP,
            protocol_params::GENESIS_ACP_ECOSYSTEM * UNITS_PER_ACP,
        ];
        let mut recipients = HashSet::new();
        for (output, expected_units) in tx.outputs.iter().zip(expected) {
            if output.amount != expected_units {
                anyhow::bail!("consensus: genesis allocation amount/order mismatch");
            }
            if !recipients.insert(output.recipient_hash20().map_err(anyhow::Error::msg)?) {
                anyhow::bail!("consensus: genesis allocation recipients must be distinct");
            }
        }
        if block.header.chain_id == protocol_params::DEFAULT_CHAIN_ID {
            let expected_addresses = [
                protocol_params::GENESIS_ADDRESS_CREATOR,
                protocol_params::GENESIS_ADDRESS_VALIDATOR_RESERVE,
                protocol_params::GENESIS_ADDRESS_PUBLIC,
                protocol_params::GENESIS_ADDRESS_ECOSYSTEM,
            ];
            for (output, expected_address) in tx.outputs.iter().zip(expected_addresses) {
                let actual = output
                    .recipient_address_bech32()
                    .map_err(anyhow::Error::msg)?;
                if actual != expected_address {
                    anyhow::bail!("consensus: mainnet genesis recipient mismatch");
                }
            }
        }
        if output_sum(tx)? != supply {
            anyhow::bail!("consensus: genesis outputs must equal exactly 210M ACP");
        }

        let txid = tx.txid().map_err(anyhow::Error::msg)?;
        Ok(ConsensusUpdate {
            spent_outpoints: Vec::new(),
            output_roles: vec![
                (outpoint_key(&txid, 0), LockedRole::Creator),
                (outpoint_key(&txid, 1), LockedRole::Validator),
            ],
            utxo_supply_units: supply,
            issued_supply_units: supply,
            utxo_count: 4,
            creator_released_units: 0,
            validator_released_units: 0,
        })
    }

    pub(crate) fn validate_block_consensus(&self, block: &Block) -> Result<ConsensusUpdate> {
        let wire_len = block.to_wire().map_err(anyhow::Error::msg)?.len();
        if wire_len > protocol_params::MAX_BLOCK_BYTES as usize {
            anyhow::bail!("consensus: block exceeds MAX_BLOCK_BYTES");
        }
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        if block.header.time > now.saturating_add(MAX_FUTURE_DRIFT_SECS) {
            anyhow::bail!("consensus: block timestamp too far in the future");
        }

        if block.header.height == 1 {
            return self.validate_genesis(block);
        }

        self.ensure_consensus_ready()?;
        let best_height = self.best_height()?;
        if let Some(median) = self.get_median_time_past(best_height)? {
            if block.header.time < median {
                anyhow::bail!("consensus: block timestamp is before median-time-past");
            }
        }

        let info = self.supply_info()?;
        let genesis_time = self.genesis_time()?;
        let mut block_spends = HashSet::new();
        let mut seen_txids = HashSet::new();
        let mut spent_outpoints = Vec::new();
        let mut output_roles = Vec::new();
        let mut supply = info.utxo_supply_units as u128;
        let mut utxo_count = info.utxo_count;
        let mut creator_released = info.creator_released_units;
        let mut validator_released = info.validator_released_units;

        for tx in &block.txs {
            let validated = self.validate_regular_tx(tx, &mut block_spends)?;
            if !seen_txids.insert(validated.txid) || self.get_tx_wire(&validated.txid)?.is_some() {
                anyhow::bail!("consensus: duplicate transaction");
            }
            supply = supply
                .checked_sub(validated.input_units as u128)
                .and_then(|v| v.checked_add(validated.output_units as u128))
                .ok_or_else(|| {
                    anyhow::anyhow!("consensus: supply arithmetic underflow/overflow")
                })?;
            utxo_count = utxo_count
                .checked_sub(validated.spent_outpoints.len() as u64)
                .and_then(|v| v.checked_add(tx.outputs.len() as u64))
                .ok_or_else(|| anyhow::anyhow!("consensus: UTXO count underflow/overflow"))?;
            creator_released = creator_released
                .checked_add(validated.creator_release_units)
                .ok_or_else(|| anyhow::anyhow!("consensus: creator release overflow"))?;
            validator_released = validator_released
                .checked_add(validated.validator_release_units)
                .ok_or_else(|| anyhow::anyhow!("consensus: validator release overflow"))?;
            spent_outpoints.extend(
                validated
                    .spent_outpoints
                    .into_iter()
                    .map(|key| (key, validated.txid)),
            );
            output_roles.extend(validated.output_roles);
        }

        if creator_released > creator_unlock_limit(genesis_time, block.header.time) {
            anyhow::bail!("consensus: creator spend exceeds unlocked allocation");
        }
        if validator_released > validator_unlock_limit(genesis_time, block.header.time) {
            anyhow::bail!("consensus: validator spend exceeds unlocked reserve");
        }
        let supply = checked_units(supply, "consensus: UTXO supply")?;
        if supply > base_supply_units() {
            anyhow::bail!("consensus: 210M ACP hard cap exceeded");
        }

        Ok(ConsensusUpdate {
            spent_outpoints,
            output_roles,
            utxo_supply_units: supply,
            issued_supply_units: info.issued_supply_units,
            utxo_count,
            creator_released_units: creator_released,
            validator_released_units: validator_released,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use acp_crypto::{AddressV0, BlockHeader, Seed, TxInput, WalletIdentity};
    use rand_core::OsRng;
    use std::path::PathBuf;
    use uuid::Uuid;

    const CHAIN_ID: u32 = 1002;

    fn temp_db_path() -> PathBuf {
        std::env::temp_dir().join(format!("acp-consensus-{}", Uuid::new_v4()))
    }

    fn identity(seed_byte: u8) -> WalletIdentity {
        let seed = Seed::from_bytes(vec![seed_byte; 32]);
        WalletIdentity::new_from_seed(&seed, OsRng).unwrap()
    }

    fn now() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    fn genesis(public_owner: &WalletIdentity, time: u64) -> (Block, TxId) {
        let supply = base_supply_units();
        let creator = AddressV0 {
            pubkey_hash20: [1; 20],
        };
        let validator = AddressV0 {
            pubkey_hash20: [2; 20],
        };
        let public = public_owner.receive_address_v0_obj().unwrap();
        let ecosystem = AddressV0 {
            pubkey_hash20: [4; 20],
        };
        let mut tx = Transaction::new_unsigned(
            CHAIN_ID,
            vec![TxInput {
                prev_txid: [0; 32],
                vout: 0,
                amount: supply,
            }],
            vec![
                TxOutput::to_address_v0(
                    protocol_params::GENESIS_ACP_CREATOR * UNITS_PER_ACP,
                    &creator,
                ),
                TxOutput::to_address_v0(
                    protocol_params::GENESIS_ACP_VALIDATOR_RESERVE * UNITS_PER_ACP,
                    &validator,
                ),
                TxOutput::to_address_v0(
                    protocol_params::GENESIS_ACP_PUBLIC * UNITS_PER_ACP,
                    &public,
                ),
                TxOutput::to_address_v0(
                    protocol_params::GENESIS_ACP_ECOSYSTEM * UNITS_PER_ACP,
                    &ecosystem,
                ),
            ],
        );
        tx.sign(&public_owner.view).unwrap();
        let txid = tx.txid().unwrap();
        let block = Block::build(
            BlockHeader {
                version: 1,
                chain_id: CHAIN_ID,
                height: 1,
                prev_blockhash: [0; 32],
                merkle_root: [0; 32],
                time,
                bits: crate::config::GENESIS_BITS,
                nonce: 0,
            },
            vec![tx],
        )
        .unwrap();
        (block, txid)
    }

    fn public_spend(
        owner: &WalletIdentity,
        prev_txid: TxId,
        declared_input: u64,
        payment: u64,
    ) -> Transaction {
        let recipient = AddressV0 {
            pubkey_hash20: [9; 20],
        };
        let change = owner.receive_address_v0_obj().unwrap();
        let mut tx = Transaction::new_unsigned(
            CHAIN_ID,
            vec![TxInput {
                prev_txid,
                vout: 2,
                amount: declared_input,
            }],
            vec![
                TxOutput::to_address_v0(payment, &recipient),
                TxOutput::to_address_v0(
                    declared_input
                        .checked_sub(payment)
                        .unwrap()
                        .checked_sub(MIN_FEE_UNITS)
                        .unwrap(),
                    &change,
                ),
            ],
        );
        tx.sign(&owner.view).unwrap();
        tx
    }

    fn next_block(prev: &Block, height: u64, time: u64, txs: Vec<Transaction>) -> Block {
        Block::build(
            BlockHeader {
                version: 1,
                chain_id: CHAIN_ID,
                height,
                prev_blockhash: prev.header.blockhash(),
                merkle_root: [0; 32],
                time,
                bits: crate::config::GENESIS_BITS,
                nonce: 0,
            },
            txs,
        )
        .unwrap()
    }

    #[test]
    fn accepts_conserving_owned_spend_and_tracks_supply() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(7);
            let time = now();
            let (genesis, genesis_txid) = genesis(&owner, time);
            storage.put_block_as_tip(&genesis).unwrap();

            let amount = protocol_params::GENESIS_ACP_PUBLIC * UNITS_PER_ACP;
            let spend = public_spend(&owner, genesis_txid, amount, 1_000);
            let block = next_block(&genesis, 2, time + 1, vec![spend]);
            storage.put_block_as_tip(&block).unwrap();

            let info = storage.supply_info().unwrap();
            assert_eq!(info.issued_supply_units, base_supply_units());
            assert_eq!(info.utxo_supply_units, base_supply_units() - MIN_FEE_UNITS);
            assert_eq!(info.utxo_count, 5);
        }
        let _ = std::fs::remove_dir_all(path);
    }

    #[test]
    fn rejects_declared_amount_that_differs_from_referenced_output() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(8);
            let time = now();
            let (genesis, genesis_txid) = genesis(&owner, time);
            storage.put_block_as_tip(&genesis).unwrap();

            let actual = protocol_params::GENESIS_ACP_PUBLIC * UNITS_PER_ACP;
            let forged = public_spend(&owner, genesis_txid, actual + 1_000_000, 1_000);
            let block = next_block(&genesis, 2, time + 1, vec![forged]);
            let error = storage.put_block_as_tip(&block).unwrap_err().to_string();
            assert!(error.contains("input amount mismatch"), "{error}");
        }
        let _ = std::fs::remove_dir_all(path);
    }

    #[test]
    fn rejects_nonexistent_and_foreign_inputs() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(9);
            let attacker = identity(10);
            let time = now();
            let (genesis, genesis_txid) = genesis(&owner, time);
            storage.put_block_as_tip(&genesis).unwrap();
            let amount = protocol_params::GENESIS_ACP_PUBLIC * UNITS_PER_ACP;

            let mut missing = public_spend(&owner, [55; 32], amount, 1_000);
            missing.inputs[0].vout = 0;
            missing.sign(&owner.view).unwrap();
            let missing_block = next_block(&genesis, 2, time + 1, vec![missing]);
            let error = storage
                .put_block_as_tip(&missing_block)
                .unwrap_err()
                .to_string();
            assert!(error.contains("does not exist"), "{error}");

            let mut foreign = public_spend(&owner, genesis_txid, amount, 1_000);
            foreign.sign(&attacker.view).unwrap();
            let foreign_block = next_block(&genesis, 2, time + 1, vec![foreign]);
            let error = storage
                .put_block_as_tip(&foreign_block)
                .unwrap_err()
                .to_string();
            assert!(error.contains("does not own"), "{error}");
        }
        let _ = std::fs::remove_dir_all(path);
    }

    #[test]
    fn rejects_double_spend_and_post_genesis_synthetic_issuance() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(11);
            let time = now();
            let (genesis, genesis_txid) = genesis(&owner, time);
            storage.put_block_as_tip(&genesis).unwrap();
            let amount = protocol_params::GENESIS_ACP_PUBLIC * UNITS_PER_ACP;

            let first = public_spend(&owner, genesis_txid, amount, 1_000);
            let block2 = next_block(&genesis, 2, time + 1, vec![first]);
            storage.put_block_as_tip(&block2).unwrap();

            let second = public_spend(&owner, genesis_txid, amount, 2_000);
            let block3 = next_block(&block2, 3, time + 2, vec![second]);
            let error = storage.put_block_as_tip(&block3).unwrap_err().to_string();
            assert!(error.contains("already spent"), "{error}");

            let recipient = owner.receive_address_v0_obj().unwrap();
            let mut synthetic = Transaction::new_unsigned(
                CHAIN_ID,
                vec![TxInput {
                    prev_txid: [0; 32],
                    vout: 1,
                    amount: 10_000,
                }],
                vec![TxOutput::to_address_v0(9_900, &recipient)],
            );
            synthetic.sign(&owner.view).unwrap();
            let synthetic_block = next_block(&block2, 3, time + 2, vec![synthetic]);
            let error = storage
                .put_block_as_tip(&synthetic_block)
                .unwrap_err()
                .to_string();
            assert!(error.contains("does not exist"), "{error}");
        }
        let _ = std::fs::remove_dir_all(path);
    }

    #[test]
    fn rejects_noncanonical_genesis_distribution() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(12);
            let (mut block, _) = genesis(&owner, now());
            block.txs[0].outputs[0].amount -= 1;
            block.txs[0].outputs[2].amount += 1;
            block.txs[0].sign(&owner.view).unwrap();
            block = Block::build(block.header, block.txs).unwrap();
            let error = storage.put_block_as_tip(&block).unwrap_err().to_string();
            assert!(error.contains("allocation amount/order"), "{error}");
        }
        let _ = std::fs::remove_dir_all(path);
    }

    #[test]
    fn rejects_zero_timestamp_genesis() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(14);
            let (mut block, _) = genesis(&owner, 0);
            block = Block::build(block.header, block.txs).unwrap();
            let error = storage.put_block_as_tip(&block).unwrap_err().to_string();
            assert!(error.contains("timestamp must not be zero"), "{error}");
        }
        let _ = std::fs::remove_dir_all(path);
    }

    #[test]
    fn persists_chain_identity_and_rejects_restart_chain_id_change() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(15);
            let (block, _) = genesis(&owner, now());
            storage.put_block_as_tip(&block).unwrap();
            storage.ensure_chain_identity(CHAIN_ID).unwrap();
            let error = storage
                .ensure_chain_identity(1001)
                .unwrap_err()
                .to_string();
            assert!(error.contains("does not match configured"), "{error}");
        }
        let _ = std::fs::remove_dir_all(path);
    }

    #[test]
    fn rejects_redirected_mainnet_genesis() {
        let path = temp_db_path();
        {
            let storage = Storage::new(Rocks::open(path.to_str().unwrap()).unwrap());
            let owner = identity(13);
            let (mut block, _) = genesis(&owner, now());
            block.header.chain_id = protocol_params::DEFAULT_CHAIN_ID;
            block.txs[0].chain_id = protocol_params::DEFAULT_CHAIN_ID;
            block.txs[0].sign(&owner.view).unwrap();
            block = Block::build(block.header, block.txs).unwrap();
            let error = storage.put_block_as_tip(&block).unwrap_err().to_string();
            assert!(error.contains("mainnet genesis recipient"), "{error}");
        }
        let _ = std::fs::remove_dir_all(path);
    }
}
