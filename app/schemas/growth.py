from __future__ import annotations

from datetime import datetime, date
from typing import Any, Optional

from pydantic import BaseModel, Field


class FaucetClaimRequest(BaseModel):
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    currency: str = "ACP"
    amount: str = "10"


class FaucetClaimPublic(BaseModel):
    id: str
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    currency: str
    amount: str
    claim_status: str
    risk_flags: dict[str, Any] = Field(default_factory=dict)
    ledger_tx_id: Optional[str] = None
    created_at: datetime


class StarterPackAssignRequest(BaseModel):
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    starter_pack_code: str = "default"


class StarterPackAssignmentPublic(BaseModel):
    id: str
    starter_pack_id: str
    user_id: Optional[str] = None
    agent_id: Optional[str] = None
    status: str
    assigned_at: datetime
    activated_at: Optional[datetime] = None


class QuickstartRunRequest(BaseModel):
    owner_agent_id: str


class ReferralCodeCreateRequest(BaseModel):
    owner_user_id: Optional[str] = None
    owner_agent_id: Optional[str] = None


class ReferralCodePublic(BaseModel):
    id: str
    code: str
    is_active: bool
    owner_user_id: Optional[str] = None
    owner_agent_id: Optional[str] = None
    created_at: datetime


class ReferralAttributeRequest(BaseModel):
    code: str
    referred_user_id: Optional[str] = None
    referred_agent_id: Optional[str] = None
    source: str = "signup"


class ReferralAttributionPublic(BaseModel):
    id: str
    referral_code_id: str
    referred_user_id: Optional[str] = None
    referred_agent_id: Optional[str] = None
    attributed_at: datetime
    source: str
    status: str


class ReferralSummaryPublic(BaseModel):
    total_attributions: int
    pending: int
    eligible: int
    rewarded: int
    rejected: int
    total_reward_amount: str
    reward_currency: str
    total_reward_events: int = 0
    total_reward_acp_amount: str = "0"
    signup_bonus_acp_amount: str = "0"
    commission_share_acp_amount: str = "0"


class ReferralRewardEventPublic(BaseModel):
    id: str
    trigger_type: str
    trigger_ref_type: str
    trigger_ref_id: str
    currency: str
    amount_value: str
    created_at: datetime


class FollowRequest(BaseModel):
    target_id: str
    as_agent_id: Optional[str] = None


class CopyStrategyRequest(BaseModel):
    source_strategy_id: str
    as_agent_id: Optional[str] = None
    new_name: Optional[str] = None


class PublicFeedItem(BaseModel):
    id: str
    event_type: str
    ref_type: str
    ref_id: str
    visibility: str
    score: str
    payload: dict[str, Any]
    created_at: datetime


class NotificationPublic(BaseModel):
    id: str
    type: str
    priority: str
    payload: dict[str, Any]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None


class LeaderboardEntryPublic(BaseModel):
    rank: int
    subject_id: str
    score: str
    components: dict[str, Any]


class GrowthMetricItemPublic(BaseModel):
    metric_date: date
    metric_key: str
    metric_value: str
    dimensions: dict[str, Any]


class TaskFeedItemPublic(BaseModel):
    id: str
    task_type: str
    title: str
    description: Optional[str] = None
    reward_currency: Optional[str] = None
    reward_amount: Optional[str] = None
    status: str
    score: str
    created_at: datetime
    expires_at: Optional[datetime] = None

