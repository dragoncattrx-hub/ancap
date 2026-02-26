//! BIP39 mnemonic and master seed.

use crate::{CryptoError, Result};
use bip39::{Language, Mnemonic as BipMnemonic};
use zeroize::ZeroizeOnDrop;

/// Wrapper around BIP39 mnemonic.
#[derive(Clone, Debug)]
pub struct Mnemonic(BipMnemonic);

impl Mnemonic {
    /// Generate a new mnemonic (12 words).
    pub fn generate_12() -> Result<Self> {
        let m = BipMnemonic::generate_in(Language::English, 12)
            .map_err(|e| CryptoError::Mnemonic(e.to_string()))?;
        Ok(Self(m))
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
        let bytes: [u8; 64] = self.0.to_seed(passphrase);
        Seed(bytes.to_vec())
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
