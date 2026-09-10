"""Public crypto benchmark scorecard (QOBLIB-style)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.crypto_benchmark import CryptoBenchmarkResponse
from app.services import crypto_benchmark as svc

router = APIRouter(tags=["Crypto Benchmark"])


@router.get("/crypto/benchmark", response_model=CryptoBenchmarkResponse)
async def crypto_benchmark(session: AsyncSession = Depends(get_db)):
    """Live scorecard for ACP/wACP/sACP rails vs published baselines."""
    return await svc.build_benchmark(session)
