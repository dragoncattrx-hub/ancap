"""Public ACP explorer request/response models."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ExplorerSearchResponse(BaseModel):
    query: str
    type: Literal["block_height", "block_hash", "tx", "address", "unknown"]
    id: str | None = None
    canonical_path: str | None = None
    notes: list[str] = Field(default_factory=list)


class ExplorerBlockSummary(BaseModel):
    height: int
    hash: str | None = None
    tx_count: int = 0
    time: int | None = None
    size: int | None = None


class ExplorerBlocksResponse(BaseModel):
    block_height: int
    items: list[ExplorerBlockSummary]
    next_before_height: int | None = None


class ExplorerBlockDetailResponse(BaseModel):
    height: int
    hash: str
    previous_hash: str | None = None
    next_hash: str | None = None
    time: int | None = None
    size: int | None = None
    tx_count: int = 0
    txids: list[str] = Field(default_factory=list)
    header: dict[str, Any] = Field(default_factory=dict)


class ExplorerTxIo(BaseModel):
    address: str | None = None
    units: str
    acp: str
    vout: int | None = None


class ExplorerTxResponse(BaseModel):
    txid: str
    view: str = "full"
    status: Literal["confirmed", "mempool", "unknown"] = "unknown"
    block_height: int | None = None
    block_hash: str | None = None
    block_time: str | int | None = None
    confirmations: int = 0
    total_input_units: str | None = None
    total_input_acp: str | None = None
    total_output_units: str | None = None
    total_output_acp: str | None = None
    fee_units: str | None = None
    fee_acp: str | None = None
    inputs: list[ExplorerTxIo] = Field(default_factory=list)
    outputs: list[ExplorerTxIo] = Field(default_factory=list)
    privacy_profile: str | None = None
    summary: dict[str, Any] | None = None
    transaction: dict[str, Any] | None = None
    hint: str | None = None


class ExplorerUtxoItem(BaseModel):
    txid: str
    vout: int
    units: str
    acp: str
    height: int | None = None


class ExplorerAddressEvent(BaseModel):
    txid: str
    direction: str
    amount_units: str
    amount_acp: str
    height: int | None = None
    vout: int | None = None
    vin: int | None = None


class ExplorerAddressResponse(BaseModel):
    address: str
    balance_acp: str
    balance_units: str | None = None
    utxo_count: int = 0
    role_key: str | None = None
    role_label: str | None = None
    utxos: list[ExplorerUtxoItem] = Field(default_factory=list)
    history: list[ExplorerAddressEvent] = Field(default_factory=list)
    history_total: int = 0
    next_offset: int | None = None
    index_height: int | None = None


class ExplorerMempoolResponse(BaseModel):
    info: dict[str, Any] = Field(default_factory=dict)
    txids: list[str] = Field(default_factory=list)
    fee_estimate: dict[str, Any] | None = None


class ExplorerStatsResponse(BaseModel):
    status: str = "ok"
    chain: dict[str, Any] = Field(default_factory=dict)
    txoutset: dict[str, Any] | None = None
    tokenomics: dict[str, Any] | None = None
    free_distribution: dict[str, Any] | None = None
    index: dict[str, Any] | None = None
    lean: dict[str, Any] | None = None
