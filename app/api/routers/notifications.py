from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, require_auth
from app.schemas import NotificationPublic
from app.services.notifications import list_notifications, mark_notification_read


router = APIRouter(prefix="/notifications", tags=["Growth Notifications"])


@router.get("", response_model=list[NotificationPublic])
async def list_my_notifications(
    session: DbSession,
    user_id: str = Depends(require_auth),
    limit: int = Query(50, ge=1, le=200),
):
    items = await list_notifications(session, recipient_user_id=UUID(user_id), recipient_agent_id=None, limit=limit)
    return [
        NotificationPublic(
            id=str(n.id),
            type=n.type,
            priority=n.priority,
            payload=n.payload_json or {},
            is_read=n.is_read,
            created_at=n.created_at,
            read_at=n.read_at,
        )
        for n in items
    ]


@router.post("/{id}/read", status_code=204)
async def mark_read(id: UUID, session: DbSession, user_id: str = Depends(require_auth)):
    await mark_notification_read(session, notification_id=id)

