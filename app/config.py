"""Application configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Settings loaded from environment."""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ANCAP Core API"
    debug: bool = False

    # Database (async URL for app; use postgresql:// without +asyncpg for Alembic)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ancap"

    # Auth
    secret_key: str = "change-me-in-production-use-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Pagination
    default_page_limit: int = 50
    max_page_limit: int = 200

    # Circuit breaker (MVP: hardcoded)
    circuit_breaker_n_runs: int = 20
    circuit_breaker_min_return_pct: float = -5.0
    circuit_breaker_k_killed: int = 5

    # Quarantine: agents created < N hours ago are limited to M orders per day
    quarantine_hours: int = 24
    quarantine_max_orders_per_day: int = 3

    # L3: Proof-of-Agent
    registration_max_agents_per_day: int = 100  # 0 = no limit
    stake_to_activate_amount: str = "0"  # "0" = optional; e.g. "100" requires 100 ACP stake to activate
    stake_to_activate_currency: str = "ACP"

    # L3: Fees (platform)
    # Percentage-based defaults:
    # - listing_fee_percent is applied to listing price on publish
    # - run_fee_percent is applied to contract payout amount on successful run
    run_fee_percent: str = "1"
    run_fee_amount: str = "0"
    run_fee_currency: str = "ACP"
    listing_fee_percent: str = "2"
    listing_fee_amount: str = "0"
    listing_fee_currency: str = "ACP"

    # L3: On-chain (mock by default). ACP = ANCAP Chain Protocol (see ACP-crypto/)
    chain_anchor_driver: str = "mock"  # mock | acp | ethereum | solana
    acp_rpc_url: str = "http://127.0.0.1:8545/rpc"  # used when chain_anchor_driver=acp
    ethereum_rpc_url: str = ""  # e.g. https://eth.llamarpc.com ; used when chain_anchor_driver=ethereum
    solana_rpc_url: str = ""  # e.g. https://api.mainnet-beta.solana.com ; used when chain_anchor_driver=solana

    # L3: Slashing on moderation (0 = disabled)
    moderation_slash_amount: str = "0"
    moderation_slash_currency: str = "ACP"

    # L3: staking rewards economics (self-funded by platform cashflows)
    staking_rewards_enabled: bool = True
    staking_rewards_currency: str = "ACP"
    staking_rewards_fees_share_percent: str = "40"  # share of daily fee cashflow sent to stakers
    staking_rewards_slash_share_percent: str = "100"  # share of slashes sent to stakers
    staking_rewards_bootstrap_daily_emission: str = "300"  # ACP/day when APY floor not met
    staking_rewards_bootstrap_emission_cap_total: str = "108000"  # total ACP cap for bootstrap emissions
    staking_rewards_apy_floor_percent: str = "3"
    staking_rewards_apy_ceiling_percent: str = "18"
    staking_rewards_min_stake_for_rewards: str = "25"

    # Wallet swap MVP: USDT TRC20 -> ACP (internal/manual confirmation flow)
    usdt_trc20_deposit_address: str = "TNAbqPprJmqRa33UoRvYnUsVfDSgrJc3W1"
    usdt_trc20_to_acp_rate: str = "1"

    # Referral rewards: optional on-chain auto payout from a dedicated site wallet.
    referral_onchain_payout_enabled: bool = False
    referral_onchain_payout_keystore_file: str = ""
    referral_onchain_payout_fee_acp: str = ""

    # Opaque cursor (reputation events pagination): HMAC secret
    cursor_secret: str = "change-me-cursor-secret"

    # Cron job protection: optional secret for POST /v1/system/jobs/tick
    # If set, requires X-Cron-Secret header to match. Recommended for production.
    cron_secret: str | None = None

    # CORS: comma-separated browser origins. "*" with allow_credentials=True is invalid; browsers block preflight.
    cors_origins: str = (
        "https://ancap.cloud,https://www.ancap.cloud,"
        "http://localhost:3000,http://localhost:3001,"
        "http://127.0.0.1:3000,http://127.0.0.1:3001"
    )

    # ROADMAP §5: optional external quality scorer (step-level). If set, POST step payload to URL; expect JSON {"score": float 0..1}. On timeout/error use built-in heuristic.
    quality_scorer_url: str = ""  # e.g. "http://localhost:8080/score"
    quality_scorer_timeout_seconds: int = 5

    # Delivery Wave feature flags (guard high-risk capabilities)
    ff_graph_auto_enforcement: bool = False
    ff_mutation_engine: bool = False
    ff_governance_auto_apply: bool = False
    ff_external_actions: bool = False
    ff_nl_strategy_compiler: bool = False

    # Participation gates: when enabled (default), every listing/order/run is checked
    # against the tier-1 thresholds in services/participation_gates.py (stake/trust/
    # reputation/graph). Disabling skips the gate entirely (test-only escape hatch).
    # Production should keep this on.
    participation_gates_enabled: bool = True

    # Wave 2: reputation and graph enforcement tuning
    reputation_half_life_30d: float = 10.0
    reputation_half_life_90d: float = 30.0
    reputation_max_score_delta_per_recompute: float = 15.0  # points on 0..100 scale
    graph_enforcement_suspicious_density: float = 0.5
    graph_enforcement_max_cluster_size: int = 10
    graph_enforcement_block_if_in_cycle: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
