"""Application configuration."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Settings loaded from environment."""

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
    stake_to_activate_amount: str = "0"  # "0" = optional; e.g. "100" requires 100 VUSD stake to activate
    stake_to_activate_currency: str = "VUSD"

    # L3: Fees (platform)
    run_fee_amount: str = "0"
    run_fee_currency: str = "VUSD"
    listing_fee_amount: str = "0"
    listing_fee_currency: str = "VUSD"

    # L3: On-chain (mock by default). ACP = ANCAP Chain Protocol (see ACP-crypto/)
    chain_anchor_driver: str = "mock"  # mock | acp | ethereum | solana
    acp_rpc_url: str = "http://127.0.0.1:8545/rpc"  # used when chain_anchor_driver=acp
    ethereum_rpc_url: str = ""  # e.g. https://eth.llamarpc.com ; used when chain_anchor_driver=ethereum
    solana_rpc_url: str = ""  # e.g. https://api.mainnet-beta.solana.com ; used when chain_anchor_driver=solana

    # L3: Slashing on moderation (0 = disabled)
    moderation_slash_amount: str = "0"
    moderation_slash_currency: str = "VUSD"

    # Opaque cursor (reputation events pagination): HMAC secret
    cursor_secret: str = "change-me-cursor-secret"

    # Cron job protection: optional secret for POST /v1/system/jobs/tick
    # If set, requires X-Cron-Secret header to match. Recommended for production.
    cron_secret: str | None = None

    # ROADMAP §5: optional external quality scorer (step-level). If set, POST step payload to URL; expect JSON {"score": float 0..1}. On timeout/error use built-in heuristic.
    quality_scorer_url: str = ""  # e.g. "http://localhost:8080/score"
    quality_scorer_timeout_seconds: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
