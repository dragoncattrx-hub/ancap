//! Chain: submit_block (chain_id check, tip rules, atomic store).

use anyhow::Result;
use acp_crypto::{Block, BlockHash};

use crate::storage::rocks::Rocks;
use crate::storage::Storage;

pub mod baninfo;
pub mod banlog;
pub mod banlog_hash;
pub mod reason_hash;

pub struct Chain {
    pub chain_id: u32,
    pub storage: Storage<Rocks>,
}

impl Chain {
    pub fn new(chain_id: u32, storage: Storage<Rocks>) -> Self {
        Self {
            chain_id,
            storage,
        }
    }

    pub fn submit_block(&self, block: &Block) -> Result<BlockHash> {
        if block.header.chain_id != self.chain_id {
            anyhow::bail!("block chain_id mismatch");
        }

        let bh = block.header.blockhash();
        if self.storage.has_block(&bh)? {
            anyhow::bail!("block already known");
        }

        let bh = self.storage.put_block_as_tip(block)?;
        Ok(bh)
    }
}
