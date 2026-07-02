"""Project treasury: transparent view of platform revenue/expenses and the
on-chain project wallet. Read-only; signing material never leaves the operator."""
from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.treasury import TreasuryStatusPublic
from app.services.project_treasury import treasury_status

router = APIRouter(prefix="/treasury", tags=["Treasury"])


@router.get("/status", response_model=TreasuryStatusPublic)
async def get_treasury_status(session: DbSession):
    """Public transparency endpoint: on-chain project wallet balance, internal
    platform ledger revenue/expenses, and the active fee policy."""
    return await treasury_status(session)
