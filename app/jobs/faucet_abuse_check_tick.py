from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession


async def faucet_abuse_check_tick(session: AsyncSession, *, max_items: int = 500) -> dict:
    # v1 placeholder: risk flags are written on claim; later we can reconcile against graph/quarantine and claw back.
    return {"checked": 0, "max_items": max_items}

