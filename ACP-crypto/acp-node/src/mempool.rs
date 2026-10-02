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
    spends: Mutex<HashMap<([u8; 32], u32), [u8; 32]>>,
    limits: MempoolLimits,
}

impl Mempool {
    pub fn new(limits: MempoolLimits) -> Self {
        Self {
            map: Mutex::new(HashMap::new()),
            bytes: Mutex::new(0),
            spends: Mutex::new(HashMap::new()),
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

    pub fn has_input_conflict(&self, tx: &Transaction) -> bool {
        let spends = self.spends.lock().unwrap();
        tx.inputs
            .iter()
            .any(|input| spends.contains_key(&(input.prev_txid, input.vout)))
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

        let mut m = self.map.lock().unwrap();
        let mut used = self.bytes.lock().unwrap();
        let mut spends = self.spends.lock().unwrap();

        if m.contains_key(&id) {
            anyhow::bail!("mempool: duplicate tx");
        }
        for input in &tx.inputs {
            if spends.contains_key(&(input.prev_txid, input.vout)) {
                anyhow::bail!("mempool: input already spent by another pending transaction");
            }
        }

        if m.len() >= self.limits.max_txs {
            anyhow::bail!("mempool: full (max_txs)");
        }
        if *used + wire.len() > self.limits.max_bytes {
            anyhow::bail!("mempool: full (max_bytes)");
        }

        *used += wire.len();
        for input in &tx.inputs {
            spends.insert((input.prev_txid, input.vout), id);
        }
        m.insert(id, wire);
        Ok(id)
    }

    pub fn get(&self, txid: &[u8; 32]) -> Option<Vec<u8>> {
        self.map.lock().unwrap().get(txid).cloned()
    }

    pub fn evict_block(&self, block: &acp_crypto::Block) {
        let mut to_remove = std::collections::HashSet::new();
        {
            let spends = self.spends.lock().unwrap();
            for tx in &block.txs {
                if let Ok(txid) = tx.txid() {
                    to_remove.insert(txid);
                }
                for input in &tx.inputs {
                    if let Some(txid) = spends.get(&(input.prev_txid, input.vout)) {
                        to_remove.insert(*txid);
                    }
                }
            }
        }
        for txid in to_remove {
            let _ = self.remove(&txid);
        }
    }

    /// Remove a tx by txid (e.g. after it was included in a block). Returns the wire if present.
    pub fn remove(&self, txid: &[u8; 32]) -> Option<Vec<u8>> {
        let mut m = self.map.lock().unwrap();
        let mut used = self.bytes.lock().unwrap();
        let mut spends = self.spends.lock().unwrap();
        if let Some(wire) = m.remove(txid) {
            *used = used.saturating_sub(wire.len());
            if let Ok(tx) = Transaction::from_wire(&wire) {
                for input in tx.inputs {
                    let key = (input.prev_txid, input.vout);
                    if spends.get(&key) == Some(txid) {
                        spends.remove(&key);
                    }
                }
            }
            Some(wire)
        } else {
            None
        }
    }
}
