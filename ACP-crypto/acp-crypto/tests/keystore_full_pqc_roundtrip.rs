//! Full PQC keystore roundtrip: mnemonic → seed → keys → keystore → decrypt → restore → sign/verify.

use acp_crypto::{Domain, HybridSecretKey, KeystoreJson, Mnemonic};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn full_pqc_keystore_roundtrip_sign_verify() {
    // 1) Create mnemonic + seed
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");

    // 2) Create keys from seed (ed25519 deterministic + pqc random)
    let sk1 = HybridSecretKey::from_seed(&seed, OsRng).unwrap();
    let pk1 = sk1.public_key();

    // 3) Serialize to keystore plaintext and encrypt
    let ks_plain = sk1.to_keystore_plaintext(&seed).unwrap();
    let password = "correct horse battery staple";
    let enc = KeystoreJson::encrypt(password, &ks_plain, OsRng).unwrap();

    // 4) Decrypt and restore keys
    let dec_plain = enc.decrypt(password).unwrap();
    let sk2 = HybridSecretKey::from_keystore(&dec_plain).unwrap();
    let pk2 = sk2.public_key();

    // 5) pk must match (including pqc pk)
    assert_eq!(
        serde_json::to_string(&pk1).unwrap(),
        serde_json::to_string(&pk2).unwrap()
    );

    // 6) Ensure signing works after restore
    let msg = b"acp-keystore-roundtrip";
    let sig = sk2.sign(Domain::TX, msg).unwrap();
    pk2.verify(Domain::TX, msg, &sig).unwrap();
}
