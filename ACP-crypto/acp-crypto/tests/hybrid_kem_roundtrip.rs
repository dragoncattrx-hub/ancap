#![cfg(feature = "pqc-envelope")]

use acp_crypto::{
    limits, CryptoError, HybridEnvelope, HybridKemSecretKey, Mnemonic, Seed,
    HYBRID_ENVELOPE_VERSION, HYBRID_KEM_SUITE, ML_KEM_768_CIPHERTEXT_BYTES,
    ML_KEM_768_PUBLIC_KEY_BYTES, XWING_PUBLIC_KEY_BYTES,
};
use sha2::{Digest, Sha256};

fn derive_recipient(fill: u8) -> HybridKemSecretKey {
    HybridKemSecretKey::from_seed(&Seed::from_bytes(vec![fill; 64])).expect("derive recipient")
}

#[test]
fn new_pqc_recovery_phrase_has_256_bits_of_entropy() {
    let mnemonic = Mnemonic::generate_24().expect("generate mnemonic");
    assert_eq!(mnemonic.words().split_whitespace().count(), 24);
    HybridKemSecretKey::from_seed(&mnemonic.to_seed("")).expect("derive recipient");
}

#[test]
fn xwing_draft10_key_generation_matches_published_vector() {
    // Appendix C, vector 1:
    // https://datatracker.ietf.org/doc/html/draft-connolly-cfrg-xwing-kem-10
    let seed: [u8; 32] =
        hex::decode("7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26")
            .expect("decode seed")
            .try_into()
            .expect("seed length");
    let public = HybridKemSecretKey::from_xwing_seed(&seed)
        .expect("derive X-Wing key")
        .public_key();
    let mut encoded = public.ml_kem_768.clone();
    encoded.extend_from_slice(&public.x25519);

    assert_eq!(encoded.len(), XWING_PUBLIC_KEY_BYTES);
    assert_eq!(
        hex::encode(Sha256::digest(&encoded)),
        "2e816deebcd76c5c80d0cd2d174478871658e8e2ff42bc9d4a6e486372e856bb"
    );
}

#[test]
fn hybrid_envelope_roundtrip_and_json_transport() {
    let recipient = derive_recipient(7);
    let public = recipient.public_key();
    let context = b"ACP/aeterna/dna-vault/v1";
    let plaintext = b"sensitive off-chain payload";

    let envelope = public.seal(plaintext, context).expect("seal");
    assert_eq!(envelope.version, HYBRID_ENVELOPE_VERSION);
    assert_eq!(envelope.suite, HYBRID_KEM_SUITE);
    assert_eq!(envelope.recipient_key_id, public.key_id());
    assert_eq!(
        envelope.ml_kem_768_ciphertext.len(),
        ML_KEM_768_CIPHERTEXT_BYTES
    );
    assert_ne!(envelope.ciphertext, plaintext);

    let public_json = public.to_json().expect("serialize public key");
    assert_eq!(
        acp_crypto::HybridKemPublicKey::from_json(&public_json).expect("parse public key"),
        public
    );

    let json = envelope.to_json(context).expect("serialize envelope");
    let decoded = HybridEnvelope::from_json(&json, context).expect("parse envelope");
    assert_eq!(recipient.open(&decoded, context).expect("open"), plaintext);
}

#[test]
fn seed_derivation_is_stable_and_domain_separated() {
    let first = derive_recipient(11).public_key();
    let restored = derive_recipient(11).public_key();
    let other = derive_recipient(12).public_key();

    assert_eq!(first, restored);
    assert_ne!(first, other);
    assert_ne!(first.x25519, [11u8; 32]);
    assert_eq!(first.ml_kem_768.len(), ML_KEM_768_PUBLIC_KEY_BYTES);
    assert_eq!(first.key_id_hex().len(), 64);
}

