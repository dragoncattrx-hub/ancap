from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class StrategyMutationCreateRequest(BaseModel):
    parent_strategy_id: str
    mutation_type: str = Field(default="change_param", min_length=3, max_length=32)
    diff_spec: dict = Field(default_factory=dict)


class StrategyMutationPublic(BaseModel):
    id: str
    parent_strategy_id: str
    child_strategy_id: str | None = None
    mutation_type: str
    diff_spec: dict
    evaluation_score: float | None = None
    status: str
    created_at: datetime


class TournamentCreateRequest(BaseModel):
    name: str
    scoring_metric: str = "evaluation_score"


class TournamentEntryAddRequest(BaseModel):
    strategy_id: str
    agent_id: str | None = None


class TournamentPublic(BaseModel):
    id: str
    name: str
    status: str
    scoring_metric: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    created_at: datetime


class TournamentEntryPublic(BaseModel):
    id: str
    tournament_id: str
    strategy_id: str
    agent_id: str | None = None
    score: str
    rank: int | None = None
    created_at: datetime


class BugBountyReportCreateRequest(BaseModel):
    reporter_agent_id: str | None = None
    title: str
    description: str
    severity: str = "medium"


class BugBountyReportPublic(BaseModel):
    id: str
    reporter_user_id: str | None = None
    reporter_agent_id: str | None = None
    title: str
    description: str
    severity: str
    status: str
    reward_currency: str | None = None
    reward_amount: str | None = None
    created_at: datetime
    updated_at: datetime

