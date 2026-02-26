//! Dilithium (ML-DSA) layer; enabled with feature `pqc`.

use crate::limits;
use crate::{CryptoError, Domain, Result};
use pqcrypto_dilithium::dilithium2;
use pqcrypto_traits::sign::{PublicKey as _, SecretKey as _, SignedMessage as _};
use serde::{Deserialize, Serialize};

/// Dilithium public key.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct DilithiumPublicKey(pub Vec<u8>);

/// Dilithium secret key (pqcrypto type has no Zeroize; keep in keystore only).
pub struct DilithiumSecretKey {
    sk: dilithium2::SecretKey,
}

/// Dilithium signature.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct DilithiumSignature(pub Vec<u8>);

impl DilithiumSecretKey {
    /// Signs `msg` under `domain`.
    pub fn sign(&self, domain: Domain, msg: &[u8]) -> Result<DilithiumSignature> {
        let dm = domain.apply(msg)?;
        let signed = dilithium2::sign(&dm, &self.sk);
        let sig_only = signed.as_bytes()[..(signed.as_bytes().len() - dm.len())].to_vec();
        Ok(DilithiumSignature(sig_only))
    }

    /// Export secret key bytes (for keystore).
    pub fn to_bytes(&self) -> Vec<u8> {
        self.sk.as_bytes().to_vec()
    }

    /// Import secret key from bytes; enforces size limit.
    pub fn from_bytes(b: &[u8]) -> Result<Self> {
        crate::bytes::ensure_max(
            b,
            limits::MAX_PUBKEY_BYTES,
            CryptoError::InvalidKeyBytes,
        )?;
        let sk = dilithium2::SecretKey::from_bytes(b).map_err(|_| CryptoError::InvalidKeyBytes)?;
        Ok(Self { sk })
    }
}

impl DilithiumPublicKey {
    /// Verifies `sig` over `msg` under `domain`.
    pub fn verify(&self, domain: Domain, msg: &[u8], sig: &DilithiumSignature) -> Result<()> {
        let dm = domain.apply(msg)?;
        let mut signed = Vec::with_capacity(sig.0.len() + dm.len());
        signed.extend_from_slice(&sig.0);
        signed.extend_from_slice(&dm);

        let pk = dilithium2::PublicKey::from_bytes(&self.0)
            .map_err(|_| CryptoError::InvalidKeyBytes)?;
        let signed_msg = dilithium2::SignedMessage::from_bytes(&signed)
            .map_err(|_| CryptoError::InvalidSignatureBytes)?;
        dilithium2::open(&signed_msg, &pk).map_err(|_| CryptoError::VerifyFailed)?;
        Ok(())
    }
}

/// Generates a Dilithium keypair (store both pk and sk in keystore).
pub fn keypair() -> (DilithiumPublicKey, DilithiumSecretKey) {
    let (pk, sk) = dilithium2::keypair();
    (
        DilithiumPublicKey(pk.as_bytes().to_vec()),
        DilithiumSecretKey { sk },
    )
}
