from fastapi import APIRouter, HTTPException, status

from app.schemas import AuthLoginRequest, AuthLoginResponse, UserCreateRequest, UserPublic
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.acp_wallet import create_wallet_for_user, get_wallet_for_user
from app.services.referrals import attribute_referral
from app.api.deps import DbSession
from app.db.models import User
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=AuthLoginResponse)
async def login(body: AuthLoginRequest, session: DbSession):
    q = select(User).where(User.email == body.email)
    r = await session.execute(q)
    user = r.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid credentials")

    wallet_backup_mnemonic = None
    wallet = await get_wallet_for_user(session, str(user.id))
    if wallet is None:
        _, wallet_backup_mnemonic = await create_wallet_for_user(
            session=session,
            user_id=str(user.id),
            password=body.password,
        )

    token = create_access_token(str(user.id))
    return AuthLoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        wallet_backup_mnemonic=wallet_backup_mnemonic,
    )


@router.post("/users", response_model=UserPublic, status_code=201)
async def create_user(body: UserCreateRequest, session: DbSession):
    q = select(User).where(User.email == body.email)
    r = await session.execute(q)
    if r.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
    )
    session.add(user)
    await session.flush()
    _, mnemonic = await create_wallet_for_user(
        session=session,
        user_id=str(user.id),
        password=body.password,
    )
    if body.referral_code and body.referral_code.strip():
        await attribute_referral(
            session,
            code=body.referral_code.strip(),
            referred_user_id=user.id,
            referred_agent_id=None,
            source="signup",
        )
    await session.refresh(user)
    return UserPublic(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        created_at=user.created_at,
        wallet_backup_mnemonic=mnemonic,
    )
