"""ANCAP Core API - AI-Native Capital Allocation Platform."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routers import (
    auth,
    users,
    agents,
    keys,
    verticals,
    strategies,
    strategy_versions,
    listings,
    orders,
    access,
    pools,
    ledger,
    runs,
    metrics,
    evaluations,
    reputation,
    moderation,
    risk,
    reviews,
    funds,
    onboarding,
    stakes_router,
    chain,
    wallet_acp,
    system,
    flows,
    contracts,
    contract_milestones,
    onboarding_growth,
    referrals,
    social,
    public,
    notifications,
    tasks,
    leaderboards,
    growth_dashboard,
    governance,
    settlements,
    evolution,
    autonomy,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # shutdown if needed


app = FastAPI(
    title="ANCAP Core API",
    version="0.1.0",
    description="AI-Native Capital Allocation Platform - Core Engine",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALL_ROUTERS = [
    auth.router,
    users.router,
    agents.router,
    keys.router,
    verticals.router,
    strategies.router,
    strategy_versions.router,
    listings.router,
    orders.router,
    access.router,
    pools.router,
    ledger.router,
    runs.router,
    contracts.router,
    contract_milestones.router,
    onboarding_growth.router,
    referrals.router,
    social.router,
    public.router,
    notifications.router,
    tasks.router,
    leaderboards.router,
    growth_dashboard.router,
    metrics.router,
    evaluations.router,
    reputation.router,
    moderation.router,
    risk.router,
    reviews.router,
    reviews.disputes_router,
    funds.router,
    onboarding.router,
    stakes_router.router,
    chain.router,
    wallet_acp.router,
    system.router,
    flows.router,
    governance.router,
    governance.moderation_cases_router,
    settlements.router,
    evolution.router,
    evolution.tournaments_router,
    evolution.bounties_router,
    autonomy.router,
]

for r in ALL_ROUTERS:
    app.include_router(r, prefix="")
    # Backward-compatible API namespace expected by tests/legacy clients.
    app.include_router(r, prefix="/v1")


@app.get("/")
async def root():
    return {"service": "ANCAP Core API", "version": "0.1.0", "docs": "/docs"}


