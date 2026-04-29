//! Chain storage over KV: blocks, headers, tx index, best tip.

use anyhow::Result;
use acp_crypto::{Block, BlockHeader, BlockHash, TxId};

use crate::storage::db::KvDb;
use crate::storage::rocks::Rocks;
use crate::storage::schema::*;

pub mod db;
pub mod rocks;
pub mod schema;

pub struct Storage<D: KvDb> {
    pub db: D,
}

impl<D: KvDb> Storage<D> {
    pub fn new(db: D) -> Self {
        Self { db }
    }

    pub fn best_height(&self) -> Result<u64> {
        if let Some(b) = self.db.get_cf(CF_META, KEY_BEST_HEIGHT)? {
            let mut a = [0u8; 8];
            a.copy_from_slice(&b);
            Ok(u64::from_le_bytes(a))
        } else {
            Ok(0)
        }
    }

    pub fn best_hash(&self) -> Result<Option<BlockHash>> {
        Ok(self.db.get_cf(CF_META, KEY_BEST_HASH)?.map(|b| {
            let mut a = [0u8; 32];
            a.copy_from_slice(&b);
            a
        }))
    }

    pub fn get_blockhash_by_height(&self, height: u64) -> Result<Option<BlockHash>> {
        let key = height.to_le_bytes();
        Ok(self.db.get_cf(CF_HEIGHT_TO_HASH, &key)?.map(|b| {
            let mut a = [0u8; 32];
            a.copy_from_slice(&b);
            a
        }))
    }

    pub fn get_block_wire(&self, bh: &BlockHash) -> Result<Option<Vec<u8>>> {
        self.db.get_cf(CF_BLOCKS, bh)
    }

    pub fn get_tx_wire(&self, txid: &TxId) -> Result<Option<Vec<u8>>> {
        self.db.get_cf(CF_TXS, txid)
    }

    #[allow(dead_code)]
    pub fn get_header_bytes(&self, bh: &BlockHash) -> Result<Option<Vec<u8>>> {
        self.db.get_cf(CF_HEADERS, bh)
    }

    /// Header wire bytes by header/block hash (CF_HEADERS). Use for getblockheader without block parse.
    pub fn get_header_wire(&self, hh: &[u8; 32]) -> Result<Option<Vec<u8>>> {
        self.db.get_cf(CF_HEADERS, hh)
    }

    /// Children of a header (CF_HEADER_CHILDREN): list of hashes that have this as prev.
    pub fn get_children(&self, hh: &[u8; 32]) -> Result<Vec<[u8; 32]>> {
        let Some(b) = self.db.get_cf(CF_HEADER_CHILDREN, hh)? else {
            return Ok(vec![]);
        };
        if b.len() % 32 != 0 {
            anyhow::bail!("hchild: bad length");
        }
        let mut out = Vec::with_capacity(b.len() / 32);
        for chunk in b.chunks_exact(32) {
            let mut h = [0u8; 32];
            h.copy_from_slice(chunk);
            out.push(h);
        }
        Ok(out)
    }

    /// Header status by hash (CF_HEADER_STATUS). 1=valid-headers, 2=active, 3=invalid.
    pub fn get_header_status(&self, hh: &[u8; 32]) -> Result<Option<u8>> {
        Ok(self.db.get_cf(CF_HEADER_STATUS, hh)?.and_then(|b| b.first().copied()))
    }

    /// Header height by hash (CF_HEADER_HEIGHT).
    pub fn get_header_height(&self, hh: &[u8; 32]) -> Result<Option<u64>> {
        if let Some(b) = self.db.get_cf(CF_HEADER_HEIGHT, hh)? {
            if b.len() != 8 {
                anyhow::bail!("hheight: bad length");
            }
            let mut a = [0u8; 8];
            a.copy_from_slice(&b);
            Ok(Some(u64::from_le_bytes(a)))
        } else {
            Ok(None)
        }
    }

    /// Cumulative fork-choice score (CF_HEADER_SCORE). u128 LE, 16 bytes.
    pub fn get_header_score(&self, hh: &[u8; 32]) -> Result<Option<u128>> {
        if let Some(b) = self.db.get_cf(CF_HEADER_SCORE, hh)? {
            if b.len() != 16 {
                anyhow::bail!("hscore: bad length");
            }
            let mut a = [0u8; 16];
            a.copy_from_slice(&b);
            Ok(Some(u128::from_le_bytes(a)))
        } else {
            Ok(None)
        }
    }

    /// True if header is in orphan pool (CF_ORPHAN_PREV).
    pub fn is_orphan(&self, hh: &[u8; 32]) -> Result<bool> {
        Ok(self.db.get_cf(CF_ORPHAN_PREV, hh)?.is_some())
    }

