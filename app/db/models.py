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
    attestation_id = Column(UUID(as_uuid=False), ForeignKey("agent_attestations.id", ondelete="SET NULL"), nullable=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)  # when stake/attestation activated
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    strategies = relationship("Strategy", back_populates="owner_agent", foreign_keys="Strategy.owner_agent_id")


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
