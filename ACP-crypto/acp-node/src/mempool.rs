//! Mempool: txid -> tx_wire, limits, min_fee, max_tx_bytes, duplicate reject.

use std::collections::HashMap;
use std::sync::Mutex;

use anyhow::Result;
use acp_crypto::{MIN_FEE_UNITS, Transaction};

#[derive(Clone, Debug)]
pub struct MempoolLimits {
    pub max_txs: usize,
    pub max_bytes: usize,
    pub max_tx_bytes: usize,
    pub min_fee: u64,
}

impl Default for MempoolLimits {
    fn default() -> Self {
        Self {
            max_txs: 50_000,
            max_bytes: 64 * 1024 * 1024, // 64MB mempool total
            max_tx_bytes: 128 * 1024,    // 128KB per tx (skeleton)
            min_fee: MIN_FEE_UNITS,     // 0.00000100 ACP (protocol_params)
        }
    }
}

pub struct Mempool {
    map: Mutex<HashMap<[u8; 32], Vec<u8>>>,
    bytes: Mutex<usize>,
    limits: MempoolLimits,
}

impl Mempool {
    pub fn new(limits: MempoolLimits) -> Self {
        Self {
            map: Mutex::new(HashMap::new()),
            bytes: Mutex::new(0),
            limits,
        }
    }

    pub fn limits(&self) -> MempoolLimits {
        self.limits.clone()
    }

    pub fn len(&self) -> usize {
        self.map.lock().unwrap().len()
    }

    pub fn size_bytes(&self) -> usize {
        *self.bytes.lock().unwrap()
    }

    pub fn has(&self, txid: &[u8; 32]) -> bool {
        self.map.lock().unwrap().contains_key(txid)
    }

    pub fn txids(&self) -> Vec<[u8; 32]> {
        self.map.lock().unwrap().keys().cloned().collect()
    }

    pub fn put(&self, tx: &Transaction) -> Result<[u8; 32]> {
        tx.verify().map_err(anyhow::Error::msg)?;

        let fee = tx.fee().map_err(anyhow::Error::msg)?;
        if fee < self.limits.min_fee {
            anyhow::bail!(
                "mempool: fee too low (min_fee={})",
                self.limits.min_fee
            );
        }

        let id = tx.txid().map_err(anyhow::Error::msg)?;
        let wire = tx.to_wire().map_err(anyhow::Error::msg)?;

        if wire.len() > self.limits.max_tx_bytes {
            anyhow::bail!(
                "mempool: tx too large (max_tx_bytes={})",
                self.limits.max_tx_bytes
            );
        }

        {
            let m = self.map.lock().unwrap();
            if m.contains_key(&id) {
                anyhow::bail!("mempool: duplicate tx");
            }
        }

        let mut m = self.map.lock().unwrap();
        let mut used = self.bytes.lock().unwrap();

        if m.len() >= self.limits.max_txs {
            anyhow::bail!("mempool: full (max_txs)");
        }
        if *used + wire.len() > self.limits.max_bytes {
            anyhow::bail!("mempool: full (max_bytes)");
        }

        *used += wire.len();
        m.insert(id, wire);
        Ok(id)
    }

    pub fn get(&self, txid: &[u8; 32]) -> Option<Vec<u8>> {
        self.map.lock().unwrap().get(txid).cloned()
    }

    /// Remove a tx by txid (e.g. after it was included in a block). Returns the wire if present.
    pub fn remove(&self, txid: &[u8; 32]) -> Option<Vec<u8>> {
        let mut m = self.map.lock().unwrap();
        let mut used = self.bytes.lock().unwrap();
        if let Some(wire) = m.remove(txid) {
            *used = used.saturating_sub(wire.len());
            Some(wire)
        } else {
            None
        }
    }
}
