//! Block skeleton: header + txs, build/validate, wire.

use crate::{merkle_root_txids, CryptoError, Result, Transaction, TxId};
use sha2::{Digest, Sha256};

/// Block hash (32 bytes).
pub type BlockHash = [u8; 32];

/// Block header (version, chain, height, prev, merkle, time, bits, nonce).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BlockHeader {
    pub version: u8,
    pub chain_id: u32,
    pub height: u64,

    pub prev_blockhash: BlockHash,
    pub merkle_root: [u8; 32],

    pub time: u64,   // unix seconds
    pub bits: u32,   // placeholder for PoW/target or PoS params
    pub nonce: u64,  // placeholder
}

/// Block: header + list of transactions.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Block {
    pub header: BlockHeader,
    pub txs: Vec<Transaction>,
}

impl BlockHeader {
    /// Header bytes used for hashing and wire (same layout as to_wire).
    pub fn header_bytes(&self) -> Vec<u8> {
        self.to_wire()
    }

    /// Header wire format (stored in CF_HEADERS). Same layout as header_bytes.
    pub fn to_wire(&self) -> Vec<u8> {
        let mut out = Vec::with_capacity(1 + 4 + 8 + 32 + 32 + 8 + 4 + 8);
        out.push(self.version);
        out.extend_from_slice(&self.chain_id.to_le_bytes());
        out.extend_from_slice(&self.height.to_le_bytes());
        out.extend_from_slice(&self.prev_blockhash);
        out.extend_from_slice(&self.merkle_root);
        out.extend_from_slice(&self.time.to_le_bytes());
        out.extend_from_slice(&self.bits.to_le_bytes());
        out.extend_from_slice(&self.nonce.to_le_bytes());
        out
    }

    /// Parse header from wire bytes (CF_HEADERS layout).
    pub fn from_wire(b: &[u8]) -> Result<Self> {
        const NEED: usize = 1 + 4 + 8 + 32 + 32 + 8 + 4 + 8;
        if b.len() != NEED {
            return Err(CryptoError::Serialization("header: bad length".into()));
        }
        let mut i = 0usize;

        let version = b[i];
        i += 1;
        let chain_id = u32::from_le_bytes(b[i..i + 4].try_into().unwrap());
        i += 4;
        let height = u64::from_le_bytes(b[i..i + 8].try_into().unwrap());
        i += 8;

        let mut prev = [0u8; 32];
        prev.copy_from_slice(&b[i..i + 32]);
        i += 32;

        let mut merkle = [0u8; 32];
        merkle.copy_from_slice(&b[i..i + 32]);
        i += 32;

        let time = u64::from_le_bytes(b[i..i + 8].try_into().unwrap());
        i += 8;
        let bits = u32::from_le_bytes(b[i..i + 4].try_into().unwrap());
        i += 4;
        let nonce = u64::from_le_bytes(b[i..i + 8].try_into().unwrap());

        Ok(Self {
            version,
            chain_id,
            height,
            prev_blockhash: prev,
            merkle_root: merkle,
            time,
            bits,
            nonce,
        })
    }

    /// Block hash (single SHA-256 of header bytes).
    pub fn blockhash(&self) -> BlockHash {
        let mut h = Sha256::new();
        h.update(self.header_bytes());
        let d = h.finalize();
        let mut out = [0u8; 32];
        out.copy_from_slice(&d);
        out
    }
}

impl Block {
    /// Build a block with computed merkle root.
    pub fn build(mut header: BlockHeader, txs: Vec<Transaction>) -> Result<Self> {
        if txs.is_empty() {
            return Err(CryptoError::Serialization("block: empty tx list".into()));
        }

        // Ensure chain_id matches for all txs (anti-replay sanity).
        for tx in &txs {
            if tx.chain_id != header.chain_id {
                return Err(CryptoError::Serialization(
                    "block: tx chain_id mismatch".into(),
                ));
            }
        }

        let txids: Vec<TxId> = txs.iter().map(|t| t.txid()).collect::<Result<_>>()?;
        header.merkle_root = merkle_root_txids(&txids)?;
        Ok(Self { header, txs })
    }

