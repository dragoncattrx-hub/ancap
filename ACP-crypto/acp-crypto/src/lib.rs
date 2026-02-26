#![forbid(unsafe_code)]
#![allow(missing_docs)] // relax for external/build use; enable deny(missing_docs) when documenting

//! ACP Crypto v0.25 — ANCAP AI-State token
//!
//! - BIP39 mnemonic + seed; wallet identity (spend/view/audit)
//! - Hybrid signatures: Ed25519 + Dilithium
//! - Keystore v2 (single key) + v3 (identity)
//! - Wire format (PublicKeyBytes, SignatureBytes) for TX/network
//! - Merkle root (txids), block skeleton, RPC txid/blockhash HEX
//! - Address v0 (bech32 acp1..., pubkey_hash20)

pub mod address;
pub mod block;
pub mod bytes;
pub mod protocol_params;
pub mod difficulty;
pub mod domain;
pub mod ed25519;
pub mod error;
pub mod hybrid;
pub mod identity;
pub mod kdf;
pub mod keystore;
pub mod limits;
pub mod merkle;
pub mod rpc_hex;
pub mod seed;
pub mod traits;
pub mod tx;
pub mod wire;

#[cfg(feature = "pqc")]
pub mod dilithium;

pub use crate::domain::Domain;
pub use crate::error::{CryptoError, Result};
pub use crate::hybrid::{HybridPublicKey, HybridSecretKey, HybridSignature};
pub use crate::identity::{KeyRole, WalletIdentity, WalletPublicIdentity};
pub use crate::keystore::{Keystore, KeystoreCiphertext, KeystoreJson, KeystoreV3};
pub use crate::seed::{Mnemonic, Seed};
pub use crate::traits::{Signer, Verifier};
pub use crate::address::{address_v0_from_pubkey_wire, AddressV0, HRP};
pub use crate::block::{Block, BlockHash, BlockHeader};
pub use crate::difficulty::difficulty_from_bits;
pub use crate::merkle::merkle_root_txids;
pub use crate::rpc_hex::{Hex, TxHex};
pub use crate::protocol_params::{
    ANNUAL_EMISSION_ACP, ANNUAL_INFLATION_PCT, BASE_SUPPLY_ACP, CHAIN_ID_MAINNET, CHAIN_ID_TESTNET,
    CREATOR_VESTING_CLIFF_MONTHS, CREATOR_VESTING_LINEAR_MONTHS, CREATOR_VESTING_PER_MONTH,
    CREATOR_VESTING_TOTAL_MONTHS, DEFAULT_CHAIN_ID, DERIVATION_PATH, EPOCH_BLOCKS, EPOCH_DURATION_SEC,
    GENESIS_ACP_CREATOR, GENESIS_ACP_ECOSYSTEM, GENESIS_ACP_PUBLIC, GENESIS_ACP_VALIDATOR_RESERVE,
    GENESIS_PCT_CREATOR, GENESIS_PCT_ECOSYSTEM, GENESIS_PCT_PUBLIC, GENESIS_PCT_VALIDATOR_RESERVE,
    GOVERNANCE_EXECUTION_DELAY_HOURS, GOVERNANCE_MAJORITY_PCT, GOVERNANCE_PROPOSAL_DEPOSIT_ACP,
    GOVERNANCE_QUORUM_PCT, GOVERNANCE_VOTING_DAYS, MAX_BLOCK_BYTES, MAX_TX_INPUTS_OUTPUTS,
    MIN_DELEGATION_ACP, MIN_FEE_UNITS, MIN_VALIDATOR_STAKE_ACP, MNEMONIC_STANDARD,
    SLASHING_MAX_PCT, SLASHING_MIN_PCT, STAKE_CAP_PCT, TARGET_BLOCK_TIME_SEC, TOKEN_DECIMALS,
    TOKEN_NAME, TOKEN_TICKER, UNBONDING_DAYS, UNITS_PER_ACP,
};
pub use crate::tx::{Recipient, TxId, Transaction, TxInput, TxOutput};
pub use crate::wire::{PublicKeyBytes, SignatureBytes, WireDecode, WireEncode};
