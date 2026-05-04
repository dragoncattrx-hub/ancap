from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routers.bridge_rail import wacp_public_status, wacp_reserve_proof
from app.db.session import get_db
from app.schemas.bridge_rail import WacpPublicStatusResponse, WacpReserveProofResponse

router = APIRouter(prefix="/wacp", tags=["wACP Public"])


@router.get("/reserve-proof", response_model=WacpReserveProofResponse)
async def reserve_proof(session: AsyncSession = Depends(get_db)):
    return await wacp_reserve_proof(session)


@router.get("/status", response_model=WacpPublicStatusResponse)
async def status(session: AsyncSession = Depends(get_db)):
    return await wacp_public_status(session)
