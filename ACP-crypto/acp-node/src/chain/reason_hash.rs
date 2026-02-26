//! reason_hash64: 8-byte fingerprint of reason for dedup. v0.58.

use sha2::{Digest, Sha256};

pub fn reason_hash64(reason: &str) -> u64 {
    let mut hasher = Sha256::new();
    hasher.update(reason.as_bytes());
    let d = hasher.finalize();
    u64::from_le_bytes(d[0..8].try_into().unwrap())
}
