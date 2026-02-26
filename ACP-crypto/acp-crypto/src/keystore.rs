//! Encrypted keystore (Argon2id + XChaCha20-Poly1305), versioned format.

use crate::{bytes, kdf, limits, CryptoError, Result};
use base64ct::{Base64, Encoding};
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::XChaCha20Poly1305;
use rand_core::CryptoRngCore;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

/// Keystore plaintext v2 (single hybrid key).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Keystore {
    pub v: u32,
    pub ed25519_seed32: [u8; 32],
    #[serde(default)]
    pub dilithium_pk: Vec<u8>,
    #[serde(default)]
    pub dilithium_sk: Vec<u8>,
}

/// Keystore plaintext v3 (wallet identity: spend/view/audit).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeystoreV3 {
    pub v: u32,
    pub spend_ed25519_seed32: [u8; 32],
    pub view_ed25519_seed32: [u8; 32],
    pub audit_ed25519_seed32: [u8; 32],
    #[serde(default)]
    pub spend_dilithium_pk: Vec<u8>,
    #[serde(default)]
    pub spend_dilithium_sk: Vec<u8>,
    #[serde(default)]
    pub view_dilithium_pk: Vec<u8>,
    #[serde(default)]
    pub view_dilithium_sk: Vec<u8>,
    #[serde(default)]
    pub audit_dilithium_pk: Vec<u8>,
    #[serde(default)]
    pub audit_dilithium_sk: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeystoreCiphertext {
    pub kdf: String,
    pub mem_kib: u32,
    pub time: u32,
    pub parallelism: u32,
    pub salt_b64: String,
    pub nonce_b64: String,
    pub ciphertext_b64: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeystoreJson {
    pub v: u32,
    pub crypto: KeystoreCiphertext,
}

impl KeystoreJson {
    /// Encrypt any serializable keystore plaintext (v2 or v3).
    pub fn encrypt<T: Serialize>(
        password: &str,
        ks: &T,
        mut rng: impl CryptoRngCore,
    ) -> Result<Self> {
        let plaintext = serde_json::to_vec(ks)
            .map_err(|e| CryptoError::Serialization(e.to_string()))?;

        if plaintext.len() > limits::MAX_KEYSTORE_PLAINTEXT_BYTES {
            return Err(CryptoError::Keystore("plaintext too large".into()));
        }

        let mut salt = [0u8; 16];
        rng.fill_bytes(&mut salt);
        let key = kdf::derive_keystore_key(password, &salt)?;

        let mut nonce = [0u8; 24];
        rng.fill_bytes(&mut nonce);

        let aead = XChaCha20Poly1305::new((&key).into());
        let ct = aead
            .encrypt((&nonce).into(), plaintext.as_ref())
            .map_err(|e| CryptoError::Keystore(e.to_string()))?;

        if ct.len() > limits::MAX_KEYSTORE_CIPHERTEXT_BYTES {
            return Err(CryptoError::KeystoreCiphertextTooLarge);
        }

        Ok(Self {
            v: 2,
            crypto: KeystoreCiphertext {
                kdf: "argon2id".to_string(),
                mem_kib: limits::ARGON2_MEM_KIB,
                time: limits::ARGON2_TIME,
                parallelism: limits::ARGON2_PARALLELISM,
                salt_b64: Base64::encode_string(&salt),
                nonce_b64: Base64::encode_string(&nonce),
                ciphertext_b64: Base64::encode_string(&ct),
            },
        })
    }

    /// Decrypt to typed keystore plaintext (v2 or v3).
    pub fn decrypt_typed<T: DeserializeOwned>(&self, password: &str) -> Result<T> {
        let json_len = serde_json::to_vec(self)
            .map_err(|e| CryptoError::Serialization(e.to_string()))?
            .len();
        bytes::ensure_keystore_json_len(json_len)?;

        if self.v != 2 {
            return Err(CryptoError::Keystore("unsupported keystore version".into()));
        }
        if self.crypto.kdf != "argon2id" {
            return Err(CryptoError::Keystore("unsupported kdf".into()));
        }

        let salt = Base64::decode_vec(&self.crypto.salt_b64)
            .map_err(|e| CryptoError::Keystore(e.to_string()))?;
        let nonce = Base64::decode_vec(&self.crypto.nonce_b64)
            .map_err(|e| CryptoError::Keystore(e.to_string()))?;
        let ct = Base64::decode_vec(&self.crypto.ciphertext_b64)
            .map_err(|e| CryptoError::Keystore(e.to_string()))?;

        if ct.len() > limits::MAX_KEYSTORE_CIPHERTEXT_BYTES {
            return Err(CryptoError::KeystoreCiphertextTooLarge);
        }
        if nonce.len() != 24 {
            return Err(CryptoError::Keystore("invalid nonce length".into()));
        }
        if salt.len() != 16 {
            return Err(CryptoError::Keystore("invalid salt length".into()));
        }

        let key = kdf::derive_keystore_key(password, &salt)?;

        let aead = XChaCha20Poly1305::new((&key).into());
        let mut n = [0u8; 24];
        n.copy_from_slice(&nonce);

        let pt = aead
            .decrypt((&n).into(), ct.as_ref())
            .map_err(|_| CryptoError::Keystore("wrong password or corrupted file".into()))?;

        if pt.len() > limits::MAX_KEYSTORE_PLAINTEXT_BYTES {
            return Err(CryptoError::Keystore("plaintext too large".into()));
        }

        let ks: T = serde_json::from_slice(&pt)
            .map_err(|e| CryptoError::Serialization(e.to_string()))?;

        Ok(ks)
    }

    /// Decrypt to keystore v2 (backward compatible).
    pub fn decrypt(&self, password: &str) -> Result<Keystore> {
        self.decrypt_typed(password)
    }

    /// Encrypt keystore v3 (wallet identity).
    pub fn encrypt_v3(
        password: &str,
        ks: &KeystoreV3,
        rng: impl CryptoRngCore,
    ) -> Result<Self> {
        Self::encrypt(password, ks, rng)
    }

    /// Decrypt to keystore v3 and validate.
    pub fn decrypt_v3(&self, password: &str) -> Result<KeystoreV3> {
        let ks: KeystoreV3 = self.decrypt_typed(password)?;
        ks.validate()?;
        Ok(ks)
    }

    pub fn to_string_pretty(&self) -> Result<String> {
        let s = serde_json::to_string_pretty(self)
            .map_err(|e| CryptoError::Serialization(e.to_string()))?;
        bytes::ensure_keystore_json_len(s.len())?;
        Ok(s)
    }

    pub fn from_str_with_limits(s: &str) -> Result<Self> {
        bytes::ensure_keystore_json_len(s.len())?;
        serde_json::from_str(s).map_err(|e| CryptoError::Serialization(e.to_string()))
    }
}

impl Keystore {
    pub fn validate(&self) -> Result<()> {
        if self.v != 2 {
            return Err(CryptoError::Keystore(
                "unsupported keystore plaintext version".into(),
            ));
        }
        if self.dilithium_pk.len() > limits::MAX_PUBKEY_BYTES {
            return Err(CryptoError::InvalidKeyBytes);
        }
        if self.dilithium_sk.len() > limits::MAX_PUBKEY_BYTES {
            return Err(CryptoError::InvalidKeyBytes);
        }
        Ok(())
    }
}

impl KeystoreV3 {
    /// Validate invariants and size limits.
    pub fn validate(&self) -> Result<()> {
        if self.v != 3 {
            return Err(CryptoError::Keystore(
                "unsupported keystore plaintext version".into(),
            ));
        }
        for pk in [
            &self.spend_dilithium_pk,
            &self.view_dilithium_pk,
            &self.audit_dilithium_pk,
        ] {
            if pk.len() > limits::MAX_PUBKEY_BYTES {
                return Err(CryptoError::InvalidKeyBytes);
            }
        }
        for sk in [
            &self.spend_dilithium_sk,
            &self.view_dilithium_sk,
            &self.audit_dilithium_sk,
        ] {
            if sk.len() > limits::MAX_PUBKEY_BYTES {
                return Err(CryptoError::InvalidKeyBytes);
            }
        }
        Ok(())
    }
}
