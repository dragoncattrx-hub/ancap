//! Hybrid post-quantum envelope encryption.
//!
//! This module implements the X-Wing draft-10 hybrid KEM over X25519 and
//! NIST FIPS 203 ML-KEM-768, then derives an XChaCha20-Poly1305 content key
//! with HKDF-SHA256. The version, suite, recipient key id, encapsulation,
//! nonce, and caller-provided context are authenticated as associated data.
//!
//! The construction is intentionally separate from transaction signatures:
//! signatures authenticate public chain data, while this envelope protects
//! off-chain payloads. It is not a TLS replacement and requires independent
//! review before protecting production secrets.

use crate::limits;
use crate::{CryptoError, Result, Seed};
use chacha20poly1305::aead::{Aead, KeyInit as AeadKeyInit, Payload};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use hkdf::Hkdf;
use ml_kem::kem::{Decapsulate, Kem, KeyExport, KeyInit as KemKeyInit};
use ml_kem::ml_kem_768::Ciphertext as MlKem768Ciphertext;
use ml_kem::{MlKem768, Seed as MlKemSeed, B32};
use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::{Digest as Sha3Digest, Sha3_256, Shake256};
use std::fmt;
use x25519_dalek::{PublicKey as X25519PublicKey, StaticSecret};
use zeroize::{Zeroize, Zeroizing};

type MlKem768DecapsulationKey = <MlKem768 as Kem>::DecapsulationKey;
type MlKem768EncapsulationKey = <MlKem768 as Kem>::EncapsulationKey;

/// Current hybrid envelope format.
pub const HYBRID_ENVELOPE_VERSION: u8 = 1;
/// Exact suite identifier authenticated by every envelope.
pub const HYBRID_KEM_SUITE: &str = "X-Wing-draft10/HKDF-SHA256/XChaCha20-Poly1305";
/// ML-KEM-768 encapsulation key size from FIPS 203.
pub const ML_KEM_768_PUBLIC_KEY_BYTES: usize = 1184;
/// ML-KEM-768 ciphertext size from FIPS 203.
pub const ML_KEM_768_CIPHERTEXT_BYTES: usize = 1088;
/// X-Wing draft-10 encapsulation key size.
pub const XWING_PUBLIC_KEY_BYTES: usize = 1216;
/// X-Wing draft-10 ciphertext size.
pub const XWING_CIPHERTEXT_BYTES: usize = 1120;

const KDF_LABEL: &[u8] = b"ACP/hybrid-kem/content-key/v1";
const XWING_SEED_LABEL: &[u8] = b"ACP/hybrid-kem/x-wing-draft10/seed/v1";
const XWING_LABEL: [u8; 6] = [0x5c, 0x2e, 0x2f, 0x2f, 0x5e, 0x5c];
const AAD_MAGIC: &[u8] = b"ACP-PQ-ENVELOPE";

/// Recipient key for hybrid envelope encryption.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct HybridKemPublicKey {
    pub version: u8,
    pub suite: String,
    pub x25519: [u8; 32],
    pub ml_kem_768: Vec<u8>,
}

#[derive(Deserialize)]
struct HybridKemPublicKeyWire {
    version: u8,
    suite: String,
    x25519: [u8; 32],
    ml_kem_768: Vec<u8>,
}

/// Recipient secret key. Secret material is zeroized by its component types.
pub struct HybridKemSecretKey {
    x25519: StaticSecret,
    ml_kem_768: MlKem768DecapsulationKey,
    public: HybridKemPublicKey,
}

impl fmt::Debug for HybridKemSecretKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("HybridKemSecretKey")
            .field("x25519", &"[redacted]")
            .field("ml_kem_768", &"[redacted]")
            .field("public", &self.public)
            .finish()
    }
}

/// Versioned authenticated hybrid ciphertext.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct HybridEnvelope {
    pub version: u8,
    pub suite: String,
    pub recipient_key_id: [u8; 32],
    pub ephemeral_x25519: [u8; 32],
    pub ml_kem_768_ciphertext: Vec<u8>,
    pub nonce: [u8; 24],
    pub ciphertext: Vec<u8>,
}

#[derive(Deserialize)]
struct HybridEnvelopeWire {
    version: u8,
    suite: String,
    recipient_key_id: [u8; 32],
    ephemeral_x25519: [u8; 32],
    ml_kem_768_ciphertext: Vec<u8>,
    nonce: [u8; 24],
    ciphertext: Vec<u8>,
}

