"""L3: Proof-of-Agent challenge generation and attestation verification."""
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AgentChallenge, AgentAttestation


# Payload shapes (see schemas/onboarding.py ChallengeType):
# - reasoning: prompt + nonce; solution = first 8 hex chars of SHA256(nonce); client sends solution_hash = SHA256(solution).hexdigest()
# - tool_use: task + input + nonce; solution = SHA256(input).hexdigest(); client sends solution_hash = solution (64 hex)
def _make_payload(challenge_type: str, nonce: str) -> dict:
    """Generate challenge payload. reasoning: hash puzzle; tool_use: echo-style task."""
    if challenge_type == "reasoning":
        return {"prompt": f"Compute SHA256 of '{nonce}' and return first 8 hex chars.", "nonce": nonce}
    if challenge_type == "tool_use":
        return {"task": "echo", "input": nonce, "nonce": nonce}
    return {"type": challenge_type, "nonce": nonce}


def _expected_solution_hash(challenge_type: str, nonce: str) -> str:
    """Expected solution_hash for verification. Raises ValueError for unknown type."""
    if challenge_type == "reasoning":
        raw = hashlib.sha256(nonce.encode()).hexdigest()[:8]
        return hashlib.sha256(raw.encode()).hexdigest()
    if challenge_type == "tool_use":
        return hashlib.sha256(nonce.encode()).hexdigest()
    raise ValueError(f"Unknown challenge_type for verification: {challenge_type}")


async def create_challenge(
    session: AsyncSession,
    *,
    challenge_type: str = "reasoning",
    ttl_seconds: int = 600,
) -> AgentChallenge:
    nonce = secrets.token_hex(16)
    payload = _make_payload(challenge_type, nonce)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
    ch = AgentChallenge(
        challenge_type=challenge_type,
        payload_json=payload,
        nonce=nonce,
        expires_at=expires_at,
    )
    session.add(ch)
    await session.flush()
    return ch


async def submit_attestation(
    session: AsyncSession,
    *,
    challenge_id: UUID,
    solution_hash: str,
    attestation_sig: str | None = None,
) -> AgentAttestation:
    """Verify challenge exists, not expired, and solution_hash matches expected (for reasoning/tool_use)."""
    r = await session.execute(select(AgentChallenge).where(AgentChallenge.id == challenge_id))
    ch = r.scalar_one_or_none()
    if not ch:
        raise ValueError("Challenge not found")
    if ch.expires_at and ch.expires_at < datetime.now(timezone.utc):
        raise ValueError("Challenge expired")
    if ch.challenge_type in ("reasoning", "tool_use"):
        expected = _expected_solution_hash(ch.challenge_type, ch.nonce)
        if solution_hash.strip().lower() != expected.lower():
            raise ValueError("Invalid solution")
    att = AgentAttestation(
        challenge_id=challenge_id,
        solution_hash=solution_hash,
        attestation_sig=attestation_sig,
    )
    session.add(att)
    await session.flush()
    return att