    /// Orphan header hashes waiting for this prev (CF_ORPHANS_BY_PREV).
    pub fn get_orphans_waiting(&self, prev: &[u8; 32]) -> Result<Vec<[u8; 32]>> {
        let Some(b) = self.db.get_cf(CF_ORPHANS_BY_PREV, prev)? else {
            return Ok(vec![]);
        };
        if b.len() % 32 != 0 {
            anyhow::bail!("orphby: bad length");
        }
        let mut out = Vec::with_capacity(b.len() / 32);
        for c in b.chunks_exact(32) {
            let mut h = [0u8; 32];
            h.copy_from_slice(c);
            out.push(h);
        }
        Ok(out)
    }

    /// Best header tip pointer (CF_BEST_HEADER_TIP). O(1).
    pub fn get_best_header_tip(&self) -> Result<Option<[u8; 32]>> {
        if let Some(b) = self.db.get_cf(CF_BEST_HEADER_TIP, KEY_BEST_HEADER_TIP)? {
            if b.len() != 32 {
                anyhow::bail!("bestht: bad length");
            }
            let mut h = [0u8; 32];
            h.copy_from_slice(&b);
            Ok(Some(h))
        } else {
            Ok(None)
        }
    }

    /// Distance from start to nearest invalid ancestor (walking prev). None if none within scan limit.
    pub fn nearest_invalid_ancestor_distance(&self, start: &[u8; 32]) -> Result<Option<u64>> {
        let mut cur = *start;
        let mut dist: u64 = 0;

        while dist < crate::config::REVALIDATE_ANCESTOR_SCAN_LIMIT {
            if let Some(st) = self.get_header_status(&cur)? {
                if st == 3 {
                    return Ok(Some(dist));
                }
            }

            let prev = self.db.get_cf(CF_HEADER_PREV, &cur)?;
            let Some(p) = prev else {
                break;
            };
            if p.len() != 32 {
                break;
            }

            let mut ph = [0u8; 32];
            ph.copy_from_slice(&p);
            cur = ph;
            dist += 1;
        }

        Ok(None)
    }

    /// Find common ancestor of two headers (diverge point). Walks prev with height alignment.
    pub fn find_common_ancestor(
        &self,
        mut a: [u8; 32],
        mut b: [u8; 32],
    ) -> Result<Option<[u8; 32]>> {
        let mut ha = self.get_header_height(&a)?.unwrap_or(0);
        let mut hb = self.get_header_height(&b)?.unwrap_or(0);
        let mut steps: u64 = 0;

        while ha > hb && steps < crate::config::CHAIN_DIFF_SCAN_LIMIT {
            let prev = self.db.get_cf(CF_HEADER_PREV, &a)?;
            let Some(p) = prev else {
                return Ok(None);
            };
            if p.len() != 32 {
                return Ok(None);
            }
            let mut ph = [0u8; 32];
            ph.copy_from_slice(&p);
            a = ph;
            ha = ha.saturating_sub(1);
            steps += 1;
        }
        while hb > ha && steps < crate::config::CHAIN_DIFF_SCAN_LIMIT {
            let prev = self.db.get_cf(CF_HEADER_PREV, &b)?;
            let Some(p) = prev else {
                return Ok(None);
            };
            if p.len() != 32 {
                return Ok(None);
            }
            let mut ph = [0u8; 32];
            ph.copy_from_slice(&p);
            b = ph;
            hb = hb.saturating_sub(1);
            steps += 1;
        }

        while steps < crate::config::CHAIN_DIFF_SCAN_LIMIT {
            if a == b {
                return Ok(Some(a));
            }
            let pa = self.db.get_cf(CF_HEADER_PREV, &a)?;
            let pb = self.db.get_cf(CF_HEADER_PREV, &b)?;
            if pa.is_none() || pb.is_none() {
                return Ok(None);
            }
            let pa = pa.unwrap();
            let pb = pb.unwrap();
            if pa.len() != 32 || pb.len() != 32 {
                return Ok(None);
            }
            let mut pha = [0u8; 32];
            pha.copy_from_slice(&pa);
            let mut phb = [0u8; 32];
            phb.copy_from_slice(&pb);
            a = pha;
            b = phb;
            steps += 1;
        }

        Ok(None)
    }

    /// True if header is in CF_TIPS (is a tip).
    pub fn is_tip(&self, hh: &[u8; 32]) -> Result<bool> {
        Ok(self.db.get_cf(CF_TIPS, hh)?.is_some())
    }

    /// All tips from CF_TIPS. Value = [height(u64 LE)][status(u8)]. status: 1=valid-headers, 2=active, 3=invalid.
    pub fn list_tips(&self) -> Result<Vec<([u8; 32], u64, u8)>> {
        let mut out = Vec::new();
        let mut f = |k: &[u8], v: &[u8]| -> Result<bool> {
            if k.len() != 32 || v.len() != 9 {
                return Ok(true);
            }
            let mut hh = [0u8; 32];
            hh.copy_from_slice(k);
            let height = u64::from_le_bytes(v[0..8].try_into().unwrap());
            let status = v[8];
            out.push((hh, height, status));
            Ok(true)
        };
        self.db.for_each_cf(CF_TIPS, &mut f)?;
        Ok(out)
    }

