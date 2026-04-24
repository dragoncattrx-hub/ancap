//! Parameters of the ACP v1.3 protocol (ANCAP AI-State token).
//!
//! Monetary model, Genesis distribution, emission limits.
//! Used in Genesis generation, emission calculations and rule validation.

/// There are so many minimal units in one whole ACP (1 ACP = 10^8 units). Amounts in transactions and commissions are in units.
pub const UNITS_PER_ACP: u64 = 100_000_000; // 10^8

/// Base supply at the time of Genesis (ACP).
pub const BASE_SUPPLY_ACP: u64 = 210_000_000;

/// Nominal annual distribution rate (5% of base supply). Not mint: payments from Validator Emission Reserve.
pub const ANNUAL_INFLATION_PCT: u8 = 5;

/// Annual payment from the reserve to validators/delegators (ACP). Not a new mint; after ~10 years the reserve is exhausted, income comes from commissions.
pub const ANNUAL_EMISSION_ACP: u64 = 10_500_000;

// --- Genesis distribution (percentage shares) ---

/// Creator's share (vesting 7 years, non-stakeable in lock).
pub const GENESIS_PCT_CREATOR: u8 = 33;
/// Share Validator Emission Reserve.
pub const GENESIS_PCT_VALIDATOR_RESERVE: u8 = 50;
/// Share of Public & Liquidity.
pub const GENESIS_PCT_PUBLIC: u8 = 12;
/// The fate of Ecosystem Grants.
pub const GENESIS_PCT_ECOSYSTEM: u8 = 5;

// --- Genesis in ACP (absolute amounts) ---

pub const GENESIS_ACP_CREATOR: u64 = 69_300_000;
pub const GENESIS_ACP_VALIDATOR_RESERVE: u64 = 105_000_000;
pub const GENESIS_ACP_PUBLIC: u64 = 25_200_000;
pub const GENESIS_ACP_ECOSYSTEM: u64 = 10_500_000;

// --- Creator's Vesting ---

/// Cliff in months before the start of linear unlocking.
pub const CREATOR_VESTING_CLIFF_MONTHS: u32 = 12;
/// Linear unlocking in months after cliff.
pub const CREATOR_VESTING_LINEAR_MONTHS: u32 = 72;
/// Full vesting period in months (cliff + linear).
pub const CREATOR_VESTING_TOTAL_MONTHS: u32 = 12 + 72; // 84 = 7 years
/// ACP per month for linear unlocking.
pub const CREATOR_VESTING_PER_MONTH: u64 = 962_500;

// --- PoS consensus (reference for implementation) ---

/// Maximum total staked share per validator (percentage).
pub const STAKE_CAP_PCT: u8 = 5;
/// Minimum slashing (percentage).
pub const SLASHING_MIN_PCT: u8 = 5;
/// Maximum slashing (percentage).
pub const SLASHING_MAX_PCT: u8 = 10;
/// Unbonding in days.
pub const UNBONDING_DAYS: u16 = 21;

// --- Governance (reference) ---

/// Voting quorum (percentage).
pub const GOVERNANCE_QUORUM_PCT: u8 = 15;
/// Majority to accept (percentage).
pub const GOVERNANCE_MAJORITY_PCT: u8 = 51;
/// Voting period in days.
pub const GOVERNANCE_VOTING_DAYS: u8 = 7;
/// Execution delay in hours.
pub const GOVERNANCE_EXECUTION_DELAY_HOURS: u16 = 48;
/// Offer deposit in ACP.
pub const GOVERNANCE_PROPOSAL_DEPOSIT_ACP: u64 = 5_000;

// --- Blocks ---

/// Target block time (seconds). Balance finalization speed and load on validators.
pub const TARGET_BLOCK_TIME_SEC: u32 = 5;
/// Maximum block size (bytes). 2 MB - throughput, state growth control, anti-spam. Can be regulated through governance.
pub const MAX_BLOCK_BYTES: u32 = 2 * 1024 * 1024; // 2 MB

// --- Staking ---

/// Minimum stake for a validator (ACP). Economic responsibility, cutting off spam validators.
pub const MIN_VALIDATOR_STAKE_ACP: u64 = 50_000;
/// Minimum delegation (ACP). Availability of participation to a wide audience.
pub const MIN_DELEGATION_ACP: u64 = 100;
/// Epoch duration in seconds (6 hours). Rewards, slashing, validator set update.
pub const EPOCH_DURATION_SEC: u32 = 6 * 3600; // 6 hours
/// Epoch length in blocks with a target block time of 5 seconds (4320 blocks ≈ 6 hours).
pub const EPOCH_BLOCKS: u32 = 4320;

// --- Transactions ---

/// The maximum number of inputs or outputs in one transaction (protocol constant).
pub const MAX_TX_INPUTS_OUTPUTS: u32 = 10_000;

// --- Network and commissions ---

/// Default Chain ID (mainnet). Replay protection; the node can override it in the config.
pub const DEFAULT_CHAIN_ID: u32 = 1001;
/// Minimum transaction fee in units. 0.00000100 ACP = 100 units. Anti-spam.
pub const MIN_FEE_UNITS: u64 = 100; // 0.00000100 ACP

// --- Token (listing, wallets, API) ---

pub const TOKEN_NAME: &str = "ACP";
pub const TOKEN_TICKER: &str = "ACP";
/// Decimals to display (1 ACP = 10^DECIMALS smallest units).
pub const TOKEN_DECIMALS: u8 = 8;
/// Smallest unit in ACP: 10⁻⁸ ACP.
pub const SMALLEST_UNIT_ACP: f64 = 0.000_000_01;

// --- Keys and derivation ---

/// Mnemonic: BIP-39.
pub const MNEMONIC_STANDARD: &str = "BIP-39";
/// Derivation path (chain index can be fixed after SLIP-44). Compatible with hardware wallets.
pub const DERIVATION_PATH: &str = "m/44'/ACP'/0'/0/0";

// --- Chain ID (string names to display) ---

pub const CHAIN_ID_MAINNET: &str = "acp-mainnet-1";
pub const CHAIN_ID_TESTNET: &str = "acp-testnet-1";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn genesis_sum_matches_base_supply() {
        let sum = GENESIS_ACP_CREATOR
            + GENESIS_ACP_VALIDATOR_RESERVE
            + GENESIS_ACP_PUBLIC
            + GENESIS_ACP_ECOSYSTEM;
        assert_eq!(sum, BASE_SUPPLY_ACP, "Genesis allocation must sum to BASE_SUPPLY_ACP");
    }

    #[test]
    fn genesis_pct_sums_100() {
        let pct = GENESIS_PCT_CREATOR as u32
            + GENESIS_PCT_VALIDATOR_RESERVE as u32
            + GENESIS_PCT_PUBLIC as u32
            + GENESIS_PCT_ECOSYSTEM as u32;
        assert_eq!(pct, 100, "Genesis percentages must sum to 100");
    }

    #[test]
    fn annual_emission_is_5_pct_of_base() {
        let expected = BASE_SUPPLY_ACP * ANNUAL_INFLATION_PCT as u64 / 100;
        assert_eq!(ANNUAL_EMISSION_ACP, expected, "Annual emission must be 5% of base supply");
    }

    #[test]
    fn creator_vesting_linear_total() {
        let from_linear = CREATOR_VESTING_PER_MONTH * CREATOR_VESTING_LINEAR_MONTHS as u64;
        assert_eq!(
            from_linear, GENESIS_ACP_CREATOR,
            "Creator vesting per month * linear months must equal creator allocation"
        );
    }
}
