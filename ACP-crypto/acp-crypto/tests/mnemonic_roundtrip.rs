//! BIP39 mnemonic → seed roundtrip.

use acp_crypto::Mnemonic;

#[test]
fn mnemonic_to_seed_roundtrip() {
    let m = Mnemonic::generate_12().expect("mnemonic");
    let words = m.words();
    let m2 = Mnemonic::parse(&words).expect("parse");
    let s1 = m.to_seed("");
    let s2 = m2.to_seed("");
    assert_eq!(s1.as_bytes(), s2.as_bytes());
}
