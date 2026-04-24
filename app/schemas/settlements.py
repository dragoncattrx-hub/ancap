from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


SettlementIntentType = Literal["escrow_open", "escrow_release", "stake_lock", "stake_unlock", "slash"]
SettlementIntentStatus = Literal["pending", "executed", "failed"]
ChainReceiptStatus = Literal["submitted", "finalized", "failed"]


class SettlementIntentCreateRequest(BaseModel):
    intent_type: SettlementIntentType
    source_owner_type: str = Field(..., min_length=2, max_length=32)
    source_owner_id: str
    target_owner_type: str = Field(..., min_length=2, max_length=32)
    target_owner_id: str
    amount_currency: str = Field(..., min_length=2, max_length=10)
    amount_value: str
    correlation_id: str | None = Field(None, min_length=6, max_length=128)
    metadata_json: dict[str, Any] = Field(default_factory=dict)


class SettlementIntentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    intent_type: SettlementIntentType
    source_owner_type: str
    source_owner_id: str
    target_owner_type: str
    target_owner_id: str
    amount_currency: str
    amount_value: str
    status: SettlementIntentStatus
    correlation_id: str
    metadata_json: dict[str, Any] | None
    error_message: str | None
    executed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ChainReceiptPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    settlement_intent_id: str
    chain_id: str
    tx_hash: str | None
    status: ChainReceiptStatus
    correlation_id: str
    payload_hash: str
    receipt_json: dict[str, Any] | None
    error_message: str | None
    finalized_at: datetime | None
    created_at: datetime
    updated_at: datetime
