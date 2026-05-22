from __future__ import annotations

import csv
import io
from datetime import datetime, UTC, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import desc, select, union_all, literal_column

from app.api.deps import DbSession, get_current_user_id, require_platform_admin
from app.db.models import DecisionLog, GovernanceAuditLog, BridgeAuditEvent


router = APIRouter(prefix="/admin/audit-log", tags=["Admin"])


class AuditLogItem(BaseModel):
    id: str
    type: str
    event_type: str
    actor_type: str | None
    actor_id: str | None
    scope: str | None
    subject_type: str | None
    subject_id: str | None
    event_json: dict | None
    message: str | None
    reason_code: str | None
    created_at: str | None


class AuditLogResponse(BaseModel):
    items: list[AuditLogItem]
    total: int


@router.get("", response_model=AuditLogResponse)
async def list_audit_logs(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
    type: str | None = Query(default=None, description="Filter by type: decision, governance, bridge"),
    scope: str | None = Query(default=None),
    actor_id: str | None = Query(default=None),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Combined audit log across all ANCAP subsystems.

    Requires authentication. Platform admins see all events; regular users see only
    their own events.
    """
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    since = datetime.now(UTC) - timedelta(days=days)
    items: list[AuditLogItem] = []
    total = 0

    try:
        user_uuid = UUID(user_id)
    except Exception:
        user_uuid = None

    is_admin = user_uuid and str(user_uuid) in get_settings().platform_admin_user_ids.split(",")

    if type is None or type == "decision":
        q = select(DecisionLog).where(DecisionLog.created_at >= since)
        if not is_admin and user_uuid:
            q = q.where(DecisionLog.actor_id == user_uuid)
        if scope:
            q = q.where(DecisionLog.scope == scope)
        if actor_id:
            try:
                q = q.where(DecisionLog.actor_id == UUID(actor_id))
            except Exception:
                pass
        q = q.order_by(desc(DecisionLog.created_at)).limit(limit).offset(offset)
        r = await session.execute(q)
        for row in r.scalars().all():
            items.append(AuditLogItem(
                id=str(row.id),
                type="decision",
                event_type=row.reason_code or "",
                actor_type=row.actor_type,
                actor_id=str(row.actor_id) if row.actor_id else None,
                scope=row.scope,
                subject_type=row.subject_type,
                subject_id=str(row.subject_id) if row.subject_id else None,
                event_json=row.metadata_json,
                message=row.message,
                reason_code=row.reason_code,
                created_at=row.created_at.isoformat() if row.created_at else None,
            ))

    if type is None or type == "governance":
        q = select(GovernanceAuditLog).where(GovernanceAuditLog.created_at >= since)
        if not is_admin and user_uuid:
            q = q.where(GovernanceAuditLog.actor_id == user_uuid)
        q = q.order_by(desc(GovernanceAuditLog.created_at)).limit(limit).offset(offset)
        r = await session.execute(q)
        for row in r.scalars().all():
            items.append(AuditLogItem(
                id=str(row.id),
                type="governance",
                event_type=row.event_type,
                actor_type=row.actor_type,
                actor_id=str(row.actor_id) if row.actor_id else None,
                scope="governance",
                subject_type=None,
                subject_id=str(row.proposal_id) if row.proposal_id else None,
                event_json=row.event_json,
                message=None,
                reason_code=None,
                created_at=row.created_at.isoformat() if row.created_at else None,
            ))

    if type is None or type == "bridge":
        q = select(BridgeAuditEvent).where(BridgeAuditEvent.created_at >= since)
        q = q.order_by(desc(BridgeAuditEvent.created_at)).limit(limit).offset(offset)
        r = await session.execute(q)
        for row in r.scalars().all():
            items.append(AuditLogItem(
                id=str(row.id),
                type="bridge",
                event_type=row.event_type,
                actor_type=None,
                actor_id=None,
                scope="bridge",
                subject_type=None,
                subject_id=str(row.operation_id) if row.operation_id else None,
                event_json=row.payload_json,
                message=None,
                reason_code=None,
                created_at=row.created_at.isoformat() if row.created_at else None,
            ))

    items.sort(key=lambda x: x.created_at or "", reverse=True)
    total = len(items)
    return AuditLogResponse(items=items[offset:offset+limit], total=total)


@router.get("/export")
async def export_audit_logs_csv(
    session: DbSession,
    user_id: str | None = Depends(get_current_user_id),
    type: str | None = Query(default=None),
    days: int = Query(7, ge=1, le=90),
):
    """Export audit log as CSV."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    resp = await list_audit_logs(session, user_id, type, None, None, days, 1000, 0)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "type", "event_type", "actor_type", "actor_id", "scope", "subject_type", "subject_id", "message", "reason_code", "created_at"])
    for item in resp.items:
        writer.writerow([
            item.id, item.type, item.event_type, item.actor_type or "",
            item.actor_id or "", item.scope or "", item.subject_type or "",
            item.subject_id or "", item.message or "", item.reason_code or "",
            item.created_at or "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=audit-log-{datetime.now(UTC).strftime('%Y-%m-%d')}.csv"
        },
    )


from fastapi import HTTPException
from app.config import get_settings
