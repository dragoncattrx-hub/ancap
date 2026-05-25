"""Application configuration."""
from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings loaded from environment."""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"  # "development" | "production"

    @field_validator("environment", mode="before")
    @classmethod
    def _normalize_env(cls, v):
        return (v or "development").strip().lower()

    @model_validator(mode="after")
    def _check_production_secrets(self):
        """Fail fast if required production secrets are missing or have insecure placeholders."""
        if self.environment != "production":
            return self
        unsafe_phrases = {
            "change", "dev-secret", "change-me", "changeme",
            "secret", "example", "placeholder",
        }
        for name, value in [
            ("SECRET_KEY", self.secret_key),
            ("CURSOR_SECRET", self.cursor_secret),
            ("CRON_SECRET", self.cron_secret),
        ]:
            if not value:
                raise ValueError(
                    f"[PRODUCTION] {name} is not set. "
                    f"Set {name} as an environment variable before starting in production."
                )
            if any(p in value.lower() for p in unsafe_phrases):
                raise ValueError(
                    f"[PRODUCTION] {name} has an insecure placeholder: '{value}'. "
                    f"Set a real secret via environment variable."
                )

        database_url = (self.database_url or "").strip()
        if not database_url:
            raise ValueError(
                "[PRODUCTION] DATABASE_URL is not set. "
                "Set DATABASE_URL before starting in production."
            )
        if "://postgres:postgres@" in database_url.lower():
            raise ValueError(
                "[PRODUCTION] DATABASE_URL still uses the insecure postgres:postgres default. "
                "Set a real database password before starting in production."
            )
        return self

    # Auth -- required secrets validated above when environment=production
    secret_key: str = ""           # required in production -- no insecure default
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    debug: bool = False
    turnstile_secret_key: str = ""
    password_reset_token_ttl_minutes: int = 30
    public_app_url: str = "https://ancap.cloud"
    acp_wallet_recovery_master_key: str = ""
    platform_admin_user_ids: str = ""

    # Opaque cursor -- required in production
    cursor_secret: str = ""        # required in production -- no insecure default

    @property
    def platform_admin_user_ids_allowlist(self) -> tuple[str, ...]:
        raw = self.platform_admin_user_ids or ""
        return tuple(item.strip() for item in raw.split(",") if item.strip())

    # Mail / alerts
    mail_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "ANCAP Support"
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False
    smtp_timeout_seconds: int = 15
    login_alerts_enabled: bool = True

    # Pagination
    default_page_limit: int = 50
    max_page_limit: int = 200

    # Circuit breaker
    circuit_breaker_n_runs: int = 20
    circuit_breaker_min_return_pct: float = -5.0
    circuit_breaker_k_killed: int = 5

    # Quarantine
    quarantine_hours: int = 24
    quarantine_max_orders_per_day: int = 3

    # L3: Proof-of-Agent
    registration_max_agents_per_day: int = 100
    stake_to_activate_amount: str = "0"
    stake_to_activate_currency: str = "ACP"

    # L3: Fees
    run_fee_percent: str = "1"
    run_fee_amount: str = "0"
    run_fee_currency: str = "ACP"
    listing_fee_percent: str = "2"
    listing_fee_amount: str = "0"
    listing_fee_currency: str = "ACP"

    # L3: On-chain
    chain_anchor_driver: str = "mock"
    acp_rpc_url: str = "https://acp1.ancap.cloud/rpc"
    ethereum_rpc_url: str = ""
    solana_rpc_url: str = ""

    # L3: Slashing
    moderation_slash_amount: str = "0"
    moderation_slash_currency: str = "ACP"

    # L3: Staking rewards
    staking_rewards_enabled: bool = True
    staking_rewards_currency: str = "ACP"
    staking_rewards_fees_share_percent: str = "40"
    staking_rewards_slash_share_percent: str = "100"
    staking_rewards_bootstrap_daily_emission: str = "300"
    staking_rewards_bootstrap_emission_cap_total: str = "108000"
    staking_rewards_apy_floor_percent: str = "3"
    staking_rewards_apy_ceiling_percent: str = "18"
    staking_rewards_min_stake_for_rewards: str = "25"

    # Wallet swap MVP
    usdt_trc20_deposit_address: str = "TNAbqPprJmqRa33UoRvYnUsVfDSgrJc3W1"
    usdt_trc20_to_acp_rate: str = "1"

    # Referral
    referral_onchain_payout_enabled: bool = False
    referral_onchain_payout_keystore_file: str = ""
    referral_onchain_payout_fee_acp: str = ""

    # Cron job protection
    cron_secret: str | None = None

    # CORS
    cors_origins: str = (
        "https://ancap.cloud,https://www.ancap.cloud,"
        "http://localhost:3000,http://localhost:3001,"
        "http://127.0.0.1:3000,http://127.0.0.1:3001"
    )

    # Quality scorer
    quality_scorer_url: str = ""
    quality_scorer_timeout_seconds: int = 5

    # Feature flags
    ff_graph_auto_enforcement: bool = False
    ff_mutation_engine: bool = False
    ff_governance_auto_apply: bool = False
    ff_external_actions: bool = False
    ff_nl_strategy_compiler: bool = False

    # Participation gates
    participation_gates_enabled: bool = True

    # Wave 2: reputation and graph
    reputation_half_life_30d: float = 10.0
    reputation_half_life_90d: float = 30.0
    reputation_max_score_delta_per_recompute: float = 15.0
    graph_enforcement_suspicious_density: float = 0.5
    graph_enforcement_max_cluster_size: int = 10
    graph_enforcement_block_if_in_cycle: bool = True

    # wACP / BSC bridge
    bridge_rail_enabled: bool = False
    bridge_rail_paused: bool = False
    bridge_dry_run: bool = True
    bridge_bsc_rpc_url: str = ""
    bridge_wacp_contract: str = ""
    bridge_gateway_contract: str = ""
    bridge_bsc_private_key: str | None = None
    bridge_reserve_acp_address: str = ""
    acp_hot_keystore_file: str = ""
    bridge_acp_confirmations: int = 30
    bridge_bsc_confirmations: int = 18
    bridge_operator_secret: str | None = None
    bsc_explorer_base: str = "https://bscscan.com"
    acp_explorer_tx_base: str = "https://ancap.cloud/acp/tx"
    turnstile_site_key: str = ""

    # Mobile wallet
    mobile_wallet_min_app_version: str = "1.0.0"
    mobile_wallet_maintenance: bool = False
    mobile_wallet_maintenance_message: str | None = None
    mobile_wallet_support_url: str = "https://ancap.cloud/support"
    mobile_wallet_bridge_reverse_enabled: bool = False
    mobile_broadcast_rate_limit_per_minute: int = 10
    mobile_broadcast_rate_limit_burst: int = 5
    mobile_smart_pay_enabled: bool = True
    mobile_smart_pay_ai_fallback_enabled: bool = False
    mobile_smart_pay_auto_swap_enabled: bool = False
    mobile_smart_pay_max_image_bytes: int = 5_242_880
    mobile_smart_pay_max_slippage_bps: int = 500
    mobile_smart_pay_min_acp_fee_reserve: str = "1.0"

    # LLM
    llm_provider: str = "teneta_claude"
    llm_model: str = "claude-sonnet-4-6"
    anthropic_base_url: str = "https://api.tenetauniversity.com"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    llm_timeout_seconds: int = 45
    llm_max_tokens: int = 1800
    llm_daily_budget_acp: str = "250"
    llm_fallback_to_template: bool = True
    # LLM cost tracking (ACP per 1M tokens; used to compute real provider cost)
    llm_cost_per_1m_input_tokens: str = "0"
    llm_cost_per_1m_output_tokens: str = "0"

    # Redis
    redis_url: str = ""
    rate_limit_per_minute: int = 120
    rate_limit_burst: int = 240

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ancap"


@lru_cache
def get_settings() -> Settings:
    return Settings()