    pub fn has_block(&self, bh: &BlockHash) -> Result<bool> {
        Ok(self.db.get_cf(CF_HEADERS, bh)?.is_some())
    }

    /// Tx metadata: (height, blockhash) if tx is in a block.
    pub fn get_tx_meta(&self, txid: &[u8; 32]) -> Result<Option<(u64, [u8; 32])>> {
        if let Some(b) = self.db.get_cf(CF_TX_META, txid)? {
            if b.len() != 8 + 32 {
                anyhow::bail!("txmeta: bad length");
            }
            let height = u64::from_le_bytes(b[..8].try_into().unwrap());
            let mut bh = [0u8; 32];
            bh.copy_from_slice(&b[8..40]);
            Ok(Some((height, bh)))
        } else {
            Ok(None)
        }
    }

    /// Block timestamp by blockhash (from block wire).
    #[allow(dead_code)]
    pub fn get_block_time(&self, bh: &[u8; 32]) -> Result<Option<u64>> {
        let bw = self.get_block_wire(bh)?;
        let Some(w) = bw else { return Ok(None) };

        let block = acp_crypto::Block::from_wire(&w)?;
        Ok(Some(block.header.time))
    }

    /// Block meta (height, time) by blockhash — from cached CF, no block parse.
    pub fn get_block_meta(&self, bh: &[u8; 32]) -> Result<Option<(u64, u64)>> {
        if let Some(b) = self.db.get_cf(CF_BLOCK_META, bh)? {
            if b.len() != 16 {
                anyhow::bail!("blockmeta: bad length");
            }
            let mut h8 = [0u8; 8];
            h8.copy_from_slice(&b[..8]);
            let height = u64::from_le_bytes(h8);

            let mut t8 = [0u8; 8];
            t8.copy_from_slice(&b[8..16]);
            let time = u64::from_le_bytes(t8);

            Ok(Some((height, time)))
        } else {
            Ok(None)
        }
    }

    /// Block time by blockhash from CF_BLOCK_META cache (no block parse).
    #[allow(dead_code)]
    pub fn get_block_time_cached(&self, bh: &[u8; 32]) -> Result<Option<u64>> {
        Ok(self.get_block_meta(bh)?.map(|(_h, t)| t))
    }

    /// Bitcoin-like mediantime: median of last 11 block times (including this block height).
    /// If we don't have enough history, compute over what we have (>=1).
    pub fn get_median_time_past(&self, height: u64) -> Result<Option<u64>> {
        if height == 0 {
            return Ok(None);
        }

        let mut times: Vec<u64> = Vec::with_capacity(11);
        let start = height.saturating_sub(10);

        for h in start..=height {
            if let Some(bh) = self.get_blockhash_by_height(h)? {
                if let Some((_hh, t)) = self.get_block_meta(&bh)? {
                    times.push(t);
                }
            }
        }

        if times.is_empty() {
            return Ok(None);
        }

        times.sort_unstable();
        Ok(Some(times[times.len() / 2]))
    }
}

