//! Address v0: bech32 "acp1..." with payload [version=0] + 20-byte pubkey_hash.

use crate::{CryptoError, Result};
use bech32::{Bech32, Hrp};
use sha2::{Digest, Sha256};

/// Human-readable part for ACP (ANCAP) addresses.
pub const HRP: &str = "acp";

/// Address format version (v0).
pub const ADDR_V0: u8 = 0;

/// Address v0 = bech32 "acp1..." with data: [version=0] + [20-byte pubkey_hash].
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AddressV0 {
    /// First 20 bytes of SHA256(pubkey_wire).
    pub pubkey_hash20: [u8; 20],
}

impl AddressV0 {
    /// Encode as bech32 string (e.g. "acp1...").
    pub fn encode(&self) -> Result<String> {
        let hrp = Hrp::parse(HRP).map_err(|e| {
            CryptoError::Serialization(format!("bech32 hrp: {e}"))
        })?;
        let mut data = Vec::with_capacity(1 + 20);
        data.push(ADDR_V0);
        data.extend_from_slice(&self.pubkey_hash20);
        let s = bech32::encode::<Bech32>(hrp, &data)
            .map_err(|e| CryptoError::Serialization(format!("bech32 encode: {e}")))?;
        Ok(s)
    }

    /// Decode from bech32 string.
    pub fn decode(s: &str) -> Result<Self> {
        let (hrp, raw) = bech32::decode(s)
            .map_err(|e| CryptoError::Serialization(format!("bech32 decode: {e}")))?;

        let expected = Hrp::parse(HRP).map_err(|e| {
            CryptoError::Serialization(format!("bech32 hrp: {e}"))
        })?;
        if hrp != expected {
            return Err(CryptoError::Serialization("address: wrong hrp".into()));
        }

        if raw.len() != 21 {
            return Err(CryptoError::Serialization("address: bad length".into()));
        }
        if raw[0] != ADDR_V0 {
            return Err(CryptoError::Serialization(
                "address: unsupported version".into(),
            ));
        }

        let mut h = [0u8; 20];
        h.copy_from_slice(&raw[1..21]);
        Ok(Self { pubkey_hash20: h })
    }
}

/// Compute address v0 from pubkey wire bytes.
/// pubkey_hash20 = SHA256(pubkey_wire)[..20]
impl std::str::FromStr for AddressV0 {
    type Err = CryptoError;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        Self::decode(s)
    }
}

pub fn address_v0_from_pubkey_wire(pubkey_wire: &[u8]) -> Result<AddressV0> {
    if pubkey_wire.is_empty() {
        return Err(CryptoError::InvalidKeyBytes);
    }
    let digest = Sha256::digest(pubkey_wire);
    let mut h = [0u8; 20];
    h.copy_from_slice(&digest[..20]);
    Ok(AddressV0 { pubkey_hash20: h })
}