struct XWingEncapsulation {
    ml_kem_ciphertext: Vec<u8>,
    ephemeral_x25519: [u8; 32],
    shared_secret: Zeroizing<[u8; 32]>,
}

impl HybridKemSecretKey {
    /// Derive a stable recipient key from a wallet seed using distinct HKDF
    /// labels. No new recovery material is required.
    pub fn from_seed(seed: &Seed) -> Result<Self> {
        if seed.as_bytes().len() < 32 {
            return Err(CryptoError::InvalidKeyBytes);
        }

        let mut xwing_seed = crate::kdf::hkdf_32(seed.as_bytes(), XWING_SEED_LABEL);
        let result = Self::from_xwing_seed(&xwing_seed);
        xwing_seed.zeroize();
        result
    }

    /// Restore from the 32-byte X-Wing decapsulation seed defined by
    /// draft-connolly-cfrg-xwing-kem-10. Treat this value as secret.
    pub fn from_xwing_seed(xwing_seed: &[u8; 32]) -> Result<Self> {
        let mut shake = Shake256::default();
        shake.update(xwing_seed);
        let mut reader = shake.finalize_xof();
        let mut expanded = Zeroizing::new([0u8; 96]);
        reader.read(&mut *expanded);

        let mut ml_kem_seed_bytes = Zeroizing::new([0u8; 64]);
        ml_kem_seed_bytes.copy_from_slice(&expanded[..64]);
        let mut ml_kem_seed: MlKemSeed = (*ml_kem_seed_bytes).into();
        let ml_kem_768 = MlKem768DecapsulationKey::new(&ml_kem_seed);
        ml_kem_seed.zeroize();
        let ml_kem_public = ml_kem_768.encapsulation_key().to_bytes();

        let mut x25519_bytes = [0u8; 32];
        x25519_bytes.copy_from_slice(&expanded[64..]);
        let x25519 = StaticSecret::from(x25519_bytes);
        x25519_bytes.zeroize();
        let x25519_public = X25519PublicKey::from(&x25519);

        let public = HybridKemPublicKey {
            version: HYBRID_ENVELOPE_VERSION,
            suite: HYBRID_KEM_SUITE.to_owned(),
            x25519: *x25519_public.as_bytes(),
            ml_kem_768: ml_kem_public.as_slice().to_vec(),
        };
        public.validate()?;

        Ok(Self {
            x25519,
            ml_kem_768,
            public,
        })
    }

    /// Return the shareable recipient public key.
    pub fn public_key(&self) -> HybridKemPublicKey {
        self.public.clone()
    }

    /// Open an envelope. A different context, recipient, header, or ciphertext
    /// is rejected by AEAD authentication.
    pub fn open(&self, envelope: &HybridEnvelope, context: &[u8]) -> Result<Vec<u8>> {
        envelope.validate(context)?;
        if envelope.recipient_key_id != self.public.key_id() {
            return Err(CryptoError::DecryptionFailed);
        }

        let ephemeral_public = X25519PublicKey::from(envelope.ephemeral_x25519);
        let x25519_shared = self.x25519.diffie_hellman(&ephemeral_public);

        let ml_kem_ciphertext: MlKem768Ciphertext = envelope
            .ml_kem_768_ciphertext
            .as_slice()
            .try_into()
            .map_err(|_| CryptoError::InvalidCiphertext)?;
        let ml_kem_shared = self.ml_kem_768.decapsulate(&ml_kem_ciphertext);
        let xwing_shared = combine_xwing(
            ml_kem_shared.as_slice(),
            x25519_shared.as_bytes(),
            &envelope.ephemeral_x25519,
            &self.public.x25519,
        )?;

        let aad = envelope.associated_data(context)?;
        let key = derive_content_key(&xwing_shared, &envelope.recipient_key_id, &aad)?;
        let cipher =
            XChaCha20Poly1305::new_from_slice(&*key).map_err(|_| CryptoError::EncryptionFailed)?;

        cipher
            .decrypt(
                XNonce::from_slice(&envelope.nonce),
                Payload {
                    msg: &envelope.ciphertext,
                    aad: &aad,
                },
            )
            .map_err(|_| CryptoError::DecryptionFailed)
    }
}

impl HybridKemPublicKey {
    /// Validate version, suite, and exact standardized key sizes.
    pub fn validate(&self) -> Result<()> {
        if self.version != HYBRID_ENVELOPE_VERSION || self.suite != HYBRID_KEM_SUITE {
            return Err(CryptoError::UnsupportedCryptoSuite);
        }
        if self.x25519 == [0u8; 32] || self.ml_kem_768.len() != ML_KEM_768_PUBLIC_KEY_BYTES {
            return Err(CryptoError::InvalidKeyBytes);
        }
        Ok(())
    }

