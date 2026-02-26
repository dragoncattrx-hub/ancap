//! Backward compat: decode legacy tx-wire 0x01 (v0.30 output layout).

use acp_crypto::{Mnemonic, Recipient, Transaction, TxInput, TxOutput, WalletIdentity};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn decode_legacy_tx_wire_v1_outputs() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).unwrap();

    let recipient_wire = id.public().view.to_wire_bytes().unwrap();

    let mut tx = Transaction::new_unsigned(
        1001,
        vec![TxInput {
            prev_txid: [1u8; 32],
            vout: 0,
            amount: 200,
        }],
        vec![TxOutput {
            amount: 123,
            recipient: Recipient::PubkeyWire(recipient_wire),
        }],
    );
    tx.sign(&id.spend).unwrap();

    let mut legacy_sb = Vec::new();
    legacy_sb.push(tx.version);
    legacy_sb.extend_from_slice(&tx.chain_id.to_le_bytes());
    legacy_sb.extend_from_slice(&tx.lock_time.to_le_bytes());

    legacy_sb.extend_from_slice(&(1u16).to_le_bytes());
    legacy_sb.extend_from_slice(&[1u8; 32]);
    legacy_sb.extend_from_slice(&0u32.to_le_bytes());
    legacy_sb.extend_from_slice(&200u64.to_le_bytes());

    legacy_sb.extend_from_slice(&(1u16).to_le_bytes());
    legacy_sb.extend_from_slice(&123u64.to_le_bytes());
    if let Recipient::PubkeyWire(w) = &tx.outputs[0].recipient {
        legacy_sb.extend_from_slice(&(w.len() as u16).to_le_bytes());
        legacy_sb.extend_from_slice(w);
    } else {
        panic!("expected pubkey wire");
    }

    legacy_sb.extend_from_slice(&(tx.sender_pubkey_wire.len() as u16).to_le_bytes());
    legacy_sb.extend_from_slice(&tx.sender_pubkey_wire);

    let legacy_body = &legacy_sb[1 + 4 + 4..];
    let mut wire = Vec::new();
    wire.push(0x01);
    wire.push(tx.version);
    wire.extend_from_slice(&tx.chain_id.to_le_bytes());
    wire.extend_from_slice(&tx.lock_time.to_le_bytes());
    wire.extend_from_slice(&(legacy_body.len() as u32).to_le_bytes());
    wire.extend_from_slice(legacy_body);
    wire.extend_from_slice(&(tx.signature_wire.len() as u32).to_le_bytes());
    wire.extend_from_slice(&tx.signature_wire);

    let decoded = Transaction::from_wire(&wire).unwrap();
    decoded.verify().unwrap();
}
