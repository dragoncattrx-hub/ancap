//! Hash helpers (sha256 for plan_hash etc.).

use sha2::{Digest, Sha256};

/// SHA-256 of data, hex-encoded.
pub fn sha256_hex(data: &[u8]) -> String {
    hex::encode(Sha256::digest(data))
}
