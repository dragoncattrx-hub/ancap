//! Chain: submit_block (chain_id check, tip rules, atomic store).

use anyhow::Result;
use acp_crypto::{Block, BlockHash, Transaction};
use std::sync::Mutex;

use crate::mempool::Mempool;
use crate::storage::rocks::Rocks;
use crate::storage::Storage;

pub mod baninfo;
pub mod banlog;
pub mod banlog_hash;
pub mod reason_hash;

pub struct Chain {
    pub chain_id: u32,
    pub storage: Storage<Rocks>,
    submit_lock: Mutex<()>,
}

impl Chain {
    pub fn new(chain_id: u32, storage: Storage<Rocks>) -> Result<Self> {
        storage.ensure_chain_identity(chain_id)?;
        Ok(Self {
            chain_id,
            storage,
            submit_lock: Mutex::new(()),
        })
    }

    fn lock_tip(&self) -> Result<std::sync::MutexGuard<'_, ()>> {
        self.submit_lock
            .lock()
            .map_err(|_| anyhow::anyhow!("block submission lock poisoned"))
    }

    fn submit_block_locked(&self, block: &Block) -> Result<BlockHash> {
        if block.header.chain_id != self.chain_id {
            anyhow::bail!("block chain_id mismatch");
        }
        self.storage.ensure_chain_identity(self.chain_id)?;

        let bh = block.header.blockhash();
        if self.storage.has_block(&bh)? {
            anyhow::bail!("block already known");
        }

        self.storage.put_block_as_tip(block)
    }

    pub fn submit_block(&self, block: &Block) -> Result<BlockHash> {
        let _guard = self.lock_tip()?;
        self.submit_block_locked(block)
    }

    pub fn submit_block_and_evict(&self, mempool: &Mempool, block: &Block) -> Result<BlockHash> {
        let _guard = self.lock_tip()?;
        let bh = self.submit_block_locked(block)?;
        mempool.evict_block(block);
        Ok(bh)
    }

    pub fn accept_mempool_tx(&self, mempool: &Mempool, tx: &Transaction) -> Result<[u8; 32]> {
        let _guard = self.lock_tip()?;
        if tx.chain_id != self.chain_id {
            anyhow::bail!("tx chain_id mismatch");
        }
        if mempool.has_input_conflict(tx) {
            anyhow::bail!("mempool: input already spent by another pending transaction");
        }
        self.storage.validate_mempool_transaction(tx)?;
        mempool.put(tx)
    }
}
