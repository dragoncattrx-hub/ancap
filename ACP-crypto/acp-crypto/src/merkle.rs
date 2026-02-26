//! Merkle root of txids (Bitcoin-style pair-hash; odd last duplicated).

use crate::{CryptoError, Result, TxId};
use sha2::{Digest, Sha256};

pub fn hash256(data: &[u8]) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(data);
    let d = h.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&d);
    out
}

fn hash_pair(a: &[u8; 32], b: &[u8; 32]) -> [u8; 32] {
    let mut buf = [0u8; 64];
    buf[..32].copy_from_slice(a);
    buf[32..].copy_from_slice(b);
    hash256(&buf)
}

/// Merkle root of txids (Bitcoin-style pairing; odd last is duplicated).
///
/// - Empty list is invalid for blocks (return error).
/// - One tx => root = txid.
pub fn merkle_root_txids(txids: &[TxId]) -> Result<[u8; 32]> {
    if txids.is_empty() {
        return Err(CryptoError::Serialization("merkle: empty".into()));
    }
    if txids.len() == 1 {
        return Ok(txids[0]);
    }

    let mut level: Vec<[u8; 32]> = txids.to_vec();

    while level.len() > 1 {
        if level.len() % 2 == 1 {
            let last = *level.last().unwrap();
            level.push(last);
        }

        let mut next = Vec::with_capacity(level.len() / 2);
        for pair in level.chunks_exact(2) {
            next.push(hash_pair(&pair[0], &pair[1]));
        }
        level = next;
    }

    Ok(level[0])
}
