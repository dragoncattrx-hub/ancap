//! BIP39 mnemonic and master seed.

use crate::{CryptoError, Result};
use bip39::{Language, Mnemonic as BipMnemonic};
use rand_core::{OsRng, RngCore};
use std::fmt;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

/// Wrapper around BIP39 mnemonic.
#[derive(Clone)]
pub struct Mnemonic(BipMnemonic);

impl fmt::Debug for Mnemonic {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_tuple("Mnemonic").field(&"[redacted]").finish()
    }
}

impl Mnemonic {
    /// Generate a new mnemonic (12 words).
    pub fn generate_12() -> Result<Self> {
        Self::generate_with_entropy_bytes(16)
    }

    /// Generate a 24-word mnemonic (256 bits of recovery entropy).
    ///
    /// Prefer this for newly provisioned post-quantum encryption recipients;
    /// a derived key cannot be stronger against seed search than its mnemonic.
    pub fn generate_24() -> Result<Self> {
        Self::generate_with_entropy_bytes(32)
    }

    /// Parse from words string.
    pub fn parse(words: &str) -> Result<Self> {
        let m = BipMnemonic::parse_in(Language::English, words)
            .map_err(|e| CryptoError::Mnemonic(e.to_string()))?;
        Ok(Self(m))
    }

    /// Return normalized words (space-separated).
    pub fn words(&self) -> String {
        self.0.to_string()
    }

    /// Convert to Seed using optional passphrase (BIP39).
    pub fn to_seed(&self, passphrase: &str) -> Seed {
        let mut bytes: [u8; 64] = self.0.to_seed(passphrase);
        let seed = Seed(bytes.to_vec());
        bytes.zeroize();
        seed
    }

    fn generate_with_entropy_bytes(len: usize) -> Result<Self> {
        let mut entropy = Zeroizing::new(vec![0u8; len]);
        let mut rng = OsRng;
        rng.try_fill_bytes(&mut entropy)
            .map_err(|_| CryptoError::RandomnessUnavailable)?;
        let mnemonic = BipMnemonic::from_entropy_in(Language::English, &entropy)
            .map_err(|error| CryptoError::Mnemonic(error.to_string()))?;
        Ok(Self(mnemonic))
    }
}

/// 64-byte BIP39 seed bytes (zeroized on drop). Also used for role sub-seeds (e.g. 32 bytes).
#[derive(ZeroizeOnDrop)]
pub struct Seed(pub(crate) Vec<u8>);

impl Seed {
    /// Construct seed from raw bytes (e.g. HKDF output for role sub-seeds).
    pub fn from_bytes(bytes: Vec<u8>) -> Self {
        Self(bytes)
    }

    /// Returns the seed bytes.
    pub fn as_bytes(&self) -> &[u8] {
        &self.0
    }
}
