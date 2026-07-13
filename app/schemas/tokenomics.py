"""ACP official 210M tokenomics snapshot schemas."""
from __future__ import annotations

from pydantic import BaseModel


class AcpTokenomicsBucketSnapshot(BaseModel):
    key: str
    label: str
    share_pct: int
    target_acp: str
    address: str
    on_chain_acp: str
    utxo_count: int
    status: str  # ok | deficit | excess | on_hot
    location_note: str | None = None


class AcpTokenomicsHotPool(BaseModel):
    total_acp: str
    utxo_count: int
    ecosystem_on_hot_acp: str
    operator_pool_acp: str


class AcpTokenomicsSnapshotResponse(BaseModel):
    genesis_supply_acp: str
    buckets_sum_acp: str
    alignment_status: str  # aligned | partial
    buckets: list[AcpTokenomicsBucketSnapshot]
    hot_pool: AcpTokenomicsHotPool | None = None
    block_height: int | None = None
