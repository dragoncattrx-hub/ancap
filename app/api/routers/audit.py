from __future__ import annotations

import csv
import io
from datetime import datetime, UTC, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import desc, select

from app.api.deps import DbSession, require_platform_admin
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
    admin_user_id: str = Depends(require_platform_admin),
    type: str | None = Query(default=None, description="Filter by type: decision, governance, bridge"),
    scope: str | None = Query(default=None),
    actor_id: str | None = Query(default=None),
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Combined audit log across all ANCAP subsystems.

    Admin-only surface: returns cross-user platform events including bridge
    operations and governance/decision logs.
    """
    since = datetime.now(UTC) - timedelta(days=days)
    items: list[AuditLogItem] = []

    parsed_actor_id: UUID | None = None
    if actor_id:
        try:
            parsed_actor_id = UUID(actor_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid actor_id") from exc

    if type is None or type == "decision":
        q = select(DecisionLog).where(DecisionLog.created_at >= since)
        if scope:
            q = q.where(DecisionLog.scope == scope)
        if parsed_actor_id is not None:
            q = q.where(DecisionLog.actor_id == parsed_actor_id)
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
        if parsed_actor_id is not None:
            q = q.where(GovernanceAuditLog.actor_id == parsed_actor_id)
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
    admin_user_id: str = Depends(require_platform_admin),
    type: str | None = Query(default=None),
    days: int = Query(7, ge=1, le=90),
):
    """Export audit log as CSV."""
    resp = await list_audit_logs(session, admin_user_id, type, None, None, days, 1000, 0)
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
