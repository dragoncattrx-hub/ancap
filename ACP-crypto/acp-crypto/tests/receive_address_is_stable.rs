//! Receive address v0 is stable for the same identity (multiple calls return same string).

use acp_crypto::{Mnemonic, WalletIdentity};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn receive_address_is_stable_for_same_seed() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).unwrap();

    let a1 = id.receive_address_v0().unwrap();
    let a2 = id.receive_address_v0().unwrap();

    assert_eq!(a1, a2, "same identity must yield same address on repeated calls");
    assert!(a1.starts_with("acp1"));
}
