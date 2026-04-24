from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


ProposalStatus = Literal["draft", "review", "active", "rejected", "appealed"]
ProposalVote = Literal["approve", "reject", "abstain"]
ModerationCaseStatus = Literal["open", "resolved", "appealed", "rejected"]


class GovernanceProposalCreateRequest(BaseModel):
    kind: str = Field(..., min_length=3, max_length=32)
    target_type: str = Field(..., min_length=3, max_length=32)
    target_id: str | None = None
    payload_json: dict[str, Any] = Field(default_factory=dict)


class GovernanceProposalDecisionRequest(BaseModel):
    decision: ProposalStatus = Field(..., description="active | rejected | appealed")
    reason: str | None = Field(None, max_length=2000)


class GovernanceVoteRequest(BaseModel):
    vote: ProposalVote
    reason: str | None = Field(None, max_length=2000)


class ModerationActionFromCaseRequest(BaseModel):
    action: Literal["quarantine", "unquarantine", "ban"]
    reason: str | None = Field(None, max_length=2000)


class GovernanceProposalPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    kind: str
    target_type: str
    target_id: str | None
    payload_json: dict[str, Any]
    status: ProposalStatus
    created_by: str | None
    reviewed_by: str | None
    decision_reason: str | None
    decided_at: datetime | None
    created_at: datetime
    updated_at: datetime


class GovernanceAuditEventPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    proposal_id: str
    event_type: str
    actor_type: str
    actor_id: str | None
    event_json: dict[str, Any]
    created_at: datetime


class ModerationCaseCreateRequest(BaseModel):
    subject_type: str = Field(..., pattern="^(agent|strategy|listing|vertical|policy)$")
    subject_id: str
    reason_code: str = Field(..., min_length=3, max_length=64)


class ModerationCaseResolveRequest(BaseModel):
    status: ModerationCaseStatus = Field(..., description="resolved | appealed | rejected")
    resolution: str | None = Field(None, max_length=2000)


class ModerationCasePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject_type: str
    subject_id: str
    reason_code: str
    status: ModerationCaseStatus
    opened_by: str | None
    resolved_by: str | None
    resolution: str | None
    created_at: datetime
    resolved_at: datetime | None
