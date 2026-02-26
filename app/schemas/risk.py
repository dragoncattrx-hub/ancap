"""Risk API schemas."""
from typing import Any, Dict

from pydantic import BaseModel, Field


class RiskLimitsRequest(BaseModel):
    """Set risk policy (limits) for a scope."""
    scope_type: str = Field(..., pattern="^(pool|agent|strategy|vertical|global)$", description="Scope type")
    scope_id: str = Field(..., description="UUID of the scope entity (e.g. pool_id, agent_id)")
    policy_json: Dict[str, Any] = Field(..., description="Policy spec: max_steps, max_runtime_ms, max_loss_pct, etc.")


class RiskLimitsResponse(BaseModel):
    """Response after setting limits."""
    ok: bool = True
    scope_type: str
    scope_id: str
    message: str = "Limits updated"


class RiskKillRequest(BaseModel):
    """Kill (halt) a scope via circuit breaker."""
    scope_type: str = Field(..., pattern="^(pool|agent|strategy)$", description="Scope type")
    scope_id: str = Field(..., description="UUID of the scope entity")


class RiskKillResponse(BaseModel):
    """Response after kill."""
    ok: bool = True
    scope_type: str
    scope_id: str
    state: str = "halted"
    message: str = "Circuit breaker set to halted"


class RiskStatusResponse(BaseModel):
    """Risk status for a run."""
    run_id: str
    state: str
    killed_by_risk: bool = Field(..., description="True if run was killed by risk (e.g. max_loss_pct)")
    failure_reason: str | None = None
