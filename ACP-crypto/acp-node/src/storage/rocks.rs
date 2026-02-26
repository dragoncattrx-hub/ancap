//! RocksDB implementation of KvDb + WriteBatch.

use anyhow::Result;
use rocksdb::{ColumnFamilyDescriptor, Options, DB, WriteBatch};

use super::db::KvDb;
use super::schema::*;

pub struct Rocks {
    db: DB,
}

impl Rocks {
    pub fn open(path: &str) -> Result<Self> {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        opts.create_missing_column_families(true);

        let cfs = vec![
            ColumnFamilyDescriptor::new(CF_META, Options::default()),
            ColumnFamilyDescriptor::new(CF_BLOCKS, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADERS, Options::default()),
            ColumnFamilyDescriptor::new(CF_TXS, Options::default()),
            ColumnFamilyDescriptor::new(CF_TX_META, Options::default()),
            ColumnFamilyDescriptor::new(CF_BLOCK_META, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEIGHT_TO_HASH, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADER_PREV, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADER_CHILDREN, Options::default()),
            ColumnFamilyDescriptor::new(CF_TIPS, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADER_STATUS, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADER_HEIGHT, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADER_SCORE, Options::default()),
            ColumnFamilyDescriptor::new(CF_ORPHAN_PREV, Options::default()),
            ColumnFamilyDescriptor::new(CF_ORPHANS_BY_PREV, Options::default()),
            ColumnFamilyDescriptor::new(CF_BEST_HEADER_TIP, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADER_BANINFO, Options::default()),
            ColumnFamilyDescriptor::new(CF_BANLOG, Options::default()),
            ColumnFamilyDescriptor::new(CF_BANLOG_BY_HASH, Options::default()),
            ColumnFamilyDescriptor::new(CF_BANLOG_META, Options::default()),
            ColumnFamilyDescriptor::new(CF_PENDING_REVALIDATE, Options::default()),
            ColumnFamilyDescriptor::new(CF_ACTIVE_BANS_BY_TS, Options::default()),
            ColumnFamilyDescriptor::new(CF_HEADER_ACTIVE_BANKEY, Options::default()),
        ];

        let db = DB::open_cf_descriptors(&opts, path, cfs)?;
        Ok(Self { db })
    }

    fn cf(&self, name: &str) -> Result<&rocksdb::ColumnFamily> {
        self.db
            .cf_handle(name)
            .ok_or_else(|| anyhow::anyhow!("missing CF {name}"))
    }

    pub fn write_batch(&self, batch: WriteBatch) -> Result<()> {
        self.db.write(batch)?;
        Ok(())
    }

    pub fn batch_put_cf(
        batch: &mut WriteBatch,
        db: &DB,
        cf: &str,
        key: &[u8],
        val: &[u8],
    ) -> Result<()> {
        let cfh = db
            .cf_handle(cf)
            .ok_or_else(|| anyhow::anyhow!("missing CF {cf}"))?;
        batch.put_cf(cfh, key, val);
        Ok(())
    }

    pub fn batch_del_cf(batch: &mut WriteBatch, db: &DB, cf: &str, key: &[u8]) -> Result<()> {
        let cfh = db
            .cf_handle(cf)
            .ok_or_else(|| anyhow::anyhow!("missing CF {cf}"))?;
        batch.delete_cf(cfh, key);
        Ok(())
    }

    pub fn db(&self) -> &DB {
        &self.db
    }
}

impl KvDb for Rocks {
    fn get_cf(&self, cf: &str, key: &[u8]) -> Result<Option<Vec<u8>>> {
        let cfh = self.cf(cf)?;
        Ok(self.db.get_cf(cfh, key)?)
    }

    fn put_cf(&self, cf: &str, key: &[u8], val: &[u8]) -> Result<()> {
        let cfh = self.cf(cf)?;
        self.db.put_cf(cfh, key, val)?;
        Ok(())
    }

    fn for_each_cf(
        &self,
        cf: &str,
        f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        let cfh = self.cf(cf)?;
        let mut iter = self.db.raw_iterator_cf(cfh);
        iter.seek_to_first();
        while iter.valid() {
            if let (Some(k), Some(v)) = (iter.key(), iter.value()) {
                let cont = f(k, v)?;
                if !cont {
                    break;
                }
            }
            iter.next();
        }
        Ok(())
    }

    fn for_each_cf_rev(
        &self,
        cf: &str,
        f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        let cfh = self.cf(cf)?;
        let mut iter = self.db.raw_iterator_cf(cfh);
        iter.seek_to_last();
        while iter.valid() {
            if let (Some(k), Some(v)) = (iter.key(), iter.value()) {
                let cont = f(k, v)?;
                if !cont {
                    break;
                }
            }
            iter.prev();
        }
        Ok(())
    }

    fn for_each_cf_from(
        &self,
        cf: &str,
        from_key: &[u8],
        f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        let cfh = self.cf(cf)?;
        let mut iter = self.db.raw_iterator_cf(cfh);
        iter.seek(from_key);
        while iter.valid() {
            if let (Some(k), Some(v)) = (iter.key(), iter.value()) {
                let cont = f(k, v)?;
                if !cont {
                    break;
                }
            }
            iter.next();
        }
        Ok(())
    }

    /// Iterate over CF in descending order starting from `from_key` (inclusive). If from_key is empty, starts from end.
    fn for_each_cf_rev_from(
        &self,
        cf: &str,
        from_key: &[u8],
        f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        let cfh = self.cf(cf)?;
        let mut it = self.db.raw_iterator_cf(cfh);

        if from_key.is_empty() {
            it.seek_to_last();
            while it.valid() {
                if let (Some(k), Some(v)) = (it.key(), it.value()) {
                    let cont = f(k, v)?;
                    if !cont {
                        break;
                    }
                }
                it.prev();
            }
            return Ok(());
        }

        it.seek(from_key);
        if !it.valid() {
            it.seek_to_last();
        } else if let Some(k) = it.key() {
            let kb: &[u8] = k.as_ref();
            if kb > from_key {
                it.prev();
            }
        }

        while it.valid() {
            if let (Some(k), Some(v)) = (it.key(), it.value()) {
                let cont = f(k.as_ref(), v.as_ref())?;
                if !cont {
                    break;
                }
            }
            it.prev();
        }
        Ok(())
    }

    /// Iterate over CF in descending order starting strictly less than `upper_exclusive`. If empty, start from end.
    fn for_each_cf_rev_lt(
        &self,
        cf: &str,
        upper_exclusive: &[u8],
        f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        let cfh = self.cf(cf)?;
        let mut it = self.db.raw_iterator_cf(cfh);

        if upper_exclusive.is_empty() {
            it.seek_to_last();
        } else {
            it.seek(upper_exclusive);
            if it.valid() {
                if let Some(k) = it.key() {
                    let kb: &[u8] = k.as_ref();
                    if kb >= upper_exclusive {
                        it.prev();
                    }
                }
            } else {
                it.seek_to_last();
            }
        }

        while it.valid() {
            if let (Some(k), Some(v)) = (it.key(), it.value()) {
                let cont = f(k.as_ref(), v.as_ref())?;
                if !cont {
                    break;
                }
            }
            it.prev();
        }
        Ok(())
    }
}
