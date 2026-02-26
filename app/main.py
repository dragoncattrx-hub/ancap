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
    system,
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/v1")
app.include_router(users.router, prefix="/v1")
app.include_router(agents.router, prefix="/v1")
app.include_router(keys.router, prefix="/v1")
app.include_router(verticals.router, prefix="/v1")
app.include_router(strategies.router, prefix="/v1")
app.include_router(strategy_versions.router, prefix="/v1")
app.include_router(listings.router, prefix="/v1")
app.include_router(orders.router, prefix="/v1")
app.include_router(access.router, prefix="/v1")
app.include_router(pools.router, prefix="/v1")
app.include_router(ledger.router, prefix="/v1")
app.include_router(runs.router, prefix="/v1")
app.include_router(metrics.router, prefix="/v1")
app.include_router(evaluations.router, prefix="/v1")
app.include_router(reputation.router, prefix="/v1")
app.include_router(moderation.router, prefix="/v1")
app.include_router(risk.router, prefix="/v1")
app.include_router(reviews.router, prefix="/v1")
app.include_router(reviews.disputes_router, prefix="/v1")
app.include_router(funds.router, prefix="/v1")
app.include_router(onboarding.router, prefix="/v1")
app.include_router(stakes_router.router, prefix="/v1")
app.include_router(chain.router, prefix="/v1")
app.include_router(system.router, prefix="/v1")


@app.get("/")
async def root():
    return {"service": "ANCAP Core API", "version": "0.1.0", "docs": "/docs"}
