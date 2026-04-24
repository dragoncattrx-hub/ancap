"""SQLAlchemy models for ANCAP Core Engine."""
import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Boolean, Numeric, DateTime, Date, ForeignKey, Enum as SQLEnum, Index, Column,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


# --- Enums (Python enum for DB layer) ---
class AgentStatusEnum(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    quarantined = "quarantined"


class VerticalStatusEnum(str, enum.Enum):
    proposed = "proposed"
    approved = "approved"
    active = "active"
    deprecated = "deprecated"
    rejected = "rejected"


class StrategyStatusEnum(str, enum.Enum):
    draft = "draft"
    published = "published"
    paused = "paused"
    retired = "retired"


class ListingStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class OrderStatusEnum(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"
    refunded = "refunded"


class AccessScopeEnum(str, enum.Enum):
    view = "view"
    execute = "execute"
    allocate = "allocate"


class RiskProfileEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    experimental = "experimental"


class PoolStatusEnum(str, enum.Enum):
    active = "active"
    halted = "halted"
    archived = "archived"


class LedgerEventTypeEnum(str, enum.Enum):
    deposit = "deposit"
    withdraw = "withdraw"
    allocate = "allocate"
    deallocate = "deallocate"
    pnl = "pnl"
    fee = "fee"
    refund = "refund"
    transfer = "transfer"
    contract_escrow = "contract_escrow"
    contract_payout = "contract_payout"
    stake = "stake"
    unstake = "unstake"
    slash = "slash"


class RunStateEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    killed = "killed"


class OwnerTypeEnum(str, SQLEnum):
    user = "user"
    agent = "agent"
    pool_treasury = "pool_treasury"


# --- Identity ---
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(80), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    display_name = Column(String(80), nullable=False)
    public_key = Column(Text, nullable=True)
    roles = Column(JSONB, nullable=False)  # list of AgentRoleEnum values
    status = Column(SQLEnum(AgentStatusEnum), default=AgentStatusEnum.active)
    metadata_ = Column("metadata", JSONB, nullable=True)
    owner_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    attestation_id = Column(UUID(as_uuid=False), ForeignKey("agent_attestations.id", ondelete="SET NULL"), nullable=True)
    created_by_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)  # when stake/attestation activated
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    strategies = relationship("Strategy", back_populates="owner_agent", foreign_keys="Strategy.owner_agent_id")
    created_by_agent = relationship("Agent", remote_side="Agent.id", foreign_keys=[created_by_agent_id])
    owner_user = relationship("User", foreign_keys=[owner_user_id])


class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    key_prefix = Column(String(24), nullable=False, unique=True, index=True)
    key_hash = Column(String(64), nullable=False)
    scope = Column(String(64), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class AgentLinkTypeEnum(str, enum.Enum):
    same_owner = "same_owner"
    same_key = "same_key"
    manual = "manual"
    heuristic = "heuristic"


class AgentLink(Base):
    __tablename__ = "agent_links"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    linked_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    link_type = Column(String(32), nullable=False)
    confidence = Column(Numeric(3, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (Index("uq_agent_links_pair", "agent_id", "linked_agent_id", unique=True),)


class AgentRelationship(Base):
    """Agent Graph Index (ROADMAP 2.1): edges for anti-sybil, reciprocity, cycles.
    One row per interaction (order, review, etc.); weight = amount or 1.
    """
    __tablename__ = "agent_relationships"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    source_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    target_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    relation_type = Column(String(32), nullable=False, index=True)  # order, review, contract, grant, same_owner
    weight = Column(Numeric(36, 18), nullable=False, default=1)
    ref_type = Column(String(32), nullable=True)  # order, review, ...
    ref_id = Column(UUID(as_uuid=False), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_agent_relationships_pair_type", "source_agent_id", "target_agent_id", "relation_type"),
        Index("ix_agent_relationships_target", "target_agent_id", "relation_type"),
    )


# --- Verticals ---
class Vertical(Base):
    __tablename__ = "verticals"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(80), nullable=False, index=True)
    status = Column(SQLEnum(VerticalStatusEnum), default=VerticalStatusEnum.proposed)
    owner_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class VerticalSpec(Base):
    __tablename__ = "vertical_specs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    vertical_id = Column(UUID(as_uuid=False), ForeignKey("verticals.id", ondelete="CASCADE"), nullable=False)
    spec_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


# --- Strategies ---
class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False, index=True)
    vertical_id = Column(UUID(as_uuid=False), ForeignKey("verticals.id"), nullable=False)
    status = Column(SQLEnum(StrategyStatusEnum), default=StrategyStatusEnum.draft)
    owner_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id"), nullable=False)
    summary = Column(String(300), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=True)  # list of strings
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    owner_agent = relationship("Agent", back_populates="strategies", foreign_keys=[owner_agent_id])
    versions = relationship("StrategyVersion", back_populates="strategy", order_by="StrategyVersion.created_at.desc()")
    listings = relationship("Listing", back_populates="strategy")


class StrategyVersion(Base):
    __tablename__ = "strategy_versions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=False), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False)
    semver = Column(String(32), nullable=False)
    workflow_json = Column(JSONB, nullable=False)
    param_schema = Column(JSONB, nullable=True)
    changelog = Column(Text, nullable=True)
    strategy_policy = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    strategy = relationship("Strategy", back_populates="versions")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=False), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False)
    strategy_version_id = Column(
        UUID(as_uuid=False),
        ForeignKey("strategy_versions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    fee_model = Column(JSONB, nullable=False)
    status = Column(SQLEnum(ListingStatusEnum), default=ListingStatusEnum.active)
    terms_url = Column(String(500), nullable=True)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    strategy = relationship("Strategy", back_populates="listings")


# --- Orders / Access ---
class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=False), ForeignKey("listings.id"), nullable=False)
    buyer_type = Column(String(20), nullable=False)  # user, agent, pool
    buyer_id = Column(UUID(as_uuid=False), nullable=False)
    status = Column(SQLEnum(OrderStatusEnum), default=OrderStatusEnum.pending)
    amount_currency = Column(String(10), nullable=True)
    amount_value = Column(Numeric(36, 18), nullable=True)
    payment_method = Column(String(64), nullable=True)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class AccessGrant(Base):
    __tablename__ = "access_grants"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=False), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False)
    grantee_type = Column(String(20), nullable=False)
    grantee_id = Column(UUID(as_uuid=False), nullable=False)
    scope = Column(SQLEnum(AccessScopeEnum), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


# --- Pools / Capital ---
class Pool(Base):
    __tablename__ = "pools"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False, index=True)
    risk_profile = Column(SQLEnum(RiskProfileEnum), nullable=False)
    status = Column(SQLEnum(PoolStatusEnum), default=PoolStatusEnum.active)
    rules = Column(JSONB, nullable=True)
    fee_model = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class AccountKindEnum(str, enum.Enum):
    """System account kinds for unambiguous routing (ROADMAP §3)."""
    treasury = "treasury"
    external = "external"
    fees = "fees"
    escrow = "escrow"
    burn = "burn"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    owner_type = Column(String(20), nullable=False)
    owner_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    account_kind = Column(String(20), nullable=True, index=True)  # treasury|fees|escrow|burn|external; null = participant
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (Index("ix_accounts_owner_type_id", "owner_type", "owner_id", unique=True),)


