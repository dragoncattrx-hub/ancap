//! Size guards to reduce DoS risks on parsers.

use crate::limits;
use crate::{CryptoError, Result};

/// Ensures `bytes` has exactly `expected` length.
pub fn ensure_len(bytes: &[u8], expected: usize) -> Result<()> {
    if bytes.len() != expected {
        return Err(CryptoError::InvalidKeyBytes);
    }
    Ok(())
}

/// Ensures `bytes` length is at most `max`.
pub fn ensure_max(bytes: &[u8], max: usize, err: CryptoError) -> Result<()> {
    if bytes.len() > max {
        return Err(err);
    }
    Ok(())
}

/// Ensures `bytes` is non-empty.
pub fn ensure_nonempty(bytes: &[u8], err: CryptoError) -> Result<()> {
    if bytes.is_empty() {
        return Err(err);
    }
    Ok(())
}

/// Ensures keystore JSON length is within limit.
pub fn ensure_keystore_json_len(n: usize) -> Result<()> {
    if n > limits::MAX_KEYSTORE_JSON_BYTES {
        return Err(CryptoError::KeystoreTooLarge);
    }
    Ok(())
}
