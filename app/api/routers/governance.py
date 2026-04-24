from uuid import UUID

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select

from app.api.deps import DbSession, require_auth
from app.db.models import (
    GovernanceProposal,
    GovernanceVote,
    GovernanceAuditLog,
    ModerationCase,
)
from app.schemas.common import Pagination
from app.schemas.governance import (
    GovernanceProposalCreateRequest,
    GovernanceProposalDecisionRequest,
    GovernanceProposalPublic,
    GovernanceVoteRequest,
    GovernanceAuditEventPublic,
    ModerationCaseCreateRequest,
    ModerationCaseResolveRequest,
    ModerationCasePublic,
    ModerationActionFromCaseRequest,
)

router = APIRouter(prefix="/governance", tags=["Governance"])
moderation_cases_router = APIRouter(prefix="/moderation/cases", tags=["Moderation"])

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"review"},
    "review": {"active", "rejected", "appealed"},
    "appealed": {"review", "active", "rejected"},
    "active": set(),
    "rejected": set(),
}


def _validate_transition(current: str, target: str) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid status transition: {current} -> {target}",
        )


def _proposal_public(row: GovernanceProposal) -> GovernanceProposalPublic:
    return GovernanceProposalPublic(
        id=str(row.id),
        kind=row.kind,
        target_type=row.target_type,
        target_id=str(row.target_id) if row.target_id else None,
        payload_json=row.payload_json or {},
        status=row.status,
        created_by=str(row.created_by) if row.created_by else None,
        reviewed_by=str(row.reviewed_by) if row.reviewed_by else None,
        decision_reason=row.decision_reason,
        decided_at=row.decided_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _audit_public(row: GovernanceAuditLog) -> GovernanceAuditEventPublic:
    return GovernanceAuditEventPublic(
        id=str(row.id),
        proposal_id=str(row.proposal_id),
        event_type=row.event_type,
        actor_type=row.actor_type,
        actor_id=str(row.actor_id) if row.actor_id else None,
        event_json=row.event_json or {},
        created_at=row.created_at,
    )


def _moderation_case_public(row: ModerationCase) -> ModerationCasePublic:
    return ModerationCasePublic(
        id=str(row.id),
        subject_type=row.subject_type,
        subject_id=str(row.subject_id),
        reason_code=row.reason_code,
        status=row.status,
        opened_by=str(row.opened_by) if row.opened_by else None,
        resolved_by=str(row.resolved_by) if row.resolved_by else None,
        resolution=row.resolution,
        created_at=row.created_at,
        resolved_at=row.resolved_at,
    )


@router.post("/proposals", response_model=GovernanceProposalPublic, status_code=201)
async def create_proposal(
    body: GovernanceProposalCreateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    target_id = None
    if body.target_id:
        try:
            target_id = UUID(body.target_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target_id")
    proposal = GovernanceProposal(
        kind=body.kind,
        target_type=body.target_type,
        target_id=target_id,
        payload_json=body.payload_json,
        status="draft",
        created_by=UUID(user_id),
    )
    session.add(proposal)
    await session.flush()
    session.add(
        GovernanceAuditLog(
            proposal_id=proposal.id,
            event_type="proposal_created",
            actor_type="user",
            actor_id=UUID(user_id),
            event_json={"status": proposal.status, "kind": body.kind, "target_type": body.target_type},
        )
    )
    await session.flush()
    await session.refresh(proposal)
    return _proposal_public(proposal)


@router.get("/proposals", response_model=Pagination[GovernanceProposalPublic])
async def list_proposals(
    session: DbSession,
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    q = select(GovernanceProposal).order_by(GovernanceProposal.created_at.desc()).limit(limit)
    if status:
        q = q.where(GovernanceProposal.status == status)
    rows = (await session.execute(q)).scalars().all()
    return Pagination(items=[_proposal_public(r) for r in rows], next_cursor=None)


@router.get("/proposals/{proposal_id}", response_model=GovernanceProposalPublic)
async def get_proposal(proposal_id: UUID, session: DbSession):
    row = await session.get(GovernanceProposal, proposal_id)
    if not row:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return _proposal_public(row)


@router.post("/proposals/{proposal_id}/submit", response_model=GovernanceProposalPublic)
async def submit_for_review(
    proposal_id: UUID,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await session.get(GovernanceProposal, proposal_id)
    if not row:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if row.status != "draft":
        raise HTTPException(status_code=409, detail="Only draft proposals can be submitted")
    row.status = "review"
    session.add(
        GovernanceAuditLog(
            proposal_id=row.id,
            event_type="proposal_submitted",
            actor_type="user",
            actor_id=UUID(user_id),
            event_json={"status": row.status},
        )
    )
    await session.flush()
    await session.refresh(row)
    return _proposal_public(row)


@router.post("/proposals/{proposal_id}/vote")
async def vote_proposal(
    proposal_id: UUID,
    body: GovernanceVoteRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await session.get(GovernanceProposal, proposal_id)
    if not row:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if row.status != "review":
        raise HTTPException(status_code=409, detail="Votes are allowed only in review status")
    voter_id = UUID(user_id)
    existing = (
        await session.execute(
            select(GovernanceVote).where(
                GovernanceVote.proposal_id == proposal_id,
                GovernanceVote.voter_type == "user",
                GovernanceVote.voter_id == voter_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        existing.vote = body.vote
        existing.reason = body.reason
    else:
        session.add(
            GovernanceVote(
                proposal_id=proposal_id,
                voter_type="user",
                voter_id=voter_id,
                vote=body.vote,
                reason=body.reason,
            )
        )
    session.add(
        GovernanceAuditLog(
            proposal_id=proposal_id,
            event_type="proposal_voted",
            actor_type="user",
            actor_id=voter_id,
            event_json={"vote": body.vote, "reason": body.reason},
        )
    )
    await session.flush()
    return {"ok": True}


@router.post("/proposals/{proposal_id}/decide", response_model=GovernanceProposalPublic)
async def decide_proposal(
    proposal_id: UUID,
    body: GovernanceProposalDecisionRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await session.get(GovernanceProposal, proposal_id)
    if not row:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if body.decision in ("draft", "review"):
        raise HTTPException(status_code=400, detail="Invalid decision")
    _validate_transition(row.status, body.decision)
    if body.decision in ("rejected", "appealed") and not (body.reason or "").strip():
        raise HTTPException(
            status_code=400,
            detail="Reason is required for rejected/appealed decisions",
        )
    row.status = body.decision
    row.reviewed_by = UUID(user_id)
    row.decision_reason = body.reason
    row.decided_at = datetime.utcnow()
    session.add(
        GovernanceAuditLog(
            proposal_id=proposal_id,
            event_type="proposal_decided",
            actor_type="user",
            actor_id=UUID(user_id),
            event_json={"decision": body.decision, "reason": body.reason},
        )
    )
    await session.flush()
    await session.refresh(row)
    return _proposal_public(row)


@router.get("/proposals/{proposal_id}/audit", response_model=Pagination[GovernanceAuditEventPublic])
async def proposal_audit(proposal_id: UUID, session: DbSession, limit: int = Query(100, ge=1, le=500)):
    q = (
        select(GovernanceAuditLog)
        .where(GovernanceAuditLog.proposal_id == proposal_id)
        .order_by(GovernanceAuditLog.created_at.desc())
        .limit(limit)
    )
    rows = (await session.execute(q)).scalars().all()
    return Pagination(items=[_audit_public(r) for r in rows], next_cursor=None)


@moderation_cases_router.post("", response_model=ModerationCasePublic, status_code=201)
async def open_case(
    body: ModerationCaseCreateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    try:
        subject_id = UUID(body.subject_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subject_id")
    row = ModerationCase(
        subject_type=body.subject_type,
        subject_id=subject_id,
        reason_code=body.reason_code,
        status="open",
        opened_by=UUID(user_id),
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return _moderation_case_public(row)


@moderation_cases_router.get("", response_model=Pagination[ModerationCasePublic])
async def list_cases(session: DbSession, status: str | None = Query(None), limit: int = Query(50, ge=1, le=200)):
    q = select(ModerationCase).order_by(ModerationCase.created_at.desc()).limit(limit)
    if status:
        q = q.where(ModerationCase.status == status)
    rows = (await session.execute(q)).scalars().all()
    return Pagination(items=[_moderation_case_public(r) for r in rows], next_cursor=None)


@moderation_cases_router.post("/{case_id}/resolve", response_model=ModerationCasePublic)
async def resolve_case(
    case_id: UUID,
    body: ModerationCaseResolveRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await session.get(ModerationCase, case_id)
    if not row:
        raise HTTPException(status_code=404, detail="Moderation case not found")
    if row.status not in ("open", "appealed"):
        raise HTTPException(status_code=409, detail="Only open/appealed cases can be resolved")
    row.status = body.status
    row.resolution = body.resolution
    row.resolved_by = UUID(user_id)
    row.resolved_at = datetime.utcnow()
    await session.flush()
    await session.refresh(row)
    return _moderation_case_public(row)


@moderation_cases_router.post("/{case_id}/actions")
async def apply_action_from_case(
    case_id: UUID,
    body: ModerationActionFromCaseRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = await session.get(ModerationCase, case_id)
    if not row:
        raise HTTPException(status_code=404, detail="Moderation case not found")
    if row.status != "open":
        raise HTTPException(status_code=409, detail="Actions can be applied only to open cases")

    mapped_action = "suspend" if body.action == "ban" else body.action
    if row.subject_type not in ("agent", "strategy", "listing", "vertical", "pool"):
        raise HTTPException(status_code=400, detail=f"Unsupported subject_type: {row.subject_type}")

    from app.schemas.moderation import ModerationActionRequest
    from app.api.routers.moderation import apply_moderation_action

    await apply_moderation_action(
        ModerationActionRequest(
            target_type=row.subject_type,
            target_id=str(row.subject_id),
            action=mapped_action,
            reason=(body.reason or "").strip() or f"case:{row.id}:{row.reason_code}",
        ),
        session,
    )
    await session.flush()
    return {"ok": True, "case_id": str(row.id), "action": mapped_action}
