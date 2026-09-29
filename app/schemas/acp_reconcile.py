"""Platform-admin ACP reconcile schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class AcpReconcileGapItem(BaseModel):
    user_id: str
    email: str | None = None
    address: str
    on_chain_acp: str | None = None
    ledger_credits_acp: str | None = None
    gap: str | None = None
    is_custodial_hot: bool = False
    suggested_restore_acp: str | None = None
    error: str | None = None


class AcpReconcileReport(BaseModel):
    dry_run: bool = True
    scanned: int
    gap_count: int
    items: list[AcpReconcileGapItem]
    note: str | None = None


class AcpReconcileExecuteRequest(BaseModel):
    confirm: bool = False
    user_ids: list[str] = Field(default_factory=list)
    max_transfers: int = Field(default=20, ge=1, le=100)


class AcpReconcileTransferResult(BaseModel):
    user_id: str
    address: str
    amount_acp: str
    ok: bool
    txid: str | None = None
    error: str | None = None


class AcpReconcileExecuteResponse(BaseModel):
    dry_run: bool = False
    attempted: int
    skipped: int = 0
    transfers: list[AcpReconcileTransferResult]


class AcpHistoryRescanRequest(BaseModel):
    """Force mobile ACP indexer refresh; optionally reset the global watermark."""

    address: str | None = Field(
        default=None,
        description="Optional ACP address to ensure is on the indexer watchlist",
    )
    reset_watermark: bool = Field(
        default=False,
        description=(
            "When true, clears last_scanned_height to 0 so the next tick rescans "
            "from genesis for all watched addresses. Use sparingly."
        ),
    )


class AcpHistoryRescanResponse(BaseModel):
    ok: bool = True
    address: str | None = None
    watermark_reset: bool = False
    previous_last_scanned_height: int | None = None
    last_scanned_height: int | None = None
    addresses_watched: int = 0
    indexed: int = 0
    best_height: int | None = None
    error: str | None = None
    note: str | None = None
