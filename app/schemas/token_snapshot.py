"""Free token risk snapshot (lead magnet) schemas."""
from pydantic import BaseModel, Field


class TokenSnapshotRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=200, description="Token symbol, project name, or 0x contract address")
    chain: str = Field(default="bsc", min_length=1, max_length=40)


class TokenSnapshotCheck(BaseModel):
    key: str
    label: str
    status: str  # "pass" | "warn" | "needs_evidence"
    note: str


class TokenSnapshotResponse(BaseModel):
    subject: str
    chain: str
    score: int = Field(ge=0, le=100)
    risk_level: str  # "low" | "medium" | "high"
    is_contract_address: bool
    onchain_verified: bool
    token_name: str | None = None
    token_symbol: str | None = None
    token_decimals: int | None = None
    total_supply: str | None = None
    checks: list[TokenSnapshotCheck]
    disclaimer: str
