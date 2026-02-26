from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.schemas import UserPublic
from app.api.deps import DbSession, require_auth
from app.db.models import User
from sqlalchemy import select

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserPublic)
async def get_me(session: DbSession, user_id: str = Depends(require_auth)):
    q = select(User).where(User.id == UUID(user_id))
    r = await session.execute(q)
    user = r.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserPublic(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        created_at=user.created_at,
    )
