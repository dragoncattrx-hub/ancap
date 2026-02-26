"""API key generation, hashing and lookup."""
import hashlib
import secrets
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ApiKey, Agent

PREFIX = "ancap_"
PREFIX_LEN = 6  # len("ancap_")
RANDOM_BYTES = 24  # 32 chars base64
KEY_PREFIX_DISPLAY_LEN = PREFIX_LEN + 12  # ancap_ + 12 chars for lookup


def generate_key() -> tuple[str, str, str]:
    """Generate a new API key. Returns (full_key, key_prefix, key_hash)."""
    raw = secrets.token_urlsafe(RANDOM_BYTES)
    full_key = PREFIX + raw
    prefix = full_key[:KEY_PREFIX_DISPLAY_LEN]
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, prefix, key_hash


def hash_key(key: str) -> str:
    """Return SHA-256 hex digest of the key."""
    return hashlib.sha256(key.encode()).hexdigest()


async def create_key(
    session: AsyncSession,
    agent_id: UUID,
    scope: str | None = None,
    expires_at: datetime | None = None,
) -> tuple[ApiKey, str]:
    """Create and persist an API key for the agent. Returns (ApiKey row, raw_key)."""
    full_key, key_prefix, key_hash = generate_key()
    row = ApiKey(
        agent_id=agent_id,
        key_prefix=key_prefix,
        key_hash=key_hash,
        scope=scope,
        expires_at=expires_at,
    )
    session.add(row)
    await session.flush()
    return row, full_key


async def resolve_key(session: AsyncSession, raw_key: str) -> UUID | None:
    """
    Resolve raw API key to agent_id. Returns None if invalid or expired.
    Key must start with PREFIX; we look up by prefix then verify hash.
    """
    if not raw_key or not raw_key.startswith(PREFIX) or len(raw_key) < KEY_PREFIX_DISPLAY_LEN:
        return None
    prefix = raw_key[:KEY_PREFIX_DISPLAY_LEN]
    key_hash = hash_key(raw_key)
    q = select(ApiKey).where(ApiKey.key_prefix == prefix)
    r = await session.execute(q)
    row = r.scalar_one_or_none()
    if not row or row.key_hash != key_hash:
        return None
    if row.expires_at is not None:
        exp = row.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
            return None
    return row.agent_id