/// Storage implementation that uses RocksDB batch writes.
impl Storage<Rocks> {
    /// Atomic store for a new tip block with strict tip rules.
    pub fn put_block_as_tip(&self, block: &Block) -> Result<BlockHash> {
        block.validate().map_err(anyhow::Error::msg)?;
        crate::vesting::validate_block_creator_vesting(self, block)?;
        crate::emission::validate_block_emission(self, block)?;

        let best_h = self.best_height()?;
        let best_hash = self.best_hash()?;

        if best_h == 0 && best_hash.is_none() {
            if block.header.height != 1 {
                anyhow::bail!("tip rule: genesis height must be 1");
            }
            if block.header.prev_blockhash != [0u8; 32] {
                anyhow::bail!("tip rule: genesis prev must be 0");
            }
        } else {
            let expected_h = best_h + 1;
            if block.header.height != expected_h {
                anyhow::bail!(
                    "tip rule: expected height {}, got {}",
                    expected_h,
                    block.header.height
                );
            }
            let prev = best_hash
                .ok_or_else(|| anyhow::anyhow!("tip rule: missing best hash"))?;
            if block.header.prev_blockhash != prev {
                anyhow::bail!("tip rule: prev hash mismatch");
            }
        }

        let bh = block.header.blockhash();

        if self.has_block(&bh)? {
            anyhow::bail!("block already known");
        }

        let wire = block.to_wire().map_err(anyhow::Error::msg)?;

        let mut batch = rocksdb::WriteBatch::default();
        let dbref = self.db.db();

        Rocks::batch_put_cf(&mut batch, dbref, CF_BLOCKS, &bh, &wire)?;

        let header_bytes = block.header.header_bytes();
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADERS, &bh, &header_bytes)?;

        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_HEIGHT, &bh, &block.header.height.to_le_bytes())?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_STATUS, &bh, &[2u8])?; // active

        let local_work = crate::score::header_work(block.header.bits);
        let prev_score = self.get_header_score(&block.header.prev_blockhash)?.unwrap_or(0);
        let score = prev_score + local_work;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_SCORE, &bh, &score.to_le_bytes())?;

        Rocks::batch_put_cf(
            &mut batch,
            dbref,
            CF_HEIGHT_TO_HASH,
            &block.header.height.to_le_bytes(),
            &bh,
        )?;

        let mut bm = Vec::with_capacity(16);
        bm.extend_from_slice(&block.header.height.to_le_bytes());
        bm.extend_from_slice(&block.header.time.to_le_bytes());
        Rocks::batch_put_cf(&mut batch, dbref, CF_BLOCK_META, &bh, &bm)?;

        // Header-tree: prev link, children of prev, tips
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_PREV, &bh, &block.header.prev_blockhash)?;

        let mut children = self.db.get_cf(CF_HEADER_CHILDREN, &block.header.prev_blockhash)?
            .unwrap_or_default();
        children.extend_from_slice(&bh);
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_CHILDREN, &block.header.prev_blockhash, &children)?;

        let mut tip_val = Vec::with_capacity(9);
        tip_val.extend_from_slice(&block.header.height.to_le_bytes());
        tip_val.push(2u8); // active (block present)
        Rocks::batch_put_cf(&mut batch, dbref, CF_TIPS, &bh, &tip_val)?;

        Rocks::batch_del_cf(&mut batch, dbref, CF_TIPS, &block.header.prev_blockhash)?;

        for tx in &block.txs {
            let txid = tx.txid().map_err(anyhow::Error::msg)?;
            let txwire = tx.to_wire().map_err(anyhow::Error::msg)?;
            Rocks::batch_put_cf(&mut batch, dbref, CF_TXS, &txid, &txwire)?;

            let mut meta = Vec::with_capacity(8 + 32);
            meta.extend_from_slice(&block.header.height.to_le_bytes());
            meta.extend_from_slice(&bh);
            Rocks::batch_put_cf(&mut batch, dbref, CF_TX_META, &txid, &meta)?;
        }

        Rocks::batch_put_cf(
            &mut batch,
            dbref,
            CF_META,
            KEY_BEST_HEIGHT,
            &block.header.height.to_le_bytes(),
        )?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_META, KEY_BEST_HASH, &bh)?;

        self.db.write_batch(batch)?;
        Ok(bh)
    }

    /// Store header only (headers-first). CF_HEADERS + prev/children/tips + height + status=valid-headers.
    #[allow(dead_code)]
    pub fn store_header(
        &self,
        hh: &[u8; 32],
        header: &BlockHeader,
        header_wire: &[u8],
    ) -> Result<()> {
        use crate::storage::schema::{
            CF_HEADERS, CF_HEADER_PREV, CF_HEADER_CHILDREN, CF_TIPS,
            CF_HEADER_STATUS, CF_HEADER_HEIGHT,
        };
        let dbref = self.db.db();
        let mut batch = rocksdb::WriteBatch::default();

        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADERS, hh, header_wire)?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_HEIGHT, hh, &header.height.to_le_bytes())?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_STATUS, hh, &[1u8])?; // valid-headers

        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_PREV, hh, &header.prev_blockhash)?;

        let mut children = self.db.get_cf(CF_HEADER_CHILDREN, &header.prev_blockhash)?
            .unwrap_or_default();
        children.extend_from_slice(hh);
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_CHILDREN, &header.prev_blockhash, &children)?;

        let mut tip_val = Vec::with_capacity(9);
        tip_val.extend_from_slice(&header.height.to_le_bytes());
        tip_val.push(1u8); // valid-headers
        Rocks::batch_put_cf(&mut batch, dbref, CF_TIPS, hh, &tip_val)?;
        Rocks::batch_del_cf(&mut batch, dbref, CF_TIPS, &header.prev_blockhash)?;

        self.db.write_batch(batch)?;
        Ok(())
    }

    /// Store header v0.44: header + score + orphan pool or child link; then adopt orphans waiting for this hash.
    pub fn store_header_v44(
        &self,
        hh: &[u8; 32],
        header: &BlockHeader,
        header_wire: &[u8],
    ) -> Result<usize> {
        use crate::storage::schema::{
            CF_HEADERS, CF_HEADER_PREV, CF_HEADER_CHILDREN, CF_TIPS,
            CF_HEADER_STATUS, CF_HEADER_HEIGHT, CF_HEADER_SCORE,
            CF_ORPHAN_PREV, CF_ORPHANS_BY_PREV,
        };

        let local = crate::score::header_work(header.bits);
        let prev_known = (header.prev_blockhash == [0u8; 32] && header.height == 1)
            || self.get_header_wire(&header.prev_blockhash)?.is_some();
        let prev_score = self.get_header_score(&header.prev_blockhash)?.unwrap_or(0);
        let score = if prev_known {
            prev_score + local
        } else {
            local
        };

        let dbref = self.db.db();
        let mut batch = rocksdb::WriteBatch::default();

        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADERS, hh, header_wire)?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_HEIGHT, hh, &header.height.to_le_bytes())?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_STATUS, hh, &[1u8])?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_PREV, hh, &header.prev_blockhash)?;
        Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_SCORE, hh, &score.to_le_bytes())?;

        if prev_known {
            let mut children = self.db.get_cf(CF_HEADER_CHILDREN, &header.prev_blockhash)?
                .unwrap_or_default();
            children.extend_from_slice(hh);
            Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_CHILDREN, &header.prev_blockhash, &children)?;

            let mut tip_val = Vec::with_capacity(9);
            tip_val.extend_from_slice(&header.height.to_le_bytes());
            tip_val.push(1u8);
            Rocks::batch_put_cf(&mut batch, dbref, CF_TIPS, hh, &tip_val)?;
            Rocks::batch_del_cf(&mut batch, dbref, CF_TIPS, &header.prev_blockhash)?;
            self.maybe_update_best_tip_in_batch(&mut batch, hh)?;
        } else {
            Rocks::batch_put_cf(&mut batch, dbref, CF_ORPHAN_PREV, hh, &header.prev_blockhash)?;

            let mut wait = self.db.get_cf(CF_ORPHANS_BY_PREV, &header.prev_blockhash)?
                .unwrap_or_default();
            wait.extend_from_slice(hh);
            Rocks::batch_put_cf(&mut batch, dbref, CF_ORPHANS_BY_PREV, &header.prev_blockhash, &wait)?;

            let mut tip_val = Vec::with_capacity(9);
            tip_val.extend_from_slice(&header.height.to_le_bytes());
            tip_val.push(1u8);
            Rocks::batch_put_cf(&mut batch, dbref, CF_TIPS, hh, &tip_val)?;
            self.maybe_update_best_tip_in_batch(&mut batch, hh)?;
        }

        self.db.write_batch(batch)?;

        let adopted = self.adopt_orphans_v44(hh)?;
        Ok(adopted)
    }

    /// Remove header from orphan pool (so invalidated branch won't re-appear).
    fn orphan_remove_in_batch(
        &self,
        batch: &mut rocksdb::WriteBatch,
        hh: &[u8; 32],
    ) -> Result<()> {
        use crate::storage::schema::{CF_ORPHAN_PREV, CF_ORPHANS_BY_PREV};

        let prev_opt = self.db.get_cf(CF_ORPHAN_PREV, hh)?;
        if let Some(prev) = prev_opt {
            if prev.len() != 32 {
                return Ok(());
            }
            let dbref = self.db.db();
            Rocks::batch_del_cf(batch, dbref, CF_ORPHAN_PREV, hh)?;

            let list = self.db.get_cf(CF_ORPHANS_BY_PREV, &prev)?.unwrap_or_default();
            if list.len() % 32 != 0 {
                return Ok(());
            }

            let mut out = Vec::with_capacity(list.len());
            for c in list.chunks_exact(32) {
                if c != hh.as_slice() {
                    out.extend_from_slice(c);
                }
            }
            if out.is_empty() {
                Rocks::batch_del_cf(batch, dbref, CF_ORPHANS_BY_PREV, &prev)?;
            } else {
                Rocks::batch_put_cf(batch, dbref, CF_ORPHANS_BY_PREV, &prev, &out)?;
            }
        }
        Ok(())
    }

    /// If parent has no valid children, restore it as a tip.
    fn maybe_restore_parent_tip_in_batch(
        &self,
        batch: &mut rocksdb::WriteBatch,
        parent: &[u8; 32],
    ) -> Result<()> {
        if let Some(st) = self.get_header_status(parent)? {
            if st == 3 {
                return Ok(());
            }
        }

        let children = self.get_children(parent)?;
        for ch in &children {
            let st = self.get_header_status(ch)?.unwrap_or(1);
            if st != 3 {
                return Ok(());
            }
        }

        let height = self.get_header_height(parent)?.unwrap_or(0);
        let status = self.get_header_status(parent)?.unwrap_or(1);
        let mut tip_val = Vec::with_capacity(9);
        tip_val.extend_from_slice(&height.to_le_bytes());
        tip_val.push(status);

        let dbref = self.db.db();
        Rocks::batch_put_cf(batch, dbref, CF_TIPS, parent, &tip_val)?;
        Ok(())
    }

    fn maybe_update_best_tip_in_batch(
        &self,
        batch: &mut rocksdb::WriteBatch,
        tip: &[u8; 32],
    ) -> Result<()> {
        if let Some(st) = self.get_header_status(tip)? {
            if st == 3 {
                return Ok(());
            }
        }

        let tip_score = self.get_header_score(tip)?.unwrap_or(0);
        let tip_height = self.get_header_height(tip)?.unwrap_or(0);

        let cur = self.get_best_header_tip()?;
        if let Some(curh) = cur {
            let cur_score = self.get_header_score(&curh)?.unwrap_or(0);
            let cur_height = self.get_header_height(&curh)?.unwrap_or(0);

            let better = tip_score > cur_score
                || (tip_score == cur_score && tip_height > cur_height)
                || (tip_score == cur_score && tip_height == cur_height && *tip > curh);

            if !better {
                return Ok(());
            }
        }

        let dbref = self.db.db();
        Rocks::batch_put_cf(batch, dbref, CF_BEST_HEADER_TIP, KEY_BEST_HEADER_TIP, tip)?;
        Ok(())
    }

    fn clear_best_tip_if_matches_in_batch(
        &self,
        batch: &mut rocksdb::WriteBatch,
        hh: &[u8; 32],
    ) -> Result<()> {
        if let Some(cur) = self.get_best_header_tip()? {
            if cur == *hh {
                let dbref = self.db.db();
                Rocks::batch_del_cf(batch, dbref, CF_BEST_HEADER_TIP, KEY_BEST_HEADER_TIP)?;
            }
        }
        Ok(())
    }

    fn adopt_orphans_v44(&self, new_prev: &[u8; 32]) -> Result<usize> {
        use crate::storage::schema::{
            CF_HEADER_CHILDREN, CF_TIPS, CF_HEADERS,
            CF_HEADER_SCORE, CF_HEADER_STATUS,
            CF_ORPHAN_PREV, CF_ORPHANS_BY_PREV,
        };
        use std::collections::VecDeque;

        let mut total_adopted = 0usize;
        let mut queue: VecDeque<[u8; 32]> = VecDeque::new();
        queue.push_back(*new_prev);

        while let Some(prev) = queue.pop_front() {
            let waiting = self.get_orphans_waiting(&prev)?;
            if waiting.is_empty() {
                continue;
            }

            let dbref = self.db.db();
            let mut batch = rocksdb::WriteBatch::default();
            Rocks::batch_del_cf(&mut batch, dbref, CF_ORPHANS_BY_PREV, &prev)?;

            let prev_score = self.get_header_score(&prev)?.unwrap_or(0);

            if self.db.get_cf(CF_HEADERS, &prev)?.is_none() {
                self.db.write_batch(batch)?;
                continue;
            }

            let mut children = self.db.get_cf(CF_HEADER_CHILDREN, &prev)?.unwrap_or_default();

            for ch in waiting {
                let Some(hw) = self.db.get_cf(CF_HEADERS, &ch)? else {
                    continue;
                };
                let h = BlockHeader::from_wire(&hw).map_err(anyhow::Error::msg)?;

                children.extend_from_slice(&ch);
                Rocks::batch_del_cf(&mut batch, dbref, CF_ORPHAN_PREV, &ch)?;

                let local = crate::score::header_work(h.bits);
                let score = prev_score + local;
                Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_SCORE, &ch, &score.to_le_bytes())?;

                let st = self.db.get_cf(CF_HEADER_STATUS, &ch)?.and_then(|b| b.first().copied()).unwrap_or(1);
                if st != 2 {
                    Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_STATUS, &ch, &[1u8])?;
                }

                let mut tip_val = Vec::with_capacity(9);
                tip_val.extend_from_slice(&h.height.to_le_bytes());
                tip_val.push(1u8);
                Rocks::batch_put_cf(&mut batch, dbref, CF_TIPS, &ch, &tip_val)?;
                Rocks::batch_del_cf(&mut batch, dbref, CF_TIPS, &prev)?;
                self.maybe_update_best_tip_in_batch(&mut batch, &ch)?;

                queue.push_back(ch);
                total_adopted += 1;
            }

            Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_CHILDREN, &prev, &children)?;
            self.db.write_batch(batch)?;
        }

        Ok(total_adopted)
    }

    /// Invalidate header and all descendants (BFS). Status=3, remove from tips, clear best tip if matched.
    #[allow(dead_code)]
    pub fn invalidate_subtree_v45(&self, root: &[u8; 32]) -> Result<usize> {
        use std::collections::{HashSet, VecDeque};

        let mut q: VecDeque<[u8; 32]> = VecDeque::new();
        let mut seen = HashSet::new();
        q.push_back(*root);
        let mut total = 0usize;

        while let Some(hh) = q.pop_front() {
            if !seen.insert(hh) {
                continue;
            }

            let dbref = self.db.db();
            let mut batch = rocksdb::WriteBatch::default();

            Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_STATUS, &hh, &[3u8])?;
            Rocks::batch_del_cf(&mut batch, dbref, CF_TIPS, &hh)?;
            self.clear_best_tip_if_matches_in_batch(&mut batch, &hh)?;

            self.db.write_batch(batch)?;
            total += 1;

            for ch in self.get_children(&hh)? {
                q.push_back(ch);
            }
        }

        Ok(total)
    }

    /// Invalidate subtree v0.46: mark invalid, remove from tips, clean orphan pool, restore parent tips, recompute best tip.
    #[allow(dead_code)]
    pub fn invalidate_subtree_v46(&self, root: &[u8; 32]) -> Result<usize> {
        self.invalidate_subtree_v47(root, 0, "manual invalidation")
    }

    fn banlog_next_seq(&self) -> Result<u32> {
        let cur = self
            .db
            .get_cf(CF_BANLOG_META, KEY_BANLOG_SEQ)?
            .and_then(|b| {
                if b.len() >= 4 {
                    Some(u32::from_le_bytes(b[..4].try_into().unwrap()))
                } else {
                    None
                }
            })
            .unwrap_or(0);
        Ok(cur)
    }

    fn banlog_set_seq_in_batch(
        &self,
        batch: &mut rocksdb::WriteBatch,
        seq: u32,
    ) -> Result<()> {
        let dbref = self.db.db();
        Rocks::batch_put_cf(batch, dbref, CF_BANLOG_META, KEY_BANLOG_SEQ, &seq.to_le_bytes())?;
        Ok(())
    }

    /// Invalidate subtree v0.47/v0.48: same as v46 + write baninfo (ts, reason) + banlog entry.
    pub fn invalidate_subtree_v47(
        &self,
        root: &[u8; 32],
        ts: u64,
        reason: &str,
    ) -> Result<usize> {
        use std::collections::{HashSet, VecDeque};

        let mut q = VecDeque::new();
        let mut seen = HashSet::new();
        q.push_back(*root);
        let mut total = 0usize;
        let mut touched_parents: Vec<[u8; 32]> = Vec::new();
        let ban = crate::chain::baninfo::pack_baninfo(ts, reason);
        let mut seq = self.banlog_next_seq()?;

        while let Some(hh) = q.pop_front() {
            if !seen.insert(hh) {
                continue;
            }

            for ch in self.get_children(&hh)? {
                q.push_back(ch);
            }

            if let Some(prev) = self.db.get_cf(CF_HEADER_PREV, &hh)? {
                if prev.len() == 32 {
                    let mut p = [0u8; 32];
                    p.copy_from_slice(&prev);
                    touched_parents.push(p);
                }
            }

            let dbref = self.db.db();
            let mut batch = rocksdb::WriteBatch::default();

            Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_STATUS, &hh, &[3u8])?;
            Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_BANINFO, &hh, &ban)?;
            let key = crate::chain::banlog::make_banlog_key(ts, seq);
            let val = crate::chain::banlog::pack_banlog_value(&hh, reason);
            Rocks::batch_put_cf(&mut batch, dbref, CF_BANLOG, &key, &val)?;
            let by_hash_key = crate::chain::banlog_hash::make_key(&hh, ts, seq);
            let by_hash_val = crate::chain::banlog_hash::pack_val(reason);
            Rocks::batch_put_cf(&mut batch, dbref, CF_BANLOG_BY_HASH, &by_hash_key, &by_hash_val)?;
            Rocks::batch_put_cf(&mut batch, dbref, CF_ACTIVE_BANS_BY_TS, &key, &hh)?;
            Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_ACTIVE_BANKEY, &hh, &key)?;
            seq = seq.wrapping_add(1);
            self.banlog_set_seq_in_batch(&mut batch, seq)?;

            Rocks::batch_del_cf(&mut batch, dbref, CF_TIPS, &hh)?;
            self.orphan_remove_in_batch(&mut batch, &hh)?;
            self.clear_best_tip_if_matches_in_batch(&mut batch, &hh)?;

            self.db.write_batch(batch)?;
            total += 1;
        }

        for p in touched_parents {
            let mut batch = rocksdb::WriteBatch::default();
            self.maybe_restore_parent_tip_in_batch(&mut batch, &p)?;
            self.db.write_batch(batch)?;
        }

        self.recompute_best_header_tip_v52()?;
        Ok(total)
    }

    /// Recompute best header tip from all tips (score > height > hash). Clears pointer if no valid tips. v0.52: streaming for_each_cf.
    pub fn recompute_best_header_tip_v52(&self) -> Result<()> {
        use crate::storage::schema::{CF_TIPS, CF_BEST_HEADER_TIP, KEY_BEST_HEADER_TIP};

        let mut best: Option<([u8; 32], u128, u64)> = None;
        let better = |a: (u128, u64, [u8; 32]), b: (u128, u64, [u8; 32])| -> bool {
            a.0 > b.0 || (a.0 == b.0 && a.1 > b.1) || (a.0 == b.0 && a.1 == b.1 && a.2 > b.2)
        };

        let mut f = |k: &[u8], _v: &[u8]| -> Result<bool> {
            if k.len() != 32 {
                return Ok(true);
            }
            let mut hh = [0u8; 32];
            hh.copy_from_slice(k);

            if self.get_header_status(&hh)?.unwrap_or(1) == 3 {
                return Ok(true);
            }

            let score = self.get_header_score(&hh)?.unwrap_or(0);
            let height = self.get_header_height(&hh)?.unwrap_or(0);

            match best {
                None => best = Some((hh, score, height)),
                Some((bh, bs, bhh)) => {
                    if better((score, height, hh), (bs, bhh, bh)) {
                        best = Some((hh, score, height));
                    }
                }
            }

            Ok(true)
        };

        self.db.for_each_cf(CF_TIPS, &mut f)?;

        let dbref = self.db.db();
        let mut batch = rocksdb::WriteBatch::default();
        if let Some((hh, _, _)) = best {
            Rocks::batch_put_cf(&mut batch, dbref, CF_BEST_HEADER_TIP, KEY_BEST_HEADER_TIP, &hh)?;
        } else {
            Rocks::batch_del_cf(&mut batch, dbref, CF_BEST_HEADER_TIP, KEY_BEST_HEADER_TIP)?;
        }
        self.db.write_batch(batch)?;
        Ok(())
    }

    /// Revalidate subtree v0.46/v0.47/v0.48: clear invalid, delete baninfo and pending_revalidate, recompute score/tips, adopt orphans, recompute best tip.
    pub fn revalidate_subtree_v46(&self, root: &[u8; 32]) -> Result<usize> {
        use crate::storage::schema::{
            CF_ACTIVE_BANS_BY_TS, CF_HEADER_ACTIVE_BANKEY, CF_HEADER_BANINFO, CF_HEADER_SCORE,
            CF_HEADER_STATUS, CF_HEADERS, CF_PENDING_REVALIDATE, CF_TIPS,
        };
        use std::collections::{HashSet, VecDeque};

        let mut q = VecDeque::new();
        let mut seen = HashSet::new();
        q.push_back(*root);
        let mut total = 0usize;

        while let Some(hh) = q.pop_front() {
            if !seen.insert(hh) {
                continue;
            }

            let Some(hw) = self.db.get_cf(CF_HEADERS, &hh)? else {
                continue;
            };
            let header = BlockHeader::from_wire(&hw).map_err(anyhow::Error::msg)?;
            let parent = header.prev_blockhash;
            let parent_status = self.get_header_status(&parent)?.unwrap_or(1);

            for ch in self.get_children(&hh)? {
                q.push_back(ch);
            }

            if parent_status == 3 {
                continue;
            }

            let parent_score = self.get_header_score(&parent)?.unwrap_or(0);
            let local = crate::score::header_work(header.bits);
            let new_score = parent_score + local;

            let dbref = self.db.db();
            let mut batch = rocksdb::WriteBatch::default();

            let cur_status = self.get_header_status(&hh)?.unwrap_or(1);
            if cur_status != 2 {
                Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_STATUS, &hh, &[1u8])?;
            }

            Rocks::batch_del_cf(&mut batch, dbref, CF_HEADER_BANINFO, &hh)?;
            Rocks::batch_del_cf(&mut batch, dbref, CF_PENDING_REVALIDATE, &hh)?;
            if let Some(bk) = self.db.get_cf(CF_HEADER_ACTIVE_BANKEY, &hh)? {
                if bk.len() == 12 {
                    Rocks::batch_del_cf(&mut batch, dbref, CF_ACTIVE_BANS_BY_TS, &bk)?;
                }
                Rocks::batch_del_cf(&mut batch, dbref, CF_HEADER_ACTIVE_BANKEY, &hh)?;
            }
            Rocks::batch_put_cf(&mut batch, dbref, CF_HEADER_SCORE, &hh, &new_score.to_le_bytes())?;
            self.orphan_remove_in_batch(&mut batch, &hh)?;

            Rocks::batch_del_cf(&mut batch, dbref, CF_TIPS, &parent)?;
            let mut tip_val = Vec::with_capacity(9);
            tip_val.extend_from_slice(&header.height.to_le_bytes());
            tip_val.push(1u8);
            Rocks::batch_put_cf(&mut batch, dbref, CF_TIPS, &hh, &tip_val)?;
            self.maybe_update_best_tip_in_batch(&mut batch, &hh)?;

            self.db.write_batch(batch)?;
            total += 1;
        }

        let _ = self.adopt_orphans_v44(root)?;
        self.recompute_best_header_tip_v52()?;
        Ok(total)
    }

    /// Set best header tip pointer (headers-only reorg view). O(1) write.
    pub fn set_best_header_tip(&self, hh: &[u8; 32]) -> Result<()> {
        let dbref = self.db.db();
        let mut batch = rocksdb::WriteBatch::default();
        Rocks::batch_put_cf(&mut batch, dbref, CF_BEST_HEADER_TIP, KEY_BEST_HEADER_TIP, hh)?;
        self.db.write_batch(batch)?;
        Ok(())
    }
}
