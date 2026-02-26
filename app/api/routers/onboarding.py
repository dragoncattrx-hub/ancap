"""L3: Proof-of-Agent onboarding — challenge and attestation."""
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.api.deps import DbSession
from app.schemas.onboarding import ChallengeCreateRequest, ChallengePublic, AttestRequest, AttestationPublic
from app.services.onboarding import create_challenge, submit_attestation

router = APIRouter(prefix="/onboarding", tags=["Onboarding (L3)"])


@router.post("/challenge", response_model=ChallengePublic, status_code=201)
async def request_challenge(body: ChallengeCreateRequest, session: DbSession):
    try:
        ch = await create_challenge(
            session,
            challenge_type=body.challenge_type,
            ttl_seconds=600,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return ChallengePublic(
        id=str(ch.id),
        challenge_type=ch.challenge_type,
        payload=ch.payload_json,
        nonce=ch.nonce,
        expires_at=ch.expires_at,
    )


@router.post("/attest", response_model=AttestationPublic, status_code=201)
async def submit_attest(body: AttestRequest, session: DbSession):
    try:
        att = await submit_attestation(
            session,
            challenge_id=UUID(body.challenge_id),
            solution_hash=body.solution_hash,
            attestation_sig=body.attestation_sig,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return AttestationPublic(
        id=str(att.id),
        challenge_id=str(att.challenge_id),
        created_at=att.created_at,
    )