#[test]
fn context_recipient_and_ciphertext_are_authenticated() {
    let recipient = derive_recipient(21);
    let other = derive_recipient(22);
    let public = recipient.public_key();
    let context = b"ACP/orbital/sealed-payload/v1";
    let envelope = public.seal(b"classified", context).expect("seal");

    assert!(matches!(
        recipient.open(&envelope, b"ACP/orbital/other/v1"),
        Err(CryptoError::DecryptionFailed)
    ));
    assert!(matches!(
        other.open(&envelope, context),
        Err(CryptoError::DecryptionFailed)
    ));

    let mut low_order = envelope.clone();
    low_order.ephemeral_x25519 = [0u8; 32];
    assert!(matches!(
        recipient.open(&low_order, context),
        Err(CryptoError::DecryptionFailed)
    ));

    let mut wrong_key_id = envelope.clone();
    wrong_key_id.recipient_key_id[0] ^= 0x01;
    assert!(matches!(
        recipient.open(&wrong_key_id, context),
        Err(CryptoError::DecryptionFailed)
    ));

    let mut wrong_nonce = envelope.clone();
    wrong_nonce.nonce[0] ^= 0x01;
    assert!(matches!(
        recipient.open(&wrong_nonce, context),
        Err(CryptoError::DecryptionFailed)
    ));

    let mut wrong_kem_ciphertext = envelope.clone();
    wrong_kem_ciphertext.ml_kem_768_ciphertext[0] ^= 0x01;
    assert!(matches!(
        recipient.open(&wrong_kem_ciphertext, context),
        Err(CryptoError::DecryptionFailed)
    ));

    let mut tampered = envelope;
    let last = tampered.ciphertext.len() - 1;
    tampered.ciphertext[last] ^= 0x01;
    assert!(matches!(
        recipient.open(&tampered, context),
        Err(CryptoError::DecryptionFailed)
    ));
}

#[test]
fn downgrade_and_malformed_components_are_rejected() {
    let recipient = derive_recipient(31);
    let mut public = recipient.public_key();
    public.suite = "X25519-only".to_owned();
    assert!(matches!(
        public.seal(b"payload", b"context"),
        Err(CryptoError::UnsupportedCryptoSuite)
    ));

    let public = recipient.public_key();
    let mut envelope = public.seal(b"payload", b"context").expect("seal");
    envelope.version = 0;
    assert!(matches!(
        recipient.open(&envelope, b"context"),
        Err(CryptoError::UnsupportedCryptoSuite)
    ));

    envelope.version = HYBRID_ENVELOPE_VERSION;
    envelope.ml_kem_768_ciphertext.pop();
    assert!(matches!(
        recipient.open(&envelope, b"context"),
        Err(CryptoError::InvalidCiphertext)
    ));

    let mut truncated_public = public.clone();
    truncated_public.ml_kem_768.pop();
    assert!(matches!(
        truncated_public.seal(b"payload", b"context"),
        Err(CryptoError::InvalidKeyBytes)
    ));

    // Same-length ML-KEM bytes may still encapsulate; the original recipient
    // must not open an envelope sealed to a different public key.
    let mut altered_public = public;
    altered_public.ml_kem_768[0] ^= 0x01;
    let foreign = altered_public.seal(b"payload", b"context").expect("seal");
    assert_ne!(foreign.recipient_key_id, recipient.public_key().key_id());
    assert!(matches!(
        recipient.open(&foreign, b"context"),
        Err(CryptoError::DecryptionFailed)
    ));
}

#[test]
fn payload_and_context_limits_are_enforced() {
    let public = derive_recipient(41).public_key();
    let oversized_message = vec![0u8; limits::MAX_HYBRID_PLAINTEXT_BYTES + 1];
    assert!(matches!(
        public.seal(&oversized_message, b"context"),
        Err(CryptoError::MessageTooLarge)
    ));

    let oversized_context = vec![0u8; limits::MAX_HYBRID_CONTEXT_BYTES + 1];
    assert!(matches!(
        public.seal(b"payload", &oversized_context),
        Err(CryptoError::ContextTooLarge)
    ));

    let oversized_envelope_json = vec![b' '; limits::MAX_HYBRID_ENVELOPE_JSON_BYTES + 1];
    assert!(matches!(
        HybridEnvelope::from_json_bytes(&oversized_envelope_json, b"context"),
        Err(CryptoError::MessageTooLarge)
    ));

    let oversized_public_key_json =
        vec![b' '; limits::MAX_HYBRID_PUBLIC_KEY_JSON_BYTES + 1];
    assert!(matches!(
        acp_crypto::HybridKemPublicKey::from_json_bytes(&oversized_public_key_json),
        Err(CryptoError::MessageTooLarge)
    ));
}
