from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps import require_auth
from app.services.payment_text_parse import parse_payment_text

router = APIRouter(prefix="/payment-scanner", tags=["Payment Scanner"])


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
    parsed = parse_payment_text(body.raw_text, source=body.source)
    return PaymentScannerPreview(
        detected_network=parsed.detected_network,
        address=parsed.address,
        amount=parsed.amount,
        currency=parsed.currency,
        label=parsed.label,
        confidence=parsed.confidence,
        requires_manual_confirm=True,
        parse_notes=parsed.parse_notes,
    )
