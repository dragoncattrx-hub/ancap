//! Example: First transaction on the ACP network (ANCAP).
//!
//! Run (from the root of the repo, where there is acp-crypto and acp-wallet):
//!   cargo run -p acp-wallet --example first_tx
//!
//! Requirements: node is running, RPC to http://127.0.0.1:8545/rpc

use acp_crypto::{
    AddressV0, Block, BlockHeader, Mnemonic, Transaction, TxHex, TxInput, TxOutput,
    WalletIdentity,
};
use rand_core::OsRng;

const CHAIN_ID: u32 = 1001;
const GENESIS_AMOUNT: u64 = 1_000_000;
const FEE: u64 = 1;
const RPC_URL: &str = "http://127.0.0.1:8545/rpc";

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let m = Mnemonic::generate_12()?;
    let seed = m.to_seed("");
    let id = WalletIdentity::new_from_seed(&seed, OsRng)?;

    let receive_addr = id.receive_address_v0()?;
    let addr = AddressV0::decode(&receive_addr)?;

    println!("=== ACP First transaction ===\n");
    println!("Mnemonic (save!): {}", m.words());
    println!("Receive address: {}\n", receive_addr);

    // 1) Genesis tx: one input (conditional “coinbase”), one output to our address
    let genesis_tx = {
        let mut tx = Transaction::new_unsigned(
            CHAIN_ID,
            vec![TxInput {
                prev_txid: [0u8; 32],
                vout: 0,
                amount: GENESIS_AMOUNT,
            }],
            vec![TxOutput::to_address_v0(GENESIS_AMOUNT - FEE, &addr)],
        );
        tx.sign(&id.spend)?;
        tx
    };
    let genesis_txid = genesis_tx.txid()?;

    // 2) Genesis block
    let genesis_header = BlockHeader {
        version: 1,
        chain_id: CHAIN_ID,
        height: 1,
        prev_blockhash: [0u8; 32],
        merkle_root: [0u8; 32],
        time: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs(),
        bits: 0x1d00ffff,
        nonce: 0,
    };
    let genesis_block = Block::build(genesis_header, vec![genesis_tx.clone()])?;
    let genesis_block_hex = hex::encode(genesis_block.to_wire()?);

    println!("--- Step 1: submit genesis block (submitblock) ---");
    println!(
        "curl -s -X POST {RPC_URL} -H \"Content-Type: application/json\" -d '{{\"jsonrpc\":\"2.0\",\"method\":\"submitblock\",\"params\":{{\"block\":\"{genesis_block_hex}\"}},\"id\":1}}'\n"
    );

    // 3) Second transaction: spend the genesis output
    let tx2 = {
        let mut tx = Transaction::new_unsigned(
            CHAIN_ID,
            vec![TxInput {
                prev_txid: genesis_txid,
                vout: 0,
                amount: GENESIS_AMOUNT - FEE,
            }],
            vec![TxOutput::to_address_v0(GENESIS_AMOUNT - FEE - FEE, &addr)],
        );
        tx.sign(&id.spend)?;
        tx
    };
    let tx2_hex = TxHex::encode_tx(&tx2)?;

    println!("--- Step 2: send second tx to mempool (sendrawtransaction) ---");
    println!(
        "curl -s -X POST {RPC_URL} -H \"Content-Type: application/json\" -d '{{\"jsonrpc\":\"2.0\",\"method\":\"sendrawtransaction\",\"params\":{{\"tx\":\"{tx2_hex}\"}},\"id\":2}}'\n"
    );

    // 4) Block 2 with this tx
    let best_hash = genesis_block.header.blockhash();
    let block2_header = BlockHeader {
        version: 1,
        chain_id: CHAIN_ID,
        height: 2,
        prev_blockhash: best_hash,
        merkle_root: [0u8; 32],
        time: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)?
            .as_secs(),
        bits: 0x1d00ffff,
        nonce: 0,
    };
    let block2 = Block::build(block2_header, vec![tx2.clone()])?;
    let block2_hex = hex::encode(block2.to_wire()?);

    println!("--- Step 3: submit block 2 (submitblock) ---");
    println!(
        "curl -s -X POST {RPC_URL} -H \"Content-Type: application/json\" -d '{{\"jsonrpc\":\"2.0\",\"method\":\"submitblock\",\"params\":{{\"block\":\"{block2_hex}\"}},\"id\":3}}'\n"
    );

    println!("Order: 1 → 2 → 3. The node must be running (run-acp-docker-local.bat).");
    Ok(())
}
