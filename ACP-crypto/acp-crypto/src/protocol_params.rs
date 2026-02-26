//! Параметры протокола ACP v1.3 (ANCAP AI-State token).
//!
//! Денежная модель, распределение Genesis, лимиты эмиссии.
//! Используются при генерации Genesis, расчёте эмиссии и валидации правил.

/// В одной целой ACP столько минимальных единиц (1 ACP = 10^8 units). Суммы в транзакциях и комиссии — в единицах.
pub const UNITS_PER_ACP: u64 = 100_000_000; // 10^8

/// Base supply на момент Genesis (ACP).
pub const BASE_SUPPLY_ACP: u64 = 210_000_000;

/// Номинальная годовая ставка распределения (5% от base supply). Не минт: выплаты из Validator Emission Reserve.
pub const ANNUAL_INFLATION_PCT: u8 = 5;

/// Годовая выплата из резерва валидаторам/делегаторам (ACP). Не новый минт; после ~10 лет резерв исчерпан, доход — из комиссий.
pub const ANNUAL_EMISSION_ACP: u64 = 10_500_000;

// --- Распределение Genesis (доли в процентах) ---

/// Доля создателя (vesting 7 лет, non-stakeable в lock).
pub const GENESIS_PCT_CREATOR: u8 = 33;
/// Доля Validator Emission Reserve.
pub const GENESIS_PCT_VALIDATOR_RESERVE: u8 = 50;
/// Доля Public & Liquidity.
pub const GENESIS_PCT_PUBLIC: u8 = 12;
/// Доля Ecosystem Grants.
pub const GENESIS_PCT_ECOSYSTEM: u8 = 5;

// --- Genesis в ACP (абсолютные суммы) ---

pub const GENESIS_ACP_CREATOR: u64 = 69_300_000;
pub const GENESIS_ACP_VALIDATOR_RESERVE: u64 = 105_000_000;
pub const GENESIS_ACP_PUBLIC: u64 = 25_200_000;
pub const GENESIS_ACP_ECOSYSTEM: u64 = 10_500_000;

// --- Вестинг создателя ---

/// Cliff в месяцах перед началом линейной разблокировки.
pub const CREATOR_VESTING_CLIFF_MONTHS: u32 = 12;
/// Линейная разблокировка в месяцах после cliff.
pub const CREATOR_VESTING_LINEAR_MONTHS: u32 = 72;
/// Полный срок вестинга в месяцах (cliff + linear).
pub const CREATOR_VESTING_TOTAL_MONTHS: u32 = 12 + 72; // 84 = 7 лет
/// ACP в месяц при линейной разблокировке.
pub const CREATOR_VESTING_PER_MONTH: u64 = 962_500;

// --- Консенсус PoS (референс для реализации) ---

/// Максимальная доля total staked на одного валидатора (проценты).
pub const STAKE_CAP_PCT: u8 = 5;
/// Минимальный slashing (проценты).
pub const SLASHING_MIN_PCT: u8 = 5;
/// Максимальный slashing (проценты).
pub const SLASHING_MAX_PCT: u8 = 10;
/// Unbonding в днях.
pub const UNBONDING_DAYS: u16 = 21;

// --- Governance (референс) ---

/// Кворум голосования (проценты).
pub const GOVERNANCE_QUORUM_PCT: u8 = 15;
/// Большинство для принятия (проценты).
pub const GOVERNANCE_MAJORITY_PCT: u8 = 51;
/// Период голосования в днях.
pub const GOVERNANCE_VOTING_DAYS: u8 = 7;
/// Задержка исполнения в часах.
pub const GOVERNANCE_EXECUTION_DELAY_HOURS: u16 = 48;
/// Депозит за предложение в ACP.
pub const GOVERNANCE_PROPOSAL_DEPOSIT_ACP: u64 = 5_000;

// --- Блоки ---

/// Целевое время блока (секунды). Баланс скорости финализации и нагрузки на валидаторов.
pub const TARGET_BLOCK_TIME_SEC: u32 = 5;
/// Максимальный размер блока (байты). 2 MB — throughput, контроль роста state, анти-спам. Может регулироваться через governance.
pub const MAX_BLOCK_BYTES: u32 = 2 * 1024 * 1024; // 2 MB

// --- Стейкинг ---

/// Минимальный стейк для валидатора (ACP). Экономическая ответственность, отсечение спам-валидаторов.
pub const MIN_VALIDATOR_STAKE_ACP: u64 = 50_000;
/// Минимальное делегирование (ACP). Доступность участия для широкой аудитории.
pub const MIN_DELEGATION_ACP: u64 = 100;
/// Длительность эпохи в секундах (6 часов). Награды, slashing, обновление набора валидаторов.
pub const EPOCH_DURATION_SEC: u32 = 6 * 3600; // 6 hours
/// Длина эпохи в блоках при целевом времени блока 5 сек (4320 блоков ≈ 6 ч).
pub const EPOCH_BLOCKS: u32 = 4320;

// --- Транзакции ---

/// Максимальное количество inputs или outputs в одной транзакции (protocol constant).
pub const MAX_TX_INPUTS_OUTPUTS: u32 = 10_000;

// --- Сеть и комиссии ---

/// Chain ID по умолчанию (mainnet). Защита от replay; нода может переопределить в конфиге.
pub const DEFAULT_CHAIN_ID: u32 = 1001;
/// Минимальная комиссия за транзакцию в единицах. 0.00000100 ACP = 100 units. Анти-спам.
pub const MIN_FEE_UNITS: u64 = 100; // 0.00000100 ACP

// --- Токен (листинг, кошельки, API) ---

pub const TOKEN_NAME: &str = "ACP";
pub const TOKEN_TICKER: &str = "ACP";
/// Decimals для отображения (1 ACP = 10^DECIMALS наименьших единиц).
pub const TOKEN_DECIMALS: u8 = 8;
/// Наименьшая единица в ACP: 10⁻⁸ ACP.
pub const SMALLEST_UNIT_ACP: f64 = 0.000_000_01;

// --- Ключи и деривация ---

/// Мнемоника: BIP-39.
pub const MNEMONIC_STANDARD: &str = "BIP-39";
/// Деривационный путь (chain index можно зафиксировать после SLIP-44). Совместимость с аппаратными кошельками.
pub const DERIVATION_PATH: &str = "m/44'/ACP'/0'/0/0";

// --- Chain ID (строковые имена для отображения) ---

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
