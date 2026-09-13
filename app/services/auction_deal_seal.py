"""Helpers to seal auction bid deals under the PQC hybrid envelope."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services import auction_deal_crypto


def seal_auction_deal(
    *,
    vertical: str,
    bid_id: str,
    lot_id: str,
    bidder_user_id: str,
    amount_acp: str,
    note: str | None,
    contract_hash: str | None = None,
    tx_hash: str | None = None,
) -> tuple[str, str, str]:
    payload: dict[str, Any] = {
        "vertical": vertical,
        "bid_id": str(bid_id),
        "lot_id": str(lot_id),
        "bidder_user_id": str(bidder_user_id),
        "amount_acp": str(amount_acp),
        "note": note,
        "contract_hash": contract_hash,
        "tx_hash": tx_hash,
        "sealed_at": datetime.now(timezone.utc).isoformat(),
    }
    context = f"ACP/auction-deal/{vertical}/v1".encode("ascii")
    return auction_deal_crypto.encrypt_deal(payload, context=context)