    /// Serialize a validated recipient key to JSON.
    pub fn to_json(&self) -> Result<String> {
        self.validate()?;
        let json = serde_json::to_string(self).map_err(|error| {
            CryptoError::Serialization(format!("hybrid recipient key JSON: {error}"))
        })?;
        if json.len() > limits::MAX_HYBRID_PUBLIC_KEY_JSON_BYTES {
            return Err(CryptoError::MessageTooLarge);
        }
        Ok(json)
    }

    /// Parse a recipient key from size-bounded JSON.
    pub fn from_json(input: &str) -> Result<Self> {
        Self::from_json_bytes(input.as_bytes())
    }

    /// Parse a recipient key from size-bounded UTF-8 JSON bytes.
    pub fn from_json_bytes(input: &[u8]) -> Result<Self> {
        if input.len() > limits::MAX_HYBRID_PUBLIC_KEY_JSON_BYTES {
            return Err(CryptoError::MessageTooLarge);
        }
        let wire: HybridKemPublicKeyWire = serde_json::from_slice(input).map_err(|error| {
            CryptoError::Serialization(format!("hybrid recipient key JSON: {error}"))
        })?;
        let key = Self {
            version: wire.version,
            suite: wire.suite,
            x25519: wire.x25519,
            ml_kem_768: wire.ml_kem_768,
        };
        key.validate()?;
        Ok(key)
    }

    /// Stable SHA-256 identifier for this exact versioned recipient key.
    pub fn key_id(&self) -> [u8; 32] {
        let mut h = Sha256::new();
        h.update(AAD_MAGIC);
        h.update([self.version]);
        h.update((self.suite.len() as u16).to_be_bytes());
        h.update(self.suite.as_bytes());
        h.update(self.x25519);
        h.update((self.ml_kem_768.len() as u16).to_be_bytes());
        h.update(&self.ml_kem_768);
        h.finalize().into()
    }

    /// Hex-encoded recipient key id for logs and key directories.
    pub fn key_id_hex(&self) -> String {
        hex::encode(self.key_id())
    }

    /// Seal plaintext to this recipient.
    pub fn seal(&self, plaintext: &[u8], context: &[u8]) -> Result<HybridEnvelope> {
        self.validate()?;
        ensure_payload_limits(plaintext, context)?;

        let mut encapsulation_seed = Zeroizing::new([0u8; 64]);
        fill_random(&mut *encapsulation_seed)?;
        let xwing = encapsulate_xwing(self, &encapsulation_seed)?;

        let mut nonce = [0u8; 24];
        fill_random(&mut nonce)?;

        let mut envelope = HybridEnvelope {
            version: HYBRID_ENVELOPE_VERSION,
            suite: HYBRID_KEM_SUITE.to_owned(),
            recipient_key_id: self.key_id(),
            ephemeral_x25519: xwing.ephemeral_x25519,
            ml_kem_768_ciphertext: xwing.ml_kem_ciphertext,
            nonce,
            ciphertext: Vec::new(),
        };
        let aad = envelope.associated_data(context)?;
        let key = derive_content_key(&xwing.shared_secret, &envelope.recipient_key_id, &aad)?;
        let cipher =
            XChaCha20Poly1305::new_from_slice(&*key).map_err(|_| CryptoError::EncryptionFailed)?;
        envelope.ciphertext = cipher
            .encrypt(
                XNonce::from_slice(&envelope.nonce),
                Payload {
                    msg: plaintext,
                    aad: &aad,
                },
            )
            .map_err(|_| CryptoError::EncryptionFailed)?;
        envelope.validate(context)?;
        Ok(envelope)
    }
}

impl HybridEnvelope {
    /// Serialize a validated envelope to JSON.
    pub fn to_json(&self, context: &[u8]) -> Result<String> {
        self.validate(context)?;
        let json = serde_json::to_string(self).map_err(|error| {
            CryptoError::Serialization(format!("hybrid envelope JSON: {error}"))
        })?;
        if json.len() > limits::MAX_HYBRID_ENVELOPE_JSON_BYTES {
            return Err(CryptoError::MessageTooLarge);
        }
        Ok(json)
    }

    /// Parse an envelope from size-bounded JSON and validate it for `context`.
    pub fn from_json(input: &str, context: &[u8]) -> Result<Self> {
        Self::from_json_bytes(input.as_bytes(), context)
    }

