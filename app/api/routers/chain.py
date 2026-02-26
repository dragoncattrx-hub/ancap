"""L3: On-chain anchoring API."""
from uuid import UUID

from fastapi import APIRouter, Query, HTTPException

from app.api.deps import DbSession
from app.config import get_settings
from app.schemas.chain import AnchorCreateRequest, AnchorPublic
from app.db.models import ChainAnchor
from app.services.chain_anchor import get_anchor_driver
from sqlalchemy import select

router = APIRouter(prefix="/chain", tags=["Chain anchors (L3)"])


@router.post("/anchor", response_model=AnchorPublic, status_code=201)
async def create_anchor(body: AnchorCreateRequest, session: DbSession):
    """Submit payload hash for on-chain anchoring. Driver: mock | acp | ethereum | solana (config: chain_anchor_driver + *_rpc_url)."""
    settings = get_settings()
    driver = get_anchor_driver(settings.chain_anchor_driver or "mock")
    if driver is None:
        raise HTTPException(
            status_code=501,
            detail=f"Chain driver '{settings.chain_anchor_driver}' not implemented; use mock, acp, ethereum, or solana",
        )
    try:
        rec = await driver(
            session,
            chain_id=body.chain_id,
            payload_type=body.payload_type,
            payload_hash=body.payload_hash,
            payload_json=body.payload_json,
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return AnchorPublic(
        id=str(rec.id),
        chain_id=rec.chain_id,
        tx_hash=rec.tx_hash,
        payload_type=rec.payload_type,
        payload_hash=rec.payload_hash,
        anchored_at=rec.anchored_at,
    )


@router.get("/anchors", response_model=list[AnchorPublic])
async def list_anchors(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    cursor: str | None = Query(None),
    payload_type: str | None = Query(None),
    chain_id: str | None = Query(None),
):
    q = select(ChainAnchor).order_by(ChainAnchor.created_at.desc()).limit(limit + 1)
    if cursor:
        try:
            q = q.where(ChainAnchor.id < UUID(cursor))
        except ValueError:
            pass
    if payload_type:
        q = q.where(ChainAnchor.payload_type == payload_type)
    if chain_id:
        q = q.where(ChainAnchor.chain_id == chain_id)
    r = await session.execute(q)
    rows = r.scalars().all()
    return [
        AnchorPublic(
            id=str(rec.id),
            chain_id=rec.chain_id,
            tx_hash=rec.tx_hash,
            payload_type=rec.payload_type,
            payload_hash=rec.payload_hash,
            anchored_at=rec.anchored_at,
        )
        for rec in rows[:limit]
    ]
