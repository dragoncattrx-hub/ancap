use thiserror::Error;

/// Result type for crypto operations.
pub type Result<T> = std::result::Result<T, CryptoError>;

/// Crypto layer errors.
#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("invalid key bytes")]
    InvalidKeyBytes,

    #[error("invalid signature bytes")]
    InvalidSignatureBytes,

    #[error("signature verification failed")]
    VerifyFailed,

    #[error("serialization error: {0}")]
    Serialization(String),

    #[error("domain separation error")]
    DomainError,

    #[error("pqc is disabled at compile time")]
    PqcDisabled,

    #[error("pqc error: {0}")]
    PqcError(String),

    #[error("mnemonic error: {0}")]
    Mnemonic(String),

    #[error("keystore error: {0}")]
    Keystore(String),

    #[error("keystore is too large")]
    KeystoreTooLarge,

    #[error("keystore ciphertext too large")]
    KeystoreCiphertextTooLarge,
}
