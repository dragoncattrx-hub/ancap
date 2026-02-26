//! HKDF and Argon2id for key derivation.

use crate::limits;
use crate::{CryptoError, Result};
use argon2::{Algorithm, Argon2, Params, Version};
use hkdf::Hkdf;
use sha2::Sha256;

/// Derives 32 bytes using HKDF-SHA256 (no salt; for domain-separated seed expansion).
pub fn hkdf_32(ikm: &[u8], info: &[u8]) -> [u8; 32] {
    let hk = Hkdf::<Sha256>::new(None, ikm);
    let mut out = [0u8; 32];
    hk.expand(info, &mut out).expect("hkdf expand");
    out
}

/// Derive keystore encryption key from password + salt (Argon2id).
pub fn derive_keystore_key(password: &str, salt: &[u8]) -> Result<[u8; 32]> {
    let params = Params::new(
        limits::ARGON2_MEM_KIB,
        limits::ARGON2_TIME,
        limits::ARGON2_PARALLELISM,
        Some(32),
    )
    .map_err(|e| CryptoError::Keystore(e.to_string()))?;

    let a2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut out = [0u8; 32];

    a2.hash_password_into(password.as_bytes(), salt, &mut out)
        .map_err(|e| CryptoError::Keystore(e.to_string()))?;

    Ok(out)
}
