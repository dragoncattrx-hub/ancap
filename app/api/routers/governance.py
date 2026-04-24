from uuid import UUID

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func

from app.api.deps import DbSession, require_auth
from app.config import get_settings
from app.db.models import (
    GovernanceProposal,
    GovernanceVote,
    GovernanceAuditLog,
    ModerationCase,
    Agent,
    ReputationSnapshot,
    Stake,
    StakeStatusEnum,
    RiskPolicy,
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


async def _compute_user_vote_weight(session: DbSession, user_id: UUID) -> float:
    """
    Reputation-weighted vote for user:
    base 1.0 + avg(agent rep score/100) + log1p(active stake ACP)/10.
    """
    agent_rows = (
        await session.execute(
            select(Agent.id).where(Agent.owner_user_id == user_id).limit(50)
        )
    ).all()
    agent_ids = [x[0] for x in agent_rows]
    if not agent_ids:
        return 1.0

    rep_q = (
        select(func.coalesce(func.avg(ReputationSnapshot.score), 0))
        .where(
            ReputationSnapshot.subject_type == "agent",
            ReputationSnapshot.subject_id.in_(agent_ids),
            ReputationSnapshot.window == "90d",
            ReputationSnapshot.algo_version == "rep2-v1",
        )
    )
    rep_avg = float((await session.execute(rep_q)).scalar() or 0.0)

    stake_q = (
        select(func.coalesce(func.sum(Stake.amount_value), 0))
        .where(
            Stake.agent_id.in_(agent_ids),
            Stake.status == StakeStatusEnum.active,
            Stake.amount_currency == "ACP",
        )
    )
    stake_sum = float((await session.execute(stake_q)).scalar() or 0.0)
    stake_bonus = 0.0
    if stake_sum > 0:
        import math
        stake_bonus = math.log1p(stake_sum) / 10.0
    return max(1.0, 1.0 + (rep_avg / 100.0) + stake_bonus)


async def _auto_apply_proposal_if_enabled(session: DbSession, proposal: GovernanceProposal, actor_id: UUID) -> dict:
    settings = get_settings()
    if not settings.ff_governance_auto_apply:
        return {"applied": False, "reason": "feature_flag_disabled"}
    if proposal.status != "active":
        return {"applied": False, "reason": "proposal_not_active"}

    payload = proposal.payload_json or {}
    # Guarded scope: policy target only (risk_policies upsert)
    if proposal.target_type != "policy":
        return {"applied": False, "reason": "unsupported_target_type"}
    scope_type = str(payload.get("scope_type") or "global")
    scope_id_raw = payload.get("scope_id") or "00000000-0000-0000-0000-000000000000"
    policy_json = payload.get("policy_json")
    if not isinstance(policy_json, dict):
        return {"applied": False, "reason": "missing_policy_json"}
    try:
        scope_id = UUID(str(scope_id_raw))
    except ValueError:
        return {"applied": False, "reason": "invalid_scope_id"}

    row = (
        await session.execute(
            select(RiskPolicy).where(RiskPolicy.scope_type == scope_type, RiskPolicy.scope_id == scope_id).limit(1)
        )
    ).scalar_one_or_none()
    if row:
        row.policy_json = policy_json
    else:
        row = RiskPolicy(scope_type=scope_type, scope_id=scope_id, policy_json=policy_json)
        session.add(row)

    session.add(
        GovernanceAuditLog(
            proposal_id=proposal.id,
            event_type="proposal_auto_applied",
            actor_type="user",
            actor_id=actor_id,
            event_json={"scope_type": scope_type, "scope_id": str(scope_id)},
        )
    )
    await session.flush()
    return {"applied": True, "scope_type": scope_type, "scope_id": str(scope_id)}


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
    vote_weight = await _compute_user_vote_weight(session, voter_id)
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
        existing.vote_weight = vote_weight
    else:
        session.add(
            GovernanceVote(
                proposal_id=proposal_id,
                voter_type="user",
                voter_id=voter_id,
                vote_weight=vote_weight,
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
            event_json={"vote": body.vote, "reason": body.reason, "vote_weight": vote_weight},
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
    auto_apply = await _auto_apply_proposal_if_enabled(session, row, UUID(user_id))
    if auto_apply.get("applied"):
        row.decision_reason = ((row.decision_reason or "").strip() + " [auto-applied]").strip()
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