    /// Parse an envelope from size-bounded UTF-8 JSON bytes.
    pub fn from_json_bytes(input: &[u8], context: &[u8]) -> Result<Self> {
        if context.len() > limits::MAX_HYBRID_CONTEXT_BYTES {
            return Err(CryptoError::ContextTooLarge);
        }
        if input.len() > limits::MAX_HYBRID_ENVELOPE_JSON_BYTES {
            return Err(CryptoError::MessageTooLarge);
        }
        let wire: HybridEnvelopeWire = serde_json::from_slice(input).map_err(|error| {
            CryptoError::Serialization(format!("hybrid envelope JSON: {error}"))
        })?;
        let envelope = Self {
            version: wire.version,
            suite: wire.suite,
            recipient_key_id: wire.recipient_key_id,
            ephemeral_x25519: wire.ephemeral_x25519,
            ml_kem_768_ciphertext: wire.ml_kem_768_ciphertext,
            nonce: wire.nonce,
            ciphertext: wire.ciphertext,
        };
        envelope.validate(context)?;
        Ok(envelope)
    }

    /// Validate the exact current format and parser size limits.
    pub fn validate(&self, context: &[u8]) -> Result<()> {
        if self.version != HYBRID_ENVELOPE_VERSION || self.suite != HYBRID_KEM_SUITE {
            return Err(CryptoError::UnsupportedCryptoSuite);
        }
        if self.ml_kem_768_ciphertext.len() != ML_KEM_768_CIPHERTEXT_BYTES {
            return Err(CryptoError::InvalidCiphertext);
        }
        if context.len() > limits::MAX_HYBRID_CONTEXT_BYTES {
            return Err(CryptoError::ContextTooLarge);
        }
        if self.ciphertext.len() < 16 || self.ciphertext.len() > limits::MAX_HYBRID_CIPHERTEXT_BYTES
        {
            return Err(CryptoError::InvalidCiphertext);
        }
        Ok(())
    }

    fn associated_data(&self, context: &[u8]) -> Result<Vec<u8>> {
        if context.len() > limits::MAX_HYBRID_CONTEXT_BYTES {
            return Err(CryptoError::ContextTooLarge);
        }
        let suite_len =
            u16::try_from(self.suite.len()).map_err(|_| CryptoError::UnsupportedCryptoSuite)?;
        let kem_len = u16::try_from(self.ml_kem_768_ciphertext.len())
            .map_err(|_| CryptoError::InvalidCiphertext)?;
        let context_len = u32::try_from(context.len()).map_err(|_| CryptoError::ContextTooLarge)?;

        let mut aad = Vec::with_capacity(
            AAD_MAGIC.len()
                + 1
                + 2
                + self.suite.len()
                + 32
                + 32
                + 2
                + self.ml_kem_768_ciphertext.len()
                + 24
                + 4
                + context.len(),
        );
        aad.extend_from_slice(AAD_MAGIC);
        aad.push(self.version);
        aad.extend_from_slice(&suite_len.to_be_bytes());
        aad.extend_from_slice(self.suite.as_bytes());
        aad.extend_from_slice(&self.recipient_key_id);
        aad.extend_from_slice(&self.ephemeral_x25519);
        aad.extend_from_slice(&kem_len.to_be_bytes());
        aad.extend_from_slice(&self.ml_kem_768_ciphertext);
        aad.extend_from_slice(&self.nonce);
        aad.extend_from_slice(&context_len.to_be_bytes());
        aad.extend_from_slice(context);
        Ok(aad)
    }
}

fn encapsulate_xwing(
    recipient: &HybridKemPublicKey,
    encapsulation_seed: &[u8; 64],
) -> Result<XWingEncapsulation> {
    let ml_kem_public_bytes = recipient
        .ml_kem_768
        .as_slice()
        .try_into()
        .map_err(|_| CryptoError::InvalidKeyBytes)?;
    let ml_kem_public = MlKem768EncapsulationKey::new(&ml_kem_public_bytes)
        .map_err(|_| CryptoError::InvalidKeyBytes)?;

    let mut ml_kem_random: B32 = encapsulation_seed[..32]
        .try_into()
        .map_err(|_| CryptoError::EncryptionFailed)?;
    let (ml_kem_ciphertext, ml_kem_shared) =
        ml_kem_public.encapsulate_deterministic(&ml_kem_random);
    ml_kem_random.zeroize();

    let mut ephemeral_bytes = [0u8; 32];
    ephemeral_bytes.copy_from_slice(&encapsulation_seed[32..]);
    let ephemeral_secret = StaticSecret::from(ephemeral_bytes);
    ephemeral_bytes.zeroize();
    let ephemeral_public = X25519PublicKey::from(&ephemeral_secret);
    let recipient_x25519 = X25519PublicKey::from(recipient.x25519);
    let x25519_shared = ephemeral_secret.diffie_hellman(&recipient_x25519);
    let shared_secret = combine_xwing(
        ml_kem_shared.as_slice(),
        x25519_shared.as_bytes(),
        ephemeral_public.as_bytes(),
        &recipient.x25519,
    )?;

    Ok(XWingEncapsulation {
        ml_kem_ciphertext: ml_kem_ciphertext.as_slice().to_vec(),
        ephemeral_x25519: *ephemeral_public.as_bytes(),
        shared_secret,
    })
}

