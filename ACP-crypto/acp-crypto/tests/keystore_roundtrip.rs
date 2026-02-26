//! Keystore encrypt/decrypt + hybrid key roundtrip (mnemonic → seed → key → keystore → decrypt → key → sign/verify).

use acp_crypto::{Domain, KeystoreJson, Mnemonic, HybridSecretKey};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn keystore_encrypt_decrypt_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");

    let sk = HybridSecretKey::from_seed(&seed, OsRng).unwrap();
    let pk = sk.public_key();

    let ks_plain = sk.to_keystore_plaintext(&seed).unwrap();
    let password = "correct horse battery staple";
    let enc = KeystoreJson::encrypt(password, &ks_plain, OsRng).unwrap();
    let dec = enc.decrypt(password).unwrap();

    assert_eq!(dec.v, 2);
    assert_eq!(dec.ed25519_seed32, ks_plain.ed25519_seed32);
    assert_eq!(dec.dilithium_pk, ks_plain.dilithium_pk);
    assert_eq!(dec.dilithium_sk, ks_plain.dilithium_sk);

    let sk_restored = HybridSecretKey::from_keystore(&dec).unwrap();
    let pk_restored = sk_restored.public_key();

    assert_eq!(pk.ed25519.0, pk_restored.ed25519.0);
    #[cfg(feature = "pqc")]
    assert_eq!(pk.dilithium.0, pk_restored.dilithium.0);

    let msg = b"hello keystore";
    let sig = sk_restored.sign(Domain::TX, msg).unwrap();
    pk_restored.verify(Domain::TX, msg, &sig).unwrap();
}

#[cfg(feature = "pqc")]
#[test]
fn keystore_to_string_pretty_from_str_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");
    let sk = HybridSecretKey::from_seed(&seed, OsRng).unwrap();
    let ks_plain = sk.to_keystore_plaintext(&seed).unwrap();
    let enc = KeystoreJson::encrypt("pass", &ks_plain, OsRng).unwrap();

    let s = enc.to_string_pretty().unwrap();
    let enc2 = KeystoreJson::from_str_with_limits(&s).unwrap();
    let dec = enc2.decrypt("pass").unwrap();
    assert_eq!(dec.ed25519_seed32, ks_plain.ed25519_seed32);
}
