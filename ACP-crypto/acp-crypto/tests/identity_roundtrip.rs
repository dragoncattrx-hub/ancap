//! Identity ↔ KeystoreV3 roundtrip.

use acp_crypto::{KeystoreJson, KeystoreV3, Mnemonic, WalletIdentity};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn identity_keystore_v3_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let master_seed = m.to_seed("");

    let id1 = WalletIdentity::new_from_seed(&master_seed, OsRng).unwrap();
    let pub1 = id1.public();

    let ks3 = id1.to_keystore_v3(&master_seed).unwrap();
    let enc = KeystoreJson::encrypt_v3("pass", &ks3, OsRng).unwrap();

    let dec = enc.decrypt_v3("pass").unwrap();
    let id2 = WalletIdentity::from_keystore_v3(&dec).unwrap();
    let pub2 = id2.public();

    assert_eq!(
        serde_json::to_string(&pub1).unwrap(),
        serde_json::to_string(&pub2).unwrap()
    );
}

/// Plain JSON round-trip (as used by genesis_wallets → ecosystem.keystore.json → transfer).
#[cfg(feature = "pqc")]
#[test]
fn identity_keystore_v3_plain_json_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let master_seed = m.to_seed("");

    let id1 = WalletIdentity::new_from_seed(&master_seed, OsRng).unwrap();
    let addr1 = id1.receive_address_v0().unwrap();

    let ks3 = id1.to_keystore_v3(&master_seed).unwrap();
    let json = serde_json::to_string_pretty(&ks3).unwrap();
    let ks3_restored: KeystoreV3 = serde_json::from_str(&json).unwrap();
    let id2 = WalletIdentity::from_keystore_v3(&ks3_restored).unwrap();
    let addr2 = id2.receive_address_v0().unwrap();

    assert_eq!(addr1, addr2, "receive_address_v0 must match after KeystoreV3 JSON round-trip");
}
