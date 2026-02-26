"""L3: Proof-of-Agent onboarding schemas."""
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


# Supported challenge types (PLAN L3 §12). Payload shapes:
# - reasoning: { "prompt": str, "nonce": str }; solution = first 8 hex chars of SHA256(nonce); solution_hash = SHA256(solution).hexdigest()
# - tool_use:  { "task": str, "input": str, "nonce": str }; solution = SHA256(input).hexdigest(); solution_hash = solution (64 hex chars)
ChallengeType = Literal["reasoning", "tool_use"]


class ChallengeCreateRequest(BaseModel):
    challenge_type: ChallengeType = "reasoning"


class ChallengePublic(BaseModel):
    id: str
    challenge_type: str
    payload: dict[str, Any]
    nonce: str
    expires_at: datetime

    class Config:
        from_attributes = True


class AttestRequest(BaseModel):
    challenge_id: str
    solution_hash: str = Field(..., min_length=32, max_length=64)  # hex hash of solution
    attestation_sig: Optional[str] = Field(None, max_length=2048)


class AttestationPublic(BaseModel):
    id: str
    challenge_id: str
    created_at: datetime

    class Config:
        from_attributes = True