fn fill_random(output: &mut [u8]) -> Result<()> {
    let mut rng = OsRng;
    rng.try_fill_bytes(output)
        .map_err(|_| CryptoError::RandomnessUnavailable)
}

fn ensure_payload_limits(plaintext: &[u8], context: &[u8]) -> Result<()> {
    if plaintext.len() > limits::MAX_HYBRID_PLAINTEXT_BYTES {
        return Err(CryptoError::MessageTooLarge);
    }
    if context.len() > limits::MAX_HYBRID_CONTEXT_BYTES {
        return Err(CryptoError::ContextTooLarge);
    }
    Ok(())
}

fn combine_xwing(
    ml_kem_shared: &[u8],
    x25519_shared: &[u8; 32],
    ephemeral_x25519: &[u8; 32],
    recipient_x25519: &[u8; 32],
) -> Result<Zeroizing<[u8; 32]>> {
    if ml_kem_shared.len() != 32 {
        return Err(CryptoError::InvalidCiphertext);
    }
    let mut h = Sha3_256::new();
    Sha3Digest::update(&mut h, ml_kem_shared);
    Sha3Digest::update(&mut h, x25519_shared);
    Sha3Digest::update(&mut h, ephemeral_x25519);
    Sha3Digest::update(&mut h, recipient_x25519);
    Sha3Digest::update(&mut h, XWING_LABEL);
    Ok(Zeroizing::new(Sha3Digest::finalize(h).into()))
}

fn derive_content_key(
    xwing_shared: &[u8; 32],
    recipient_key_id: &[u8; 32],
    aad: &[u8],
) -> Result<Zeroizing<[u8; 32]>> {
    let aad_hash = Sha256::digest(aad);
    let mut info = Vec::with_capacity(KDF_LABEL.len() + aad_hash.len());
    info.extend_from_slice(KDF_LABEL);
    info.extend_from_slice(&aad_hash);

    let hk = Hkdf::<Sha256>::new(Some(recipient_key_id), xwing_shared);
    let mut key = Zeroizing::new([0u8; 32]);
    hk.expand(&info, &mut *key)
        .map_err(|_| CryptoError::KdfError)?;
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn xwing_draft10_encapsulation_matches_published_vector() {
        // Appendix C, vector 1:
        // https://datatracker.ietf.org/doc/html/draft-connolly-cfrg-xwing-kem-10
        let secret_seed: [u8; 32] =
            hex::decode("7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26")
                .expect("decode secret seed")
                .try_into()
                .expect("secret seed length");
        let encapsulation_seed: [u8; 64] = hex::decode(
            "3cb1eea988004b93103cfb0aeefd2a686e01fa4a58e8a3639ca8a1e3f9ae57e\
             235b8cc873c23dc62b8d260169afa2f75ab916a58d974918835d25e6a435085b2",
        )
        .expect("decode encapsulation seed")
        .try_into()
        .expect("encapsulation seed length");
        let recipient = HybridKemSecretKey::from_xwing_seed(&secret_seed)
            .expect("derive recipient")
            .public_key();

        let encapsulation =
            encapsulate_xwing(&recipient, &encapsulation_seed).expect("encapsulate");
        let mut ciphertext = encapsulation.ml_kem_ciphertext;
        ciphertext.extend_from_slice(&encapsulation.ephemeral_x25519);

        assert_eq!(ciphertext.len(), XWING_CIPHERTEXT_BYTES);
        assert_eq!(
            hex::encode(Sha256::digest(&ciphertext)),
            "17cd532d657e44c897ca6583e548a5424fc70bf54f99515a4d2bcf99e3469f33"
        );
        assert_eq!(
            hex::encode(*encapsulation.shared_secret),
            "d2df0522128f09dd8e2c92b1e905c793d8f57a54c3da25861f10bf4ca613e384"
        );
    }
}
