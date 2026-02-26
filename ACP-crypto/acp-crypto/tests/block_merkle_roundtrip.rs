//! Block build/validate and wire roundtrip (merkle root, chain_id).
//! Outputs are address-based by default.

use acp_crypto::{
    Block, BlockHeader, Mnemonic, Transaction, TxInput, TxOutput, WalletIdentity,
};
use rand_core::OsRng;

#[cfg(feature = "pqc")]
#[test]
fn block_build_validate_wire_roundtrip() {
    let m = Mnemonic::generate_12().unwrap();
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng).unwrap();

    let recipient_wire = id.public().view.to_wire_bytes().unwrap();

    // tx1
    let mut tx1 = Transaction::new_unsigned(
        1001,
        vec![TxInput {
            prev_txid: [1u8; 32],
            vout: 0,
            amount: 200,
        }],
        vec![TxOutput::to_address_v0_from_pubkey_wire(100, &recipient_wire).unwrap()],
    );
    tx1.sign(&id.spend).unwrap();

    // tx2
    let mut tx2 = Transaction::new_unsigned(
        1001,
        vec![TxInput {
            prev_txid: [2u8; 32],
            vout: 0,
            amount: 300,
        }],
        vec![TxOutput::to_address_v0_from_pubkey_wire(250, &recipient_wire).unwrap()],
    );
    tx2.sign(&id.spend).unwrap();

    let header = BlockHeader {
        version: 1,
        chain_id: 1001,
        height: 1,
        prev_blockhash: [0u8; 32],
        merkle_root: [0u8; 32], // will be computed
        time: 1_700_000_000,
        bits: 0,
        nonce: 0,
    };

    let block = Block::build(header, vec![tx1, tx2]).unwrap();
    block.validate().unwrap();

    // wire roundtrip
    let w = block.to_wire().unwrap();
    let b2 = Block::from_wire(&w).unwrap();
    b2.validate().unwrap();

    assert_eq!(block.header.blockhash(), b2.header.blockhash());
}
