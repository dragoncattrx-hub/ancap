//! Hybrid Ed25519 + Dilithium: both signatures required.
//! Ed25519 derived from seed (mnemonic); Dilithium stored in keystore.

use crate::ed25519::{Ed25519PublicKey, Ed25519SecretKey, Ed25519Signature};
use crate::kdf;
use crate::keystore::Keystore;
use crate::seed::Seed;
use crate::{CryptoError, Domain, Result};
use rand_core::CryptoRngCore;
use serde::{Deserialize, Serialize};
use std::fmt;

#[cfg(feature = "pqc")]
use crate::dilithium::{DilithiumPublicKey, DilithiumSecretKey, DilithiumSignature};

use crate::traits::{Signer, Verifier};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct HybridPublicKey {
    pub ed25519: Ed25519PublicKey,
    #[cfg(feature = "pqc")]
    pub dilithium: DilithiumPublicKey,
}

/// Secret key: Ed25519 (zeroized on drop) + optional PQC (no Zeroize in pqcrypto).
pub struct HybridSecretKey {
    ed25519: Ed25519SecretKey,
    #[cfg(feature = "pqc")]
    dilithium: DilithiumSecretKey,
    #[cfg(feature = "pqc")]
    dilithium_pk: DilithiumPublicKey,
}

impl fmt::Debug for HybridSecretKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut binding = f.debug_struct("HybridSecretKey");
        let s = binding.field("ed25519", &"[redacted]"); // s keeps binding alive
        #[cfg(feature = "pqc")]
        {
            s.field("dilithium", &"[redacted]");
        }
        s.finish()
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct HybridSignature {
    pub ed25519: Ed25519Signature,
    #[cfg(feature = "pqc")]
    pub dilithium: DilithiumSignature,
}

impl HybridSecretKey {
    /// Random generation (dev / tests).
    pub fn generate(mut rng: impl CryptoRngCore) -> Self {
        let ed = Ed25519SecretKey::generate(&mut rng);

        #[cfg(feature = "pqc")]
        {
            let (pk, sk) = crate::dilithium::keypair();
            Self {
                ed25519: ed,
                dilithium: sk,
                dilithium_pk: pk,
            }
        }

        #[cfg(not(feature = "pqc"))]
        {
            let _ = rng;
            Self { ed25519: ed }
        }
    }

    /// Deterministic Ed25519 from Seed + fresh Dilithium keypair (stored in keystore).
    pub fn from_seed(seed: &Seed, rng: impl CryptoRngCore) -> Result<Self> {
        let ed_seed = kdf::hkdf_32(seed.as_bytes(), b"ACP/ed25519/seed/v1");
        let ed = Ed25519SecretKey::from_seed(ed_seed);

        #[cfg(feature = "pqc")]
        {
            let (pk, sk) = crate::dilithium::keypair();
            let _ = rng; // reserved for future pqc libs that accept RNG
            Ok(Self {
                ed25519: ed,
                dilithium: sk,
                dilithium_pk: pk,
            })
        }

        #[cfg(not(feature = "pqc"))]
        {
            let _ = rng;
            Err(CryptoError::PqcDisabled)
        }
    }

    /// Returns the hybrid public key.
    pub fn public_key(&self) -> HybridPublicKey {
        #[cfg(feature = "pqc")]
        {
            HybridPublicKey {
                ed25519: self.ed25519.public_key(),
                dilithium: self.dilithium_pk.clone(),
            }
        }

        #[cfg(not(feature = "pqc"))]
        {
            HybridPublicKey {
                ed25519: self.ed25519.public_key(),
            }
        }
    }

    /// Signs `msg` under `domain` (both Ed25519 and Dilithium).
    pub fn sign(&self, domain: Domain, msg: &[u8]) -> Result<HybridSignature> {
        let ed_sig = self.ed25519.sign(domain, msg)?;

        #[cfg(feature = "pqc")]
        {
            let pq_sig = self.dilithium.sign(domain, msg)?;
            Ok(HybridSignature {
                ed25519: ed_sig,
                dilithium: pq_sig,
            })
        }

        #[cfg(not(feature = "pqc"))]
        {
            let _ = ed_sig;
            Err(CryptoError::PqcDisabled)
        }
    }

    /// Build keystore plaintext from (mnemonic) Seed + current PQC key material.
    ///
    /// Ed25519 is stored as derived seed32 (deterministic).
    /// Dilithium keys are stored as raw bytes (since deterministic derivation is not available).
    pub fn to_keystore_plaintext(&self, seed: &Seed) -> Result<Keystore> {
        #[cfg(feature = "pqc")]
        {
            let ed_seed32 = kdf::hkdf_32(seed.as_bytes(), b"ACP/ed25519/seed/v1");
            Ok(Keystore {
                v: 2,
                ed25519_seed32: ed_seed32,
                dilithium_pk: self.dilithium_pk.0.clone(),
                dilithium_sk: self.dilithium.to_bytes(),
            })
        }

        #[cfg(not(feature = "pqc"))]
        {
            let _ = seed;
            Err(CryptoError::PqcDisabled)
        }
    }