class LedgerEvent(Base):
    __tablename__ = "ledger_events"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    ts = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    type = Column(SQLEnum(LedgerEventTypeEnum), nullable=False)
    amount_currency = Column(String(10), nullable=False)
    amount_value = Column(Numeric(36, 18), nullable=False)
    src_account_id = Column(UUID(as_uuid=False), ForeignKey("accounts.id"), nullable=True)
    dst_account_id = Column(UUID(as_uuid=False), ForeignKey("accounts.id"), nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=True)


class Share(Base):
    __tablename__ = "shares"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    pool_id = Column(UUID(as_uuid=False), ForeignKey("pools.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=False), nullable=False)
    share_balance = Column(Numeric(36, 18), default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


# --- Execution ---
class Run(Base):
    __tablename__ = "runs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    strategy_version_id = Column(UUID(as_uuid=False), ForeignKey("strategy_versions.id"), nullable=False)
    pool_id = Column(UUID(as_uuid=False), ForeignKey("pools.id"), nullable=False)
    parent_run_id = Column(UUID(as_uuid=False), ForeignKey("runs.id", ondelete="SET NULL"), nullable=True)
    contract_id = Column(UUID(as_uuid=False), ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True)
    contract_milestone_id = Column(UUID(as_uuid=False), ForeignKey("contract_milestones.id", ondelete="SET NULL"), nullable=True, index=True)
    state = Column(SQLEnum(RunStateEnum), default=RunStateEnum.queued)
    params = Column(JSONB, nullable=True)
    limits = Column(JSONB, nullable=True)
    dry_run = Column(Boolean, default=False)
    run_mode = Column(String(16), default="mock", nullable=False)  # mock | backtest (PLAN §5)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    inputs_hash = Column(Text, nullable=True)
    workflow_hash = Column(Text, nullable=True)
    outputs_hash = Column(Text, nullable=True)
    env_hash = Column(Text, nullable=True)  # L1 audit: hash of pool_id + limits
    proof_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class RunLog(Base):
    __tablename__ = "run_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=False), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    ts = Column(DateTime(timezone=True), default=datetime.utcnow)
    level = Column(String(16), nullable=False)
    message = Column(Text, nullable=False)


class RunStep(Base):
    """Execution DAG (ROADMAP §5): one step per workflow step; parent_step_index for DAG edges; step_score for step-level scoring."""
    __tablename__ = "run_steps"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=False), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    step_index = Column(Integer, nullable=False)
    step_id = Column(String(128), nullable=False)
    parent_step_index = Column(Integer, nullable=True)
    action = Column(String(64), nullable=False)
    state = Column(String(32), nullable=False)  # succeeded, failed, skipped
    duration_ms = Column(Integer, nullable=True)
    result_summary = Column(JSONB, nullable=True)
    artifact_hash = Column(Text, nullable=True)
    score_value = Column(Numeric(10, 4), nullable=True)
    score_type = Column(String(32), nullable=True)
    context_after = Column(JSONB, nullable=True)  # ROADMAP §5: context after step for replay from step N
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class RunStepScore(Base):
    """ROADMAP §5: alternative score_type (latency, quality) per step; one row per (run_step_id, score_type)."""
    __tablename__ = "run_step_scores"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    run_step_id = Column(UUID(as_uuid=False), ForeignKey("run_steps.id", ondelete="CASCADE"), nullable=False)
    score_type = Column(String(32), nullable=False)
    score_value = Column(Numeric(10, 4), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


# --- Metrics ---
class MetricRecord(Base):
    __tablename__ = "metrics"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=False), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(64), nullable=False, index=True)
    value = Column(JSONB, nullable=False)  # number, string, or object
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    strategy_version_id = Column(UUID(as_uuid=False), ForeignKey("strategy_versions.id", ondelete="CASCADE"), nullable=False)
    score = Column(Numeric(5, 4), nullable=False)  # 0..1
    confidence = Column(Numeric(5, 4), nullable=False)
    sample_size = Column(Integer, default=0)
    percentile_in_vertical = Column(Numeric(5, 4), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


# --- Risk (optional for MVP) ---
class RiskPolicy(Base):
    __tablename__ = "risk_policies"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    scope_type = Column(String(32), nullable=False)
    scope_id = Column(UUID(as_uuid=False), nullable=False)
    policy_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class CircuitBreaker(Base):
    __tablename__ = "circuit_breakers"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    scope_type = Column(String(32), nullable=False)
    scope_id = Column(UUID(as_uuid=False), nullable=False)
    state = Column(String(32), default="normal")  # normal, limited, halted
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


# --- Reputation 2.0 enums (stored as string in DB) ---
class ReputationEventTypeEnum(str, enum.Enum):
    order_fulfilled = "order_fulfilled"
    order_refunded = "order_refunded"
    access_granted = "access_granted"
    run_completed = "run_completed"
    evaluation_scored = "evaluation_scored"
    contract_accepted = "contract_accepted"
    contract_completed = "contract_completed"
    contract_cancelled = "contract_cancelled"
    audit_passed = "audit_passed"
    audit_failed = "audit_failed"
    moderation_penalty = "moderation_penalty"
    moderation_clear = "moderation_clear"


class EdgeTypeEnum(str, enum.Enum):
    order = "order"
    grant = "grant"
    run_for = "run_for"
    review = "review"
    ledger_transfer = "ledger_transfer"


# --- Reputation (simplified, legacy) ---
class Reputation(Base):
    __tablename__ = "reputations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    subject_type = Column(String(32), nullable=False)
    subject_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    score = Column(Numeric(5, 4), default=0)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (Index("ix_reputations_subject", "subject_type", "subject_id", unique=True),)


# --- Reputation 2.0 (event sourcing + trust + snapshots) ---
class ReputationEvent(Base):
    __tablename__ = "reputation_events"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    subject_type = Column(String(32), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    actor_type = Column(String(32), nullable=True)
    actor_id = Column(UUID(as_uuid=False), nullable=True)
    event_type = Column(String(64), nullable=False, index=True)
    value = Column(Numeric(12, 6), nullable=True)
    meta = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (Index("ix_reputation_events_subject_created", "subject_type", "subject_id", "created_at"),)


class RelationshipEdgeDaily(Base):
    __tablename__ = "relationship_edges_daily"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    day = Column(Date, nullable=False, index=True)
    src_type = Column(String(32), nullable=False)
    src_id = Column(UUID(as_uuid=False), nullable=False)
    dst_type = Column(String(32), nullable=False)
    dst_id = Column(UUID(as_uuid=False), nullable=False)
    edge_type = Column(String(32), nullable=False, index=True)
    count = Column(Integer, default=0)
    amount_sum = Column(Numeric(36, 18), nullable=True)
    unique_refs = Column(Integer, default=0)
    meta = Column(JSONB, nullable=True, server_default="{}")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_relationship_edges_daily_day_src_dst", "day", "src_type", "src_id", "dst_type", "dst_id", "edge_type", unique=True),
        Index("ix_edges_daily_src_day", "src_type", "src_id", "day"),
        Index("ix_edges_daily_dst_day", "dst_type", "dst_id", "day"),
        Index("ix_edges_daily_pair_day", "src_type", "src_id", "dst_type", "dst_id", "day"),
    )


class TrustScore(Base):
    __tablename__ = "trust_scores"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    subject_type = Column(String(32), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    trust_score = Column(Numeric(5, 4), nullable=False)
    components = Column(JSONB, nullable=True)
    window = Column(String(16), nullable=False)
    algo_version = Column(String(32), nullable=False)
    inputs_hash = Column(String(64), nullable=True)
    computed_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("uq_trust_scores_subject_window_algo", "subject_type", "subject_id", "window", "algo_version", unique=True),
    )


class ReputationSnapshot(Base):
    __tablename__ = "reputation_snapshots"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    subject_type = Column(String(32), nullable=False, index=True)
    subject_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    score = Column(Numeric(8, 4), nullable=False)
    components = Column(JSONB, nullable=True)
    computed_at = Column(DateTime(timezone=True), nullable=False)
    algo_version = Column(String(32), nullable=False)
    window = Column(String(16), nullable=False)
    inputs_hash = Column(Text, nullable=True)
    proof = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("uq_rep_snapshots_subject_window_algo", "subject_type", "subject_id", "window", "algo_version", unique=True),
    )


# --- Jobs (watermarks for incremental aggregation) ---
class JobWatermark(Base):
    __tablename__ = "job_watermarks"

    key = Column(String(64), primary_key=True)
    value = Column(String(512), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


# --- L2: Reviews ---
class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    reviewer_type = Column(String(20), nullable=False)  # agent, user
    reviewer_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    target_type = Column(String(32), nullable=False, index=True)  # agent, strategy, listing
    target_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    weight = Column(Numeric(5, 4), nullable=False, default=1)  # 0..1 for weighted reputation
    text = Column(Text, nullable=True)
    run_id = Column(UUID(as_uuid=False), ForeignKey("runs.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (Index("ix_reviews_target", "target_type", "target_id"),)


# --- L2: Disputes ---
class DisputeStatusEnum(str, enum.Enum):
    open = "open"
    resolved = "resolved"
    rejected = "rejected"


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    subject = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="open", index=True)
    evidence_refs = Column(JSONB, nullable=True)  # list of {type, id} refs
    verdict = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class GovernanceProposal(Base):
    __tablename__ = "governance_proposals"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    kind = Column(String(32), nullable=False, index=True)  # policy_update | vertical_update | moderation_rule
    target_type = Column(String(32), nullable=False, index=True)  # policy | vertical | system
    target_id = Column(UUID(as_uuid=False), nullable=True, index=True)
    payload_json = Column(JSONB, nullable=False)
    status = Column(String(32), nullable=False, default="draft", index=True)  # draft|review|active|rejected|appealed
    created_by = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_by = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    decision_reason = Column(Text, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class GovernanceVote(Base):
    __tablename__ = "governance_votes"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(UUID(as_uuid=False), ForeignKey("governance_proposals.id", ondelete="CASCADE"), nullable=False, index=True)
    voter_type = Column(String(20), nullable=False, default="user")  # user | agent
    voter_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    vote = Column(String(16), nullable=False)  # approve | reject | abstain
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("uq_governance_vote_unique_voter", "proposal_id", "voter_type", "voter_id", unique=True),
    )


class GovernanceAuditLog(Base):
    __tablename__ = "governance_audit_log"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(UUID(as_uuid=False), ForeignKey("governance_proposals.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(48), nullable=False, index=True)
    actor_type = Column(String(20), nullable=False, default="user")
    actor_id = Column(UUID(as_uuid=False), nullable=True, index=True)
    event_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class ModerationCase(Base):
    __tablename__ = "moderation_cases"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    subject_type = Column(String(32), nullable=False, index=True)  # agent | strategy | listing | vertical | policy
    subject_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    reason_code = Column(String(64), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="open", index=True)  # open|resolved|appealed|rejected
    opened_by = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    resolved_by = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class IdempotencyKey(Base):
    """Idempotency store for POST endpoints (orders, runs)."""

    __tablename__ = "idempotency_keys"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    scope = Column(String(64), nullable=False)
    key = Column(String(128), nullable=False)
    request_hash = Column(String(64), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_json = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("uq_idempotency_scope_key", "scope", "key", unique=True),
        Index("ix_idempotency_scope", "scope"),
    )

# --- L2: Funds (portfolio-of-strategies) ---
class Fund(Base):
    __tablename__ = "funds"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False, index=True)
    owner_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    pool_id = Column(UUID(as_uuid=False), ForeignKey("pools.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class FundAllocation(Base):
    __tablename__ = "fund_allocations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=False), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False, index=True)
    strategy_version_id = Column(UUID(as_uuid=False), ForeignKey("strategy_versions.id", ondelete="CASCADE"), nullable=False)
    weight = Column(Numeric(5, 4), nullable=False)  # 0..1 share of fund
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (Index("ix_fund_allocations_fund", "fund_id"),)


# --- L3: Proof-of-Agent ---
class AgentChallenge(Base):
    __tablename__ = "agent_challenges"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    challenge_type = Column(String(32), nullable=False, index=True)  # e.g. reasoning, tool_use
    payload_json = Column(JSONB, nullable=False)
    nonce = Column(String(64), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class AgentAttestation(Base):
    __tablename__ = "agent_attestations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    challenge_id = Column(UUID(as_uuid=False), ForeignKey("agent_challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    solution_hash = Column(String(64), nullable=False)
    attestation_sig = Column(Text, nullable=True)  # signature by agent key
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


# --- L3: Stakes & Slashing ---
class StakeStatusEnum(str, enum.Enum):
    active = "active"
    released = "released"
    slashed = "slashed"


class Stake(Base):
    __tablename__ = "stakes"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_currency = Column(String(10), nullable=False)
    amount_value = Column(Numeric(36, 18), nullable=False)
    status = Column(SQLEnum(StakeStatusEnum), default=StakeStatusEnum.active)
    slash_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    released_at = Column(DateTime(timezone=True), nullable=True)


# --- L3: On-chain anchoring ---
class ChainAnchor(Base):
    __tablename__ = "chain_anchors"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    chain_id = Column(String(32), nullable=False, index=True)  # e.g. ethereum, solana, mock
    tx_hash = Column(String(128), nullable=True, index=True)
    payload_type = Column(String(32), nullable=False, index=True)  # stake, slash, settlement, run_anchor
    payload_hash = Column(String(64), nullable=False)
    payload_json = Column(JSONB, nullable=True)
    anchored_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class SettlementIntentStatusEnum(str, enum.Enum):
    pending = "pending"
    executed = "executed"
    failed = "failed"


class ChainReceiptStatusEnum(str, enum.Enum):
    submitted = "submitted"
    finalized = "finalized"
    failed = "failed"


class SettlementIntent(Base):
    __tablename__ = "settlement_intents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    intent_type = Column(String(32), nullable=False, index=True)  # escrow_open|escrow_release|stake_lock|stake_unlock|slash
    source_owner_type = Column(String(32), nullable=False)
    source_owner_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    target_owner_type = Column(String(32), nullable=False)
    target_owner_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    amount_currency = Column(String(10), nullable=False, index=True)
    amount_value = Column(Numeric(36, 18), nullable=False)
    status = Column(String(24), nullable=False, default=SettlementIntentStatusEnum.pending.value, index=True)
    correlation_id = Column(String(128), nullable=False, index=True)
    metadata_json = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    executed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("uq_settlement_intents_correlation_id", "correlation_id", unique=True),
    )


class ChainReceipt(Base):
    __tablename__ = "chain_receipts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    settlement_intent_id = Column(
        UUID(as_uuid=False), ForeignKey("settlement_intents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chain_id = Column(String(32), nullable=False, index=True)
    tx_hash = Column(String(128), nullable=True, index=True)
    status = Column(String(24), nullable=False, default=ChainReceiptStatusEnum.submitted.value, index=True)
    correlation_id = Column(String(128), nullable=False, index=True)
    payload_hash = Column(String(64), nullable=False)
    receipt_json = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    finalized_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class ContractStatusEnum(str, enum.Enum):
    draft = "draft"
    proposed = "proposed"
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"


class PaymentModelEnum(str, enum.Enum):
    fixed = "fixed"
    per_run = "per_run"


class ContractMilestoneStatusEnum(str, enum.Enum):
    pending = "pending"
    active = "active"
    submitted = "submitted"
    accepted = "accepted"
    rejected = "rejected"
    paid = "paid"
    cancelled = "cancelled"


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    employer_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    scope_type = Column(String(32), nullable=False)
    scope_ref_id = Column(UUID(as_uuid=False), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ContractStatusEnum), default=ContractStatusEnum.draft)
    payment_model = Column(SQLEnum(PaymentModelEnum), nullable=False)
    fixed_amount_value = Column(Numeric(36, 18), nullable=True)
    currency = Column(String(10), nullable=False, default="USD")
    max_runs = Column(Integer, nullable=True)
    runs_completed = Column(Integer, nullable=False, default=0)
    risk_policy_id = Column(UUID(as_uuid=False), ForeignKey("risk_policies.id", ondelete="SET NULL"), nullable=True)
    created_from_order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class ContractMilestone(Base):
    __tablename__ = "contract_milestones"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    contract_id = Column(UUID(as_uuid=False), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    status = Column(SQLEnum(ContractMilestoneStatusEnum), nullable=False, default=ContractMilestoneStatusEnum.pending, index=True)

    amount_value = Column(Numeric(36, 18), nullable=False)
    currency = Column(String(10), nullable=False, default="USD")

    required_runs = Column(Integer, nullable=True)
    completed_runs = Column(Integer, nullable=False, default=0)

    accepted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_contract_milestones_contract_order", "contract_id", "order_index"),
        Index("ix_contract_milestones_contract_status", "contract_id", "status"),
        Index("ix_contract_milestones_contract_created", "contract_id", "created_at"),
    )


# --- Sprint-3 Growth Layer ---

class ReferralAttributionStatusEnum(str, enum.Enum):
    pending = "pending"
    eligible = "eligible"
    rewarded = "rewarded"
    rejected = "rejected"


class FaucetClaimStatusEnum(str, enum.Enum):
    granted = "granted"
    held = "held"
    rejected = "rejected"
    clawed_back = "clawed_back"


class StarterPackAssignmentStatusEnum(str, enum.Enum):
    assigned = "assigned"
    activated = "activated"
    cancelled = "cancelled"


class StrategyCopyModeEnum(str, enum.Enum):
    fork = "fork"
    mirror_template = "mirror_template"


class NotificationPriorityEnum(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"


class TaskFeedStatusEnum(str, enum.Enum):
    open = "open"
    claimed = "claimed"
    completed = "completed"
    expired = "expired"


class FeedVisibilityEnum(str, enum.Enum):
    public = "public"
    unlisted = "unlisted"
    private = "private"


class ReferralCode(Base):
    __tablename__ = "referral_codes"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    code = Column(String(64), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True)
    reward_bps = Column(Integer, nullable=False, default=500)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_referral_codes_owner_user", "owner_user_id"),
        Index("ix_referral_codes_owner_agent", "owner_agent_id"),
    )


class ReferralAttribution(Base):
    __tablename__ = "referral_attributions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    referral_code_id = Column(UUID(as_uuid=False), ForeignKey("referral_codes.id", ondelete="CASCADE"), nullable=False, index=True)
    referred_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    referred_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    attributed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    source = Column(String(32), nullable=False, default="signup")
    status = Column(String(32), nullable=False, default=ReferralAttributionStatusEnum.pending.value)


class ReferralRewardEvent(Base):
    __tablename__ = "referral_reward_events"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    referral_attribution_id = Column(UUID(as_uuid=False), ForeignKey("referral_attributions.id", ondelete="CASCADE"), nullable=False, index=True)
    beneficiary_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    beneficiary_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    trigger_type = Column(String(32), nullable=False)
    trigger_ref_type = Column(String(32), nullable=False)
    trigger_ref_id = Column(UUID(as_uuid=False), nullable=False)
    currency = Column(String(16), nullable=False)
    amount_value = Column(Numeric(38, 18), nullable=False)
    ledger_tx_id = Column(UUID(as_uuid=False), ForeignKey("ledger_events.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_ref_reward_benef_user", "beneficiary_user_id"),
        Index("ix_ref_reward_benef_agent", "beneficiary_agent_id"),
        Index("ux_ref_reward_dedupe", "referral_attribution_id", "trigger_type", "trigger_ref_type", "trigger_ref_id", unique=True),
    )


class FaucetClaim(Base):
    __tablename__ = "faucet_claims"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    currency = Column(String(16), nullable=False)
    amount_value = Column(Numeric(38, 18), nullable=False)
    claim_status = Column(String(32), nullable=False, default=FaucetClaimStatusEnum.granted.value)
    risk_flags = Column(JSONB, nullable=False, default=dict)
    ledger_tx_id = Column(UUID(as_uuid=False), ForeignKey("ledger_events.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class StarterPack(Base):
    __tablename__ = "starter_packs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    code = Column(String(64), nullable=False, unique=True, index=True)
    name = Column(String(128), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    config_json = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class StarterPackAssignment(Base):
    __tablename__ = "starter_pack_assignments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    starter_pack_id = Column(UUID(as_uuid=False), ForeignKey("starter_packs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(32), nullable=False, default=StarterPackAssignmentStatusEnum.assigned.value)


class StrategyFollow(Base):
    __tablename__ = "strategy_follows"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=False), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False, index=True)
    follower_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    follower_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    is_active = Column(Boolean, nullable=False, default=True)


class StrategyCopy(Base):
    __tablename__ = "strategy_copies"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    source_strategy_id = Column(UUID(as_uuid=False), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False, index=True)
    copied_strategy_id = Column(UUID(as_uuid=False), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False, index=True)
    copier_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    copier_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    copy_mode = Column(String(32), nullable=False, default=StrategyCopyModeEnum.fork.value)


class AgentFollow(Base):
    __tablename__ = "agent_follows"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    target_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    follower_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    follower_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    is_active = Column(Boolean, nullable=False, default=True)


class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    recipient_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String(64), nullable=False)
    priority = Column(String(16), nullable=False, default=NotificationPriorityEnum.normal.value)
    payload_json = Column(JSONB, nullable=False, default=dict)
    dedupe_key = Column(String(255), nullable=True, unique=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)


class PublicActivityFeedEvent(Base):
    __tablename__ = "public_activity_feed"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    actor_agent_id = Column(UUID(as_uuid=False), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    ref_type = Column(String(32), nullable=False)
    ref_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    visibility = Column(String(16), nullable=False, default=FeedVisibilityEnum.public.value, index=True)
    score = Column(Numeric(18, 6), nullable=False, default=0)
    payload_json = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_public_feed_score_created", "score", "created_at"),
        Index("ix_public_feed_actor_agent_created", "actor_agent_id", "created_at"),
    )


class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    board_type = Column(String(32), nullable=False, index=True)
    subject_type = Column(String(32), nullable=False)
    subject_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    window = Column(String(16), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    score = Column(Numeric(18, 6), nullable=False)
    components_json = Column(JSONB, nullable=False, default=dict)
    snapshot_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ux_leaderboard_unique", "board_type", "subject_type", "subject_id", "window", "snapshot_date", unique=True),
        Index("ix_leaderboard_lookup", "board_type", "window", "snapshot_date", "rank"),
    )


class GrowthMetricRollup(Base):
    __tablename__ = "growth_metric_rollups"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    metric_date = Column(Date, nullable=False, index=True)
    metric_key = Column(String(64), nullable=False, index=True)
    metric_value = Column(Numeric(38, 10), nullable=False)
    dimensions_json = Column(JSONB, nullable=False, default=dict)
    dimensions_hash = Column(String(32), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ux_growth_metric_unique", "metric_date", "metric_key", "dimensions_hash", unique=True),
        Index("ix_growth_metric_key_date", "metric_key", "metric_date"),
    )


class TaskFeedItem(Base):
    __tablename__ = "task_feed_items"

    id = Column(UUID(as_uuid=False), primary_key=True, default=uuid.uuid4)
    source_type = Column(String(32), nullable=False, index=True)
    source_id = Column(UUID(as_uuid=False), nullable=False, index=True)
    task_type = Column(String(32), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    reward_currency = Column(String(16), nullable=True)
    reward_amount_value = Column(Numeric(38, 18), nullable=True)
    target_agent_type = Column(String(64), nullable=True)
    target_vertical = Column(String(64), nullable=True, index=True)
    eligibility_json = Column(JSONB, nullable=False, default=dict)
    score = Column(Numeric(18, 6), nullable=False, default=0)
    status = Column(String(16), nullable=False, default=TaskFeedStatusEnum.open.value, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_task_feed_open_score", "status", "score", "created_at"),
        Index("ix_task_feed_vertical", "target_vertical", "status", "score"),
    )