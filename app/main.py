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

app.include_router(auth.router, prefix="")
app.include_router(users.router, prefix="")
app.include_router(agents.router, prefix="")
app.include_router(keys.router, prefix="")
app.include_router(verticals.router, prefix="")
app.include_router(strategies.router, prefix="")
app.include_router(strategy_versions.router, prefix="")
app.include_router(listings.router, prefix="")
app.include_router(orders.router, prefix="")
app.include_router(access.router, prefix="")
app.include_router(pools.router, prefix="")
app.include_router(ledger.router, prefix="")
app.include_router(runs.router, prefix="")
app.include_router(contracts.router, prefix="")
app.include_router(contract_milestones.router, prefix="")
app.include_router(onboarding_growth.router, prefix="")
app.include_router(referrals.router, prefix="")
app.include_router(social.router, prefix="")
app.include_router(public.router, prefix="")
app.include_router(notifications.router, prefix="")
app.include_router(tasks.router, prefix="")
app.include_router(leaderboards.router, prefix="")
app.include_router(growth_dashboard.router, prefix="")
app.include_router(metrics.router, prefix="")
app.include_router(evaluations.router, prefix="")
app.include_router(reputation.router, prefix="")
app.include_router(moderation.router, prefix="")
app.include_router(risk.router, prefix="")
app.include_router(reviews.router, prefix="")
app.include_router(reviews.disputes_router, prefix="")
app.include_router(funds.router, prefix="")
app.include_router(onboarding.router, prefix="")
app.include_router(stakes_router.router, prefix="")
app.include_router(chain.router, prefix="")
app.include_router(wallet_acp.router, prefix="")
app.include_router(system.router, prefix="")
app.include_router(flows.router, prefix="")
app.include_router(governance.router, prefix="")
app.include_router(governance.moderation_cases_router, prefix="")
app.include_router(settlements.router, prefix="")
app.include_router(evolution.router, prefix="")
app.include_router(evolution.tournaments_router, prefix="")
app.include_router(evolution.bounties_router, prefix="")
app.include_router(autonomy.router, prefix="")


@app.get("/")
async def root():
    return {"service": "ANCAP Core API", "version": "0.1.0", "docs": "/docs"}


@app.get("/v1/system/health")
async def health_v1_alias():
    # Compatibility alias for container healthcheck and legacy clients.
    return {"ok": True, "service": "ANCAP Core API"}
