//! ACP privacy primitives: unlinkable receive subaddresses (v1).
//!
//! Subaddresses are derived from the wallet **view public key wire** so each
//! receive looks like a fresh `acp1…` address on-chain. Spend authority remains
//! the spend key; wallets must scan index ranges to discover UTXOs.
//!
//! This is user unlinkability / data minimization — not a mixer or tumbler.

use crate::address::{AddressV0, ADDR_V0, HRP};
use crate::kdf;
use crate::Result;
use bech32::{Bech32, Hrp};
use sha2::{Digest, Sha256};

/// Domain for subaddress HKDF info prefix.
pub const SUBADDR_INFO_PREFIX: &[u8] = b"ACP/subaddr/v1/";

/// Default index scan window for wallets (primary = 0, then 1..=N).
pub const DEFAULT_SUBADDR_SCAN_WINDOW: u32 = 64;

/// Privacy profile tag for explorers / status APIs.
pub const PRIVACY_PROFILE: &str = "unlinkable-subaddr-v1";

/// Derive 20-byte pubkey hash for subaddress `index` from view public key wire.
///
/// `index == 0` is defined as the primary receive address hash
/// (`SHA256(view_wire)[..20]`), matching `address_v0_from_pubkey_wire`.
pub fn subaddress_hash20(view_pubkey_wire: &[u8], index: u32) -> [u8; 20] {
    if index == 0 {
        let digest = Sha256::digest(view_pubkey_wire);
        let mut h = [0u8; 20];
        h.copy_from_slice(&digest[..20]);
        return h;
    }
    let mut info = Vec::with_capacity(SUBADDR_INFO_PREFIX.len() + 4);
    info.extend_from_slice(SUBADDR_INFO_PREFIX);
    info.extend_from_slice(&index.to_le_bytes());
    let material = kdf::hkdf_32(view_pubkey_wire, &info);
    let digest = Sha256::digest(material);
    let mut h = [0u8; 20];
    h.copy_from_slice(&digest[..20]);
    h
}

/// Encode subaddress as bech32 `acp1…`.
pub fn subaddress_bech32(view_pubkey_wire: &[u8], index: u32) -> Result<String> {
    let h20 = subaddress_hash20(view_pubkey_wire, index);
    let addr = AddressV0 { pubkey_hash20: h20 };
    addr.encode()
}

/// Encode raw hash20 as ACP address (shared helper).
pub fn encode_hash20(h20: [u8; 20]) -> Result<String> {
    let hrp = Hrp::parse(HRP).map_err(|e| crate::CryptoError::Serialization(format!("bech32 hrp: {e}")))?;
    let mut data = Vec::with_capacity(21);
    data.push(ADDR_V0);
    data.extend_from_slice(&h20);
    bech32::encode::<Bech32>(hrp, &data)
        .map_err(|e| crate::CryptoError::Serialization(format!("bech32 encode: {e}")))
}

/// Redact middle of an ACP address for UI (keeps HRP + edges).
pub fn redact_address(addr: &str) -> String {
    let s = addr.trim();
    if s.len() <= 16 {
        return "acp1…".to_string();
    }
    format!("{}…{}", &s[..8], &s[s.len().saturating_sub(6)..])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn index_zero_matches_sha_prefix() {
        let wire = b"test-view-wire-bytes-for-privacy";
        let a = subaddress_hash20(wire, 0);
        let digest = Sha256::digest(wire);
        assert_eq!(&a[..], &digest[..20]);
    }

    #[test]
    fn different_indices_unlink() {
        let wire = b"test-view-wire-bytes-for-privacy";
        let a1 = subaddress_bech32(wire, 1).unwrap();
        let a2 = subaddress_bech32(wire, 2).unwrap();
        assert_ne!(a1, a2);
        assert!(a1.starts_with("acp1"));
        assert!(a2.starts_with("acp1"));
    }

    #[test]
    fn redact_keeps_edges() {
        let r = redact_address("acp1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
        assert!(r.contains('…'));
        assert!(r.starts_with("acp1"));
    }
}