    /// Restore HybridSecretKey from keystore plaintext.
    ///
    /// This is the canonical wallet restore path.
    pub fn from_keystore(ks: &Keystore) -> Result<Self> {
        ks.validate()?;

        let ed = Ed25519SecretKey::from_seed(ks.ed25519_seed32);

        #[cfg(feature = "pqc")]
        {
            let pk = DilithiumPublicKey(ks.dilithium_pk.clone());
            let sk = DilithiumSecretKey::from_bytes(&ks.dilithium_sk)?;
            Ok(Self {
                ed25519: ed,
                dilithium: sk,
                dilithium_pk: pk,
            })
        }

        #[cfg(not(feature = "pqc"))]
        {
            let _ = ed;
            Err(CryptoError::PqcDisabled)
        }
    }
}

impl HybridPublicKey {
    /// Verifies hybrid signature (both components must verify).
    pub fn verify(&self, domain: Domain, msg: &[u8], sig: &HybridSignature) -> Result<()> {
        self.ed25519.verify(domain, msg, &sig.ed25519)?;

        #[cfg(feature = "pqc")]
        {
            self.dilithium.verify(domain, msg, &sig.dilithium)?;
            Ok(())
        }

        #[cfg(not(feature = "pqc"))]
        {
            Err(CryptoError::PqcDisabled)
        }
    }
}

impl Signer for HybridSecretKey {
    type PublicKey = HybridPublicKey;
    type Signature = HybridSignature;

    fn public_key(&self) -> Self::PublicKey {
        HybridSecretKey::public_key(self)
    }

    fn sign(&self, domain: Domain, msg: &[u8]) -> Result<Self::Signature> {
        HybridSecretKey::sign(self, domain, msg)
    }
}

impl Verifier for HybridPublicKey {
    type PublicKey = HybridPublicKey;
    type Signature = HybridSignature;

    fn verify(
        pk: &Self::PublicKey,
        domain: Domain,
        msg: &[u8],
        sig: &Self::Signature,
    ) -> Result<()> {
        pk.verify(domain, msg, sig)
    }
}

// Wire adapters: HybridPublicKey/Signature <-> PublicKeyBytes/SignatureBytes <-> Vec<u8>
use crate::wire::{PublicKeyBytes, SignatureBytes, WireDecode, WireEncode};

impl HybridPublicKey {
    /// Convert to wire bytes (v1).
    pub fn to_wire_bytes(&self) -> Result<Vec<u8>> {
        let w = PublicKeyBytes {
            ed25519: Some(self.ed25519.0),
            #[cfg(feature = "pqc")]
            dilithium: Some(self.dilithium.0.clone()),
            #[cfg(not(feature = "pqc"))]
            dilithium: None,
        };
        w.to_wire()
    }

    /// Parse from wire bytes (v1).
    pub fn from_wire_bytes(b: &[u8]) -> Result<Self> {
        let w = PublicKeyBytes::from_wire(b)?;
        let ed = w.ed25519.ok_or(CryptoError::InvalidKeyBytes)?;
        let edpk = crate::ed25519::Ed25519PublicKey(ed);

        #[cfg(feature = "pqc")]
        {
            let pq = w.dilithium.ok_or(CryptoError::InvalidKeyBytes)?;
            Ok(Self {
                ed25519: edpk,
                dilithium: crate::dilithium::DilithiumPublicKey(pq),
            })
        }

        #[cfg(not(feature = "pqc"))]
        {
            Ok(Self { ed25519: edpk })
        }
    }
}

impl HybridSignature {
    /// Convert to wire bytes (v1).
    pub fn to_wire_bytes(&self) -> Result<Vec<u8>> {
        let w = SignatureBytes {
            ed25519: Some(self.ed25519.0),
            #[cfg(feature = "pqc")]
            dilithium: Some(self.dilithium.0.clone()),
            #[cfg(not(feature = "pqc"))]
            dilithium: None,
        };
        w.to_wire()
    }

    /// Parse from wire bytes (v1).
    pub fn from_wire_bytes(b: &[u8]) -> Result<Self> {
        let w = SignatureBytes::from_wire(b)?;
        let ed = w.ed25519.ok_or(CryptoError::InvalidSignatureBytes)?;
        let edsig = crate::ed25519::Ed25519Signature(ed);

        #[cfg(feature = "pqc")]
        {
            let pq = w.dilithium.ok_or(CryptoError::InvalidSignatureBytes)?;
            Ok(Self {
                ed25519: edsig,
                dilithium: crate::dilithium::DilithiumSignature(pq),
            })
        }

        #[cfg(not(feature = "pqc"))]
        {
            Ok(Self { ed25519: edsig })
        }
    }
}
