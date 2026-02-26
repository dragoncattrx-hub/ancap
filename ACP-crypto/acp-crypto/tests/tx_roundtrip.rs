//! TX sign/verify, wire and hex roundtrip (chain_id, fee, RPC hex).
//! Outputs are address-based by default (TxOutput::to_address_v0_from_pubkey_wire).

use acp_crypto::{Mnemonic, Transaction, TxHex, TxInput, TxOutput, WalletIdentity};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn tx_sign_verify_wire_and_hex_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).unwrap();

    let recipient_wire = id.public().view.to_wire_bytes().unwrap();

    let mut tx = Transaction::new_unsigned(
        1001, // chain_id testnet
        vec![TxInput {
            prev_txid: [1u8; 32],
            vout: 0,
            amount: 200,
        }],
        vec![TxOutput::to_address_v0_from_pubkey_wire(123, &recipient_wire).unwrap()],
    );

    tx.sign(&id.spend).unwrap();
    tx.verify().unwrap();

    assert_eq!(tx.fee().unwrap(), 77);

    let wire = tx.to_wire().unwrap();
    let tx2 = Transaction::from_wire(&wire).unwrap();
    tx2.verify().unwrap();
    assert_eq!(tx.txid().unwrap(), tx2.txid().unwrap());

    let hex = TxHex::encode_tx(&tx).unwrap();
    let tx3 = TxHex::decode_tx(&hex).unwrap();
    tx3.verify().unwrap();
    assert_eq!(tx.txid().unwrap(), tx3.txid().unwrap());
}
