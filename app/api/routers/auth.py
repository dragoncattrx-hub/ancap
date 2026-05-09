from fastapi import APIRouter, HTTPException, Request, status

from app.schemas import (
    AuthLoginRequest,
    AuthLoginResponse,
    UserCreateRequest,
    UserPublic,
    WalletAuthNonceRequest,
    WalletAuthNonceResponse,
    WalletAuthVerifyRequest,
)
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.acp_wallet import create_wallet_for_user, get_wallet_for_user
from app.services.referrals import attribute_referral
from app.services.wallet_auth import create_wallet_auth_challenge, verify_wallet_auth_and_issue_token
from app.services.turnstile import verify_turnstile
from app.api.deps import DbSession
from app.db.models import User
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=AuthLoginResponse)
async def login(body: AuthLoginRequest, request: Request, session: DbSession):
    await verify_turnstile(request, body.turnstile_token, "login")
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


@router.post("/wallet/nonce", response_model=WalletAuthNonceResponse)
async def wallet_nonce(body: WalletAuthNonceRequest, request: Request, session: DbSession):
    await verify_turnstile(request, body.turnstile_token, "login")
    forwarded_host = (request.headers.get("x-forwarded-host") or "").split(",")[0].strip()
    host = forwarded_host or (request.headers.get("host") or "ancap.cloud").split(",")[0].strip()

    forwarded_proto = (request.headers.get("x-forwarded-proto") or "").split(",")[0].strip().lower()
    scheme = forwarded_proto or (request.url.scheme or "https").strip().lower()
    if scheme not in {"http", "https"}:
        scheme = "https"

    default_uri = f"{scheme}://{host}/login"
    challenge = await create_wallet_auth_challenge(
        session,
        address=body.address,
        chain_id=body.chain_id,
        domain=(body.domain or host).strip(),
        uri=(body.uri or default_uri).strip(),
    )
    return WalletAuthNonceResponse(
        challenge_id=str(challenge.id),
        address=challenge.wallet_address,
        chain_id=int(challenge.chain_id or 56),
        nonce=challenge.nonce,
        message=challenge.message,
        issued_at=challenge.issued_at,
        expires_at=challenge.expires_at,
    )


@router.post("/wallet/verify", response_model=AuthLoginResponse)
async def wallet_verify(body: WalletAuthVerifyRequest, session: DbSession):
    try:
        token, _user = await verify_wallet_auth_and_issue_token(
            session,
            challenge_id=body.challenge_id,
            address=body.address,
            signature=body.signature,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return AuthLoginResponse(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        wallet_backup_mnemonic=None,
    )


@router.post("/users", response_model=UserPublic, status_code=201)
async def create_user(body: UserCreateRequest, request: Request, session: DbSession):
    await verify_turnstile(request, body.turnstile_token, "register")
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
    token = create_access_token(str(user.id))
    return UserPublic(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        created_at=user.created_at,
        wallet_backup_mnemonic=mnemonic,
        access_token=token,
        token_type="bearer",
        expires_in=3600,
    )