    /// Validate:
    /// - non-empty txs
    /// - tx.verify
    /// - merkle matches txids
    /// - tx chain_id matches block chain_id
    pub fn validate(&self) -> Result<()> {
        if self.txs.is_empty() {
            return Err(CryptoError::Serialization("block: empty".into()));
        }

        for tx in &self.txs {
            if tx.chain_id != self.header.chain_id {
                return Err(CryptoError::Serialization(
                    "block: tx chain_id mismatch".into(),
                ));
            }
            tx.verify()?;
        }

        let txids: Vec<TxId> = self.txs.iter().map(|t| t.txid()).collect::<Result<_>>()?;
        let mr = merkle_root_txids(&txids)?;
        if mr != self.header.merkle_root {
            return Err(CryptoError::Serialization("block: bad merkle root".into()));
        }

        Ok(())
    }

    /// Minimal block wire encoding (skeleton).
    ///
    /// Layout:
    /// [0]  0x01          block-wire version
    /// header fields (fixed)
    /// tx_count (u32 LE)
    /// repeated: tx_len (u32 LE) + tx_wire bytes (Transaction::to_wire)
    pub fn to_wire(&self) -> Result<Vec<u8>> {
        self.validate()?; // enforce canonical-ish encoding for now

        let mut out = Vec::with_capacity(2048);
        out.push(0x01);
        out.extend_from_slice(&self.header.header_bytes());

        let n: u32 = self
            .txs
            .len()
            .try_into()
            .map_err(|_| CryptoError::Serialization("block: too many tx".into()))?;
        out.extend_from_slice(&n.to_le_bytes());

        for tx in &self.txs {
            let tb = tx.to_wire()?;
            let len: u32 = tb
                .len()
                .try_into()
                .map_err(|_| CryptoError::Serialization("block: tx too large".into()))?;
            out.extend_from_slice(&len.to_le_bytes());
            out.extend_from_slice(&tb);
        }

        Ok(out)
    }

    /// Decode block from wire bytes.
    pub fn from_wire(b: &[u8]) -> Result<Self> {
        if b.len() < 1 + (1 + 4 + 8 + 32 + 32 + 8 + 4 + 8) + 4 {
            return Err(CryptoError::Serialization("block: too short".into()));
        }
        let mut i = 0usize;

        let wv = b[i];
        i += 1;
        if wv != 0x01 {
            return Err(CryptoError::Serialization(
                "block: unsupported wire version".into(),
            ));
        }

        // header decode
        let version = b[i];
        i += 1;
        let chain_id = u32::from_le_bytes(b[i..i + 4].try_into().unwrap());
        i += 4;
        let height = u64::from_le_bytes(b[i..i + 8].try_into().unwrap());
        i += 8;

        let mut prev = [0u8; 32];
        prev.copy_from_slice(&b[i..i + 32]);
        i += 32;

        let mut merkle = [0u8; 32];
        merkle.copy_from_slice(&b[i..i + 32]);
        i += 32;

        let time = u64::from_le_bytes(b[i..i + 8].try_into().unwrap());
        i += 8;
        let bits = u32::from_le_bytes(b[i..i + 4].try_into().unwrap());
        i += 4;
        let nonce = u64::from_le_bytes(b[i..i + 8].try_into().unwrap());
        i += 8;

        let header = BlockHeader {
            version,
            chain_id,
            height,
            prev_blockhash: prev,
            merkle_root: merkle,
            time,
            bits,
            nonce,
        };

        let n = u32::from_le_bytes(b[i..i + 4].try_into().unwrap()) as usize;
        i += 4;
        if n == 0 {
            return Err(CryptoError::Serialization("block: zero tx".into()));
        }

        let mut txs = Vec::with_capacity(n);
        for _ in 0..n {
            if i + 4 > b.len() {
                return Err(CryptoError::Serialization("block: tx len oob".into()));
            }
            let len = u32::from_le_bytes(b[i..i + 4].try_into().unwrap()) as usize;
            i += 4;
            if i + len > b.len() {
                return Err(CryptoError::Serialization("block: tx bytes oob".into()));
            }
            let txb = &b[i..i + len];
            i += len;
            let tx = Transaction::from_wire(txb)?;
            txs.push(tx);
        }

        if i != b.len() {
            return Err(CryptoError::Serialization("block: trailing bytes".into()));
        }

        let block = Block { header, txs };
        block.validate()?;
        Ok(block)
    }
}
