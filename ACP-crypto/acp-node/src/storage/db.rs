//! KV database trait for chain storage.

use anyhow::Result;

#[allow(dead_code)]
pub trait KvDb: Send + Sync {
    fn get_cf(&self, cf: &str, key: &[u8]) -> Result<Option<Vec<u8>>>;
    fn put_cf(&self, cf: &str, key: &[u8], val: &[u8]) -> Result<()>;

    /// Iterate over CF in ascending order. Callback returns false to stop early.
    fn for_each_cf(
        &self,
        _cf: &str,
        _f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        Ok(())
    }

    /// Iterate over CF in descending order (reverse). Callback returns false to stop early.
    fn for_each_cf_rev(
        &self,
        _cf: &str,
        _f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        Ok(())
    }

    /// Iterate over keys starting from `from_key` forward (seek). Stops when callback returns false.
    fn for_each_cf_from(
        &self,
        _cf: &str,
        _from_key: &[u8],
        _f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        Ok(())
    }

    /// Iterate over CF in descending order starting from `from_key` (inclusive). If from_key is empty, starts from end. Callback returns false to stop early.
    fn for_each_cf_rev_from(
        &self,
        _cf: &str,
        _from_key: &[u8],
        _f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        Ok(())
    }

    /// Iterate over CF in descending order starting strictly less than `upper_exclusive`. If upper_exclusive is empty, start from end. Callback returns false to stop early.
    fn for_each_cf_rev_lt(
        &self,
        _cf: &str,
        _upper_exclusive: &[u8],
        _f: &mut dyn FnMut(&[u8], &[u8]) -> Result<bool>,
    ) -> Result<()> {
        Ok(())
    }
}
