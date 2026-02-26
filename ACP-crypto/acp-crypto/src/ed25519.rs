//! Ed25519 layer (classical).

use crate::bytes::ensure_len;
use crate::{Domain, CryptoError, Result};
use ed25519_dalek::{Signature, SigningKey, VerifyingKey, Signer};
use rand_core::CryptoRngCore;
use serde::{Deserialize, Serialize};
use zeroize::ZeroizeOnDrop;

/// Ed25519 public key length in bytes.
pub const ED25519_PK_LEN: usize = 32;
/// Ed25519 secret key length in bytes.
pub const ED25519_SK_LEN: usize = 32;
/// Ed25519 signature length in bytes.
pub const ED25519_SIG_LEN: usize = 64;

/// Ed25519 public key.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Ed25519PublicKey(pub [u8; ED25519_PK_LEN]);

/// Ed25519 secret key (zeroized on drop).
#[derive(ZeroizeOnDrop)]
pub struct Ed25519SecretKey {
    sk: SigningKey,
}

/// Ed25519 signature (serde via bytes: [u8; 64] not in serde).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Ed25519Signature(pub [u8; ED25519_SIG_LEN]);

mod ed25519_sig_serde {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use super::ED25519_SIG_LEN;
    pub fn serialize<S>(b: &[u8; ED25519_SIG_LEN], s: S) -> Result<S::Ok, S::Error>
    where S: Serializer {
        b.as_slice().serialize(s)
    }
    pub fn deserialize<'de, D>(d: D) -> Result<[u8; ED25519_SIG_LEN], D::Error>
    where D: Deserializer<'de> {
        let v: Vec<u8> = Vec::deserialize(d)?;
        if v.len() != ED25519_SIG_LEN {
            return Err(serde::de::Error::custom("wrong Ed25519 signature length"));
        }
        let mut out = [0u8; ED25519_SIG_LEN];
        out.copy_from_slice(&v);
        Ok(out)
    }
}

impl Serialize for Ed25519Signature {
    fn serialize<S: serde::Serializer>(&self, s: S) -> std::result::Result<S::Ok, S::Error> {
        ed25519_sig_serde::serialize(&self.0, s)
    }
}

impl<'de> Deserialize<'de> for Ed25519Signature {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> std::result::Result<Self, D::Error> {
        ed25519_sig_serde::deserialize(d).map(Ed25519Signature)
    }
}

impl Ed25519SecretKey {
    /// Generates a new keypair using the given RNG.
    pub fn generate(mut rng: impl CryptoRngCore) -> Self {
        let sk = SigningKey::generate(&mut rng);
        Self { sk }
    }

    /// Returns the public key.
    pub fn public_key(&self) -> Ed25519PublicKey {
        Ed25519PublicKey(self.sk.verifying_key().to_bytes())
    }

    /// Builds a secret key from a 32-byte seed.
    pub fn from_seed(seed32: [u8; ED25519_SK_LEN]) -> Self {
        let sk = SigningKey::from_bytes(&seed32);
        Self { sk }
    }

    /// Signs `msg` under `domain`.
    pub fn sign(&self, domain: Domain, msg: &[u8]) -> Result<Ed25519Signature> {
        let dm = domain.apply(msg)?;
        let sig: Signature = self.sk.sign(&dm);
        Ok(Ed25519Signature(sig.to_bytes()))
    }
}

impl Ed25519PublicKey {
    /// Parses public key from bytes.
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        ensure_len(bytes, ED25519_PK_LEN)?;
        let mut b = [0u8; ED25519_PK_LEN];
        b.copy_from_slice(bytes);
        Ok(Self(b))
    }

    /// Verifies `sig` over `msg` under `domain`.
    pub fn verify(&self, domain: Domain, msg: &[u8], sig: &Ed25519Signature) -> Result<()> {
        let vk = VerifyingKey::from_bytes(&self.0).map_err(|_| CryptoError::InvalidKeyBytes)?;
        let dm = domain.apply(msg)?;
        let s = Signature::from_bytes(&sig.0);
        vk.verify_strict(&dm, &s).map_err(|_| CryptoError::VerifyFailed)
    }
}
