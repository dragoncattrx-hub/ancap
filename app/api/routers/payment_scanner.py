from __future__ import annotations

import re
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import require_auth

router = APIRouter(prefix="/payment-scanner", tags=["Payment Scanner"])

_QR_URI_RE = re.compile(
    r"(?i)(?:ethereum|bitcoin|solana|acp)?:?//?([a-zA-Z0-9]+)@?([0-9.]+)?",
)
_AMOUNT_RE = re.compile(r"(?i)(?:amount|value|amt)[=:]([0-9.]+)")


class PaymentScannerParseRequest(BaseModel):
    raw_text: str = Field(min_length=1, max_length=8000)
    source: str = Field(default="paste", pattern="^(paste|qr|ocr)$")


class PaymentScannerPreview(BaseModel):
    detected_network: str | None
    address: str | None
    amount: str | None
    currency: str | None
    label: str | None
    confidence: float
    requires_manual_confirm: bool = True
    parse_notes: list[str]


@router.post("/parse", response_model=PaymentScannerPreview)
async def parse_payment_request(
    body: PaymentScannerParseRequest,
    _user_id: str = Depends(require_auth),
):
    text = body.raw_text.strip()
    notes: list[str] = []
    network = None
    address = None
    amount = None
    currency = None
    label = None
    confidence = 0.35

    if text.lower().startswith("acp:"):
        network = "acp"
        parts = text[4:].split("?")
        address = parts[0].strip() or None
        confidence = 0.85
        notes.append("Detected ACP payment URI")
        for segment in parts[1:]:
            for piece in segment.split("&"):
                if piece.lower().startswith("amount="):
                    amount = piece.split("=", 1)[1]
                    currency = "ACP"

    uri_match = _QR_URI_RE.search(text)
    if uri_match and not address:
        network = (uri_match.group(0).split(":")[0] or "unknown").lower()
        address = uri_match.group(1)
        if uri_match.group(2):
            amount = uri_match.group(2)
        confidence = max(confidence, 0.7)
        notes.append("Detected crypto payment URI pattern")

    amount_match = _AMOUNT_RE.search(text)
    if amount_match and not amount:
        try:
            parsed = Decimal(amount_match.group(1))
            if parsed > 0:
                amount = str(parsed)
                currency = currency or "ACP"
                confidence = max(confidence, 0.55)
                notes.append("Extracted amount token from free text")
        except InvalidOperation:
            pass

    if "@" in text and not address:
        maybe_addr = text.split("@", 1)[-1].split()[0].strip(".,;")
        if 20 <= len(maybe_addr) <= 128:
            address = maybe_addr
            confidence = max(confidence, 0.45)
            notes.append("Heuristic address extraction")

    if not notes:
        notes.append("Low-confidence parse; manual review required")

    return PaymentScannerPreview(
        detected_network=network,
        address=address,
        amount=amount,
        currency=currency,
        label=label,
        confidence=min(confidence, 0.95),
        requires_manual_confirm=True,
        parse_notes=notes,
    )
