"""ANCAP Core API - AI-Native Capital Allocation Platform."""
import logging
import time
from uuid import uuid4
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.services.logging import configure_logging, get_logger
from app.services.observability import record_http_request
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
    bridge_rail,
    wacp_public,
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
    workflow_store,
    paid_api,
    leaderboards,
    growth_dashboard,
    governance,
    settlements,
    evolution,
    autonomy,
)

settings = get_settings()
configure_logging()
logger = get_logger("api")


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


@app.middleware("http")
async def request_observability_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    started = time.perf_counter()
    status_code = 500
    user_id = getattr(request.state, "user_id", None)
    agent_id = getattr(request.state, "agent_id", None)
    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["x-request-id"] = request_id
        return response
    finally:
        duration_ms = int((time.perf_counter() - started) * 1000)
        record_http_request(request.method, request.url.path, status_code)
        logger.info(
            "http_request",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            duration_ms=duration_ms,
            user_id=str(user_id) if user_id else None,
            agent_id=str(agent_id) if agent_id else None,
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
    workflow_store.router,
    paid_api.router,
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
    bridge_rail.router,
    wacp_public.router,
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


