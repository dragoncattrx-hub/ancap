//! Build unsigned tx with address-based outputs (Recipient::AddressV0).

use acp_crypto::{AddressV0, Transaction, TxInput, TxOutput};

/// Build unsigned tx where outputs are address-based (Recipient::AddressV0).
pub fn build_tx_to_address_v0(
    chain_id: u32,
    inputs: Vec<TxInput>,
    outputs: Vec<(u64, AddressV0)>,
) -> Transaction {
    let outs = outputs
        .into_iter()
        .map(|(amount, addr)| TxOutput::to_address_v0(amount, &addr))
        .collect();

    Transaction::new_unsigned(chain_id, inputs, outs)
}
