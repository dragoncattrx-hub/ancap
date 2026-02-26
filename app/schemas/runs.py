from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional

from pydantic import BaseModel


class RunState(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    killed = "killed"


class RunRequest(BaseModel):
    strategy_version_id: str
    pool_id: str
    parent_run_id: Optional[str] = None
    params: Optional[dict[str, Any]] = None
    limits: Optional[dict[str, Any]] = None
    dry_run: bool = False
    run_mode: Literal["mock", "backtest"] = "mock"  # PLAN §5: backtest = explicit dry-run semantics


class RunReplayRequest(BaseModel):
    """ROADMAP §5 partial replay: create a new run with same inputs as the given run. from_step_index=0 or omit: full replay; from_step_index>0: reserved (requires stored step context)."""
    run_id: str
    from_step_index: Optional[int] = None  # 0 or None = full replay; >0 = future: replay from step N


class RunPublic(BaseModel):
    id: str
    strategy_version_id: str
    pool_id: str
    parent_run_id: Optional[str] = None
    state: RunState
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    inputs_hash: Optional[str] = None
    workflow_hash: Optional[str] = None
    outputs_hash: Optional[str] = None
    env_hash: Optional[str] = None
    run_mode: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
