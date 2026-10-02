from datetime import datetime
from pydantic import BaseModel, Field


class WacpLiquidityStageCreate(BaseModel):
    stage_id: str = Field(..., min_length=3, max_length=64)
    operator_label: str | None = None
    mint_wacp_wei: str | None = None
    approval_json: dict = Field(default_factory=dict)
    status: str = "planned"


class WacpTreasuryAllocationCreate(BaseModel):
    bucket: str = Field(..., pattern="^(v3|mm|otc)$")
    fraction: float | None = None
    wacp_wei: str | None = None
    usdt_wei: str | None = None
    notes: str | None = None


class WacpV3PositionCreate(BaseModel):
    pool_address: str
    position_token_id: str | None = None
    tick_lower: int | None = None
    tick_upper: int | None = None
    amount0_wei: str | None = None
    amount1_wei: str | None = None
    mint_tx_hash: str | None = None
    pool_url: str | None = None


class WacpV3PositionResponse(WacpV3PositionCreate):
    id: str
    created_at: datetime


class WacpTreasuryAllocationResponse(WacpTreasuryAllocationCreate):
    id: str
    created_at: datetime


class WacpLiquidityStageResponse(BaseModel):
    id: str
    stage_id: str
    operator_label: str | None
    mint_wacp_wei: str | None
    approval_json: dict
    status: str
    created_at: datetime
    updated_at: datetime
    allocations: list[WacpTreasuryAllocationResponse] = Field(default_factory=list)
    positions: list[WacpV3PositionResponse] = Field(default_factory=list)
