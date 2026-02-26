//! Wire encode/decode roundtrip for public keys and signatures.

use acp_crypto::{
    Domain, Mnemonic, PublicKeyBytes, SignatureBytes, WalletIdentity, WireDecode, WireEncode,
};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn wire_pubkey_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).unwrap();
    let pubid = id.public();
    let pk = &pubid.spend;

    let w = PublicKeyBytes {
        ed25519: Some(pk.ed25519.0),
        dilithium: Some(pk.dilithium.0.clone()),
    };

    let bytes = w.to_wire().unwrap();
    let parsed = PublicKeyBytes::from_wire(&bytes).unwrap();
    assert_eq!(w, parsed);
}

#[cfg(feature = "pqc")]
#[test]
fn wire_signature_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).unwrap();
    let pk = id.public().spend;

    let msg = b"wire-test";
    let sig = id.spend.sign(Domain::TX, msg).unwrap();

    let w = SignatureBytes {
        ed25519: Some(sig.ed25519.0),
        dilithium: Some(sig.dilithium.0.clone()),
    };

    let bytes = w.to_wire().unwrap();
    let parsed = SignatureBytes::from_wire(&bytes).unwrap();
    assert_eq!(w, parsed);

    let _ = pk;
}
