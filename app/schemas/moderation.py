from pydantic import BaseModel, Field


class ModerationActionRequest(BaseModel):
    target_type: str = Field(..., pattern="^(agent|strategy|listing|vertical|pool)$")
    target_id: str
    action: str = Field(
        ...,
        pattern="^(suspend|unsuspend|quarantine|unquarantine|halt|unhalt|reject)$",
    )
    reason: str | None = Field(None, max_length=2000)


class AgentLinkCreateRequest(BaseModel):
    agent_id: str
    linked_agent_id: str
    link_type: str = Field(..., pattern="^(manual|same_owner|same_key|heuristic)$")
    confidence: float = Field(1.0, ge=0, le=1)
