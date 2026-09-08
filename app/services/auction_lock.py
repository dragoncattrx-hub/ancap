"""Shared auction guards: lot-id hygiene and Postgres transaction locks."""
from __future__ import annotations

import hashlib
import re

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_LOT_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$")


def normalize_lot_id(lot_id: str, *, unknown: str) -> str:
    value = str(lot_id).strip()
    if not _LOT_ID_RE.fullmatch(value):
        raise HTTPException(status_code=404, detail=unknown)
    return value


async def lock_auction_lot(session: AsyncSession, namespace: str, lot_id: str) -> None:
    """Serialize bids on one lot for the rest of this transaction."""
    key = int.from_bytes(
        hashlib.sha256(f"{namespace}:{lot_id}".encode("utf-8")).digest()[:8],
        "big",
        signed=True,
    )
    await session.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": key})
