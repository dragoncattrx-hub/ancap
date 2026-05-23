use acp_mobile_ffi::{
    acp_address_from_keystore, acp_create_wallet, acp_validate_address, CreatedWallet,
};

#[test]
fn create_wallet_roundtrip_via_keystore() {
    let CreatedWallet {
        address,
        mnemonic: _mnemonic,
        keystore_json,
    } = acp_create_wallet().expect("create");
    assert!(address.starts_with("acp1"));
    assert!(acp_validate_address(address.clone()));
    let again = acp_address_from_keystore(keystore_json).expect("keystore derive");
    assert_eq!(again, address);
}
