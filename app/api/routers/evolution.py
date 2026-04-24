from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc

from app.api.deps import DbSession, require_auth
from app.db.models import (
    Strategy,
    StrategyMutation,
    Tournament,
    TournamentEntry,
    BugBountyReport,
)
from app.schemas import (
    StrategyMutationCreateRequest,
    StrategyMutationPublic,
    TournamentCreateRequest,
    TournamentEntryAddRequest,
    TournamentPublic,
    TournamentEntryPublic,
    BugBountyReportCreateRequest,
    BugBountyReportPublic,
)

router = APIRouter(prefix="/evolution", tags=["Evolution"])
tournaments_router = APIRouter(prefix="/competitions", tags=["Competitions"])
bounties_router = APIRouter(prefix="/bounties", tags=["Bug Bounties"])


@router.post("/mutations", response_model=StrategyMutationPublic, status_code=201)
async def create_mutation(
    body: StrategyMutationCreateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    parent_id = UUID(body.parent_strategy_id)
    parent = await session.get(Strategy, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent strategy not found")
    row = StrategyMutation(
        parent_strategy_id=parent_id,
        mutation_type=body.mutation_type,
        diff_spec=body.diff_spec,
        status="proposed",
    )
    session.add(row)
    await session.flush()
    return StrategyMutationPublic(
        id=str(row.id),
        parent_strategy_id=str(row.parent_strategy_id),
        child_strategy_id=str(row.child_strategy_id) if row.child_strategy_id else None,
        mutation_type=row.mutation_type,
        diff_spec=row.diff_spec or {},
        evaluation_score=float(row.evaluation_score) if row.evaluation_score is not None else None,
        status=row.status,
        created_at=row.created_at,
    )


@router.get("/strategies/{strategy_id}/lineage", response_model=list[StrategyMutationPublic])
async def get_strategy_lineage(strategy_id: UUID, session: DbSession, limit: int = 100):
    q = (
        select(StrategyMutation)
        .where(
            (StrategyMutation.parent_strategy_id == strategy_id)
            | (StrategyMutation.child_strategy_id == strategy_id)
        )
        .order_by(desc(StrategyMutation.created_at))
        .limit(min(max(limit, 1), 500))
    )
    rows = (await session.execute(q)).scalars().all()
    return [
        StrategyMutationPublic(
            id=str(x.id),
            parent_strategy_id=str(x.parent_strategy_id),
            child_strategy_id=str(x.child_strategy_id) if x.child_strategy_id else None,
            mutation_type=x.mutation_type,
            diff_spec=x.diff_spec or {},
            evaluation_score=float(x.evaluation_score) if x.evaluation_score is not None else None,
            status=x.status,
            created_at=x.created_at,
        )
        for x in rows
    ]


@tournaments_router.post("/tournaments", response_model=TournamentPublic, status_code=201)
async def create_tournament(body: TournamentCreateRequest, session: DbSession, user_id: str = Depends(require_auth)):
    row = Tournament(name=body.name, scoring_metric=body.scoring_metric, status="scheduled")
    session.add(row)
    await session.flush()
    return TournamentPublic(
        id=str(row.id),
        name=row.name,
        status=row.status,
        scoring_metric=row.scoring_metric,
        starts_at=row.starts_at,
        ends_at=row.ends_at,
        created_at=row.created_at,
    )


@tournaments_router.post("/tournaments/{tournament_id}/entries", response_model=TournamentEntryPublic, status_code=201)
async def add_tournament_entry(
    tournament_id: UUID,
    body: TournamentEntryAddRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    t = await session.get(Tournament, tournament_id)
    if not t:
        raise HTTPException(status_code=404, detail="Tournament not found")
    sid = UUID(body.strategy_id)
    s = await session.get(Strategy, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    row = TournamentEntry(
        tournament_id=tournament_id,
        strategy_id=sid,
        agent_id=UUID(body.agent_id) if body.agent_id else None,
        score=Decimal("0"),
    )
    session.add(row)
    await session.flush()
    return TournamentEntryPublic(
        id=str(row.id),
        tournament_id=str(row.tournament_id),
        strategy_id=str(row.strategy_id),
        agent_id=str(row.agent_id) if row.agent_id else None,
        score=str(row.score),
        rank=row.rank,
        created_at=row.created_at,
    )


@tournaments_router.get("/tournaments/{tournament_id}/leaderboard", response_model=list[TournamentEntryPublic])
async def tournament_leaderboard(tournament_id: UUID, session: DbSession, limit: int = 100):
    q = (
        select(TournamentEntry)
        .where(TournamentEntry.tournament_id == tournament_id)
        .order_by(desc(TournamentEntry.score), TournamentEntry.created_at.asc())
        .limit(min(max(limit, 1), 500))
    )
    rows = (await session.execute(q)).scalars().all()
    out = []
    for i, x in enumerate(rows, start=1):
        out.append(
            TournamentEntryPublic(
                id=str(x.id),
                tournament_id=str(x.tournament_id),
                strategy_id=str(x.strategy_id),
                agent_id=str(x.agent_id) if x.agent_id else None,
                score=str(x.score),
                rank=x.rank if x.rank is not None else i,
                created_at=x.created_at,
            )
        )
    return out


@bounties_router.post("/reports", response_model=BugBountyReportPublic, status_code=201)
async def create_bounty_report(
    body: BugBountyReportCreateRequest,
    session: DbSession,
    user_id: str = Depends(require_auth),
):
    row = BugBountyReport(
        reporter_user_id=UUID(user_id),
        reporter_agent_id=UUID(body.reporter_agent_id) if body.reporter_agent_id else None,
        title=body.title,
        description=body.description,
        severity=body.severity,
        status="submitted",
    )
    session.add(row)
    await session.flush()
    return BugBountyReportPublic(
        id=str(row.id),
        reporter_user_id=str(row.reporter_user_id) if row.reporter_user_id else None,
        reporter_agent_id=str(row.reporter_agent_id) if row.reporter_agent_id else None,
        title=row.title,
        description=row.description,
        severity=row.severity,
        status=row.status,
        reward_currency=row.reward_currency,
        reward_amount=str(row.reward_amount) if row.reward_amount is not None else None,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@bounties_router.get("/reports", response_model=list[BugBountyReportPublic])
async def list_bounty_reports(
    session: DbSession,
    user_id: str = Depends(require_auth),
    limit: int = 100,
):
    uid = UUID(user_id)
    q = (
        select(BugBountyReport)
        .where(BugBountyReport.reporter_user_id == uid)
        .order_by(desc(BugBountyReport.created_at))
        .limit(min(max(limit, 1), 500))
    )
    rows = (await session.execute(q)).scalars().all()
    return [
        BugBountyReportPublic(
            id=str(x.id),
            reporter_user_id=str(x.reporter_user_id) if x.reporter_user_id else None,
            reporter_agent_id=str(x.reporter_agent_id) if x.reporter_agent_id else None,
            title=x.title,
            description=x.description,
            severity=x.severity,
            status=x.status,
            reward_currency=x.reward_currency,
            reward_amount=str(x.reward_amount) if x.reward_amount is not None else None,
            created_at=x.created_at,
            updated_at=x.updated_at,
        )
        for x in rows
    ]

