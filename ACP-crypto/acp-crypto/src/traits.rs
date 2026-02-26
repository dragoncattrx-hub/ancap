//! Unified Signer / Verifier interface.

use crate::{Domain, Result};

/// Signing capability: produce signatures under a domain.
pub trait Signer {
    /// Public key type.
    type PublicKey: Clone + Send + Sync + 'static;
    /// Signature type.
    type Signature: Clone + Send + Sync + 'static;

    /// Returns the public key.
    fn public_key(&self) -> Self::PublicKey;

    /// Signs `msg` under `domain`.
    fn sign(&self, domain: Domain, msg: &[u8]) -> Result<Self::Signature>;
}

/// Verification capability: verify signatures.
pub trait Verifier {
    /// Public key type.
    type PublicKey: Clone + Send + Sync + 'static;
    /// Signature type.
    type Signature: Clone + Send + Sync + 'static;

    /// Verifies `sig` over `msg` under `domain`.
    fn verify(pk: &Self::PublicKey, domain: Domain, msg: &[u8], sig: &Self::Signature) -> Result<()>;
}
