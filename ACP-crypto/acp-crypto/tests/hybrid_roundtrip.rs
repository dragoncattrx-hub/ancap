//! Roundtrip: sign with hybrid key, verify with hybrid public key.

#[cfg(feature = "pqc")]
#[test]
fn hybrid_sign_verify_roundtrip() {
    use acp_crypto::{Domain, HybridSecretKey};
    use rand_core::OsRng;

    let mut rng = OsRng;
    let sk = HybridSecretKey::generate(&mut rng);
    let pk = sk.public_key();

    let msg = b"hello acp";
    let sig = sk.sign(Domain::TX, msg).expect("sign");

    pk.verify(Domain::TX, msg, &sig).expect("verify");
}
