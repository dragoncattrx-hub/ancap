from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import is_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, UserEvmWallet, WalletAuthChallenge
from app.services.auth_flows import link_wallet_to_user
from app.services.auth import create_access_token, hash_password

WALLET_AUTH_TTL_MINUTES = 10
DEFAULT_CHAIN_ID = 56


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_wallet_address(address: str) -> str:
    value = (address or "").strip()
    if not value or not is_address(value):
        raise ValueError("Invalid wallet address")
    return value.lower()


def short_wallet_label(address: str) -> str:
    compact = normalize_wallet_address(address)
    return f"{compact[:6]}…{compact[-4:]}"


def build_wallet_login_message(
    *,
    domain: str,
    uri: str,
    address: str,
    nonce: str,
    chain_id: int,
    issued_at: datetime,
    expires_at: datetime,
) -> str:
    normalized = normalize_wallet_address(address)
    issued_at_iso = issued_at.replace(microsecond=0).isoformat() + "Z"
    expires_at_iso = expires_at.replace(microsecond=0).isoformat() + "Z"
    return (
        f"{domain} wants you to sign in with your wallet:\n"
        f"{normalized}\n\n"
        "Sign this message to authenticate with ANCAP. No blockchain transaction will be sent.\n\n"
        f"URI: {uri}\n"
        "Version: 1\n"
        f"Chain ID: {chain_id}\n"
        f"Nonce: {nonce}\n"
        f"Issued At: {issued_at_iso}\n"
        f"Expiration Time: {expires_at_iso}"
    )


async def create_wallet_auth_challenge(
    session: AsyncSession,
    *,
    address: str,
    chain_id: int | None,
    domain: str,
    uri: str,
) -> WalletAuthChallenge:
    normalized = normalize_wallet_address(address)
    effective_chain_id = int(chain_id or DEFAULT_CHAIN_ID)
    now = utc_now()
    expires_at = now + timedelta(minutes=WALLET_AUTH_TTL_MINUTES)
    nonce = secrets.token_urlsafe(24)
    message = build_wallet_login_message(
        domain=domain,
        uri=uri,
        address=normalized,
        nonce=nonce,
        chain_id=effective_chain_id,
        issued_at=now,
        expires_at=expires_at,
    )
    challenge = WalletAuthChallenge(
        wallet_address=normalized,
        chain_id=effective_chain_id,
        nonce=nonce,
        message=message,
        issued_at=now,
        expires_at=expires_at,
    )
    session.add(challenge)
    await session.flush()
    return challenge


async def resolve_or_create_wallet_user(session: AsyncSession, address: str) -> User:
    normalized = normalize_wallet_address(address)
    existing_link = await session.execute(
        select(UserEvmWallet).where(UserEvmWallet.wallet_address == normalized)
    )
    link = existing_link.scalar_one_or_none()
    if link:
        user_result = await session.execute(select(User).where(User.id == link.user_id))
        user = user_result.scalar_one_or_none()
        if user is not None:
            return user

    pseudo_email = f"{normalized.removeprefix('0x')}@wallet.ancap.local"
    user = User(
        email=pseudo_email,
        password_hash=hash_password(secrets.token_urlsafe(48)),
        display_name=short_wallet_label(normalized),
    )
    session.add(user)
    await session.flush()
    await link_wallet_to_user(session, user=user, wallet_address=normalized, chain_id=DEFAULT_CHAIN_ID)
    return user


async def verify_wallet_auth_and_issue_token(
    session: AsyncSession,
    *,
    challenge_id: str,
    address: str,
    signature: str,
    link_to_user: User | None = None,
) -> tuple[str, User]:
    normalized = normalize_wallet_address(address)
    challenge_result = await session.execute(
        select(WalletAuthChallenge).where(WalletAuthChallenge.id == challenge_id)
    )
    challenge = challenge_result.scalar_one_or_none()
    if challenge is None:
        raise ValueError("Wallet login challenge not found")
    if challenge.used_at is not None:
        raise ValueError("Wallet login challenge already used")
    expires_at = challenge.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < utc_now():
        raise ValueError("Wallet login challenge expired")
    if normalize_wallet_address(challenge.wallet_address) != normalized:
        raise ValueError("Wallet address does not match the challenge")

    encoded = encode_defunct(text=challenge.message)
    try:
        recovered = Account.recover_message(encoded, signature=signature)
    except Exception as exc:
        raise ValueError("Invalid wallet signature") from exc

    if normalize_wallet_address(recovered) != normalized:
        raise ValueError("Wallet signature does not match the provided address")

    user = link_to_user or await resolve_or_create_wallet_user(session, normalized)
    challenge.used_at = utc_now()

    await link_wallet_to_user(session, user=user, wallet_address=normalized, chain_id=challenge.chain_id)

    token = create_access_token(str(user.id))
    return token, user
