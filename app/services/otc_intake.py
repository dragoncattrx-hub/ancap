"""OTC intake desk: precious metals and goods → ACP (manual review rail)."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException

from app.config import get_settings
from app.schemas.otc_intake import (
    GoodsCategory,
    MetalKind,
    OtcCatalogPublic,
    OtcGoodsCatalogItem,
    OtcMetalCatalogItem,
    OtcQuoteResponse,
)

_Q = Decimal("0.00000001")

DEFAULT_METAL_ACP_PER_GRAM: dict[str, str] = {
    "gold": "250",
    "silver": "3",
    "platinum": "120",
    "palladium": "80",
}

METAL_LABELS: dict[str, str] = {
    "gold": "Gold (Au)",
    "silver": "Silver (Ag)",
    "platinum": "Platinum (Pt)",
    "palladium": "Palladium (Pd)",
}

GOODS_LABELS: dict[str, str] = {
    "electronics": "Electronics",
    "jewelry": "Jewelry / watches",
    "collectibles": "Collectibles",
    "industrial": "Industrial materials",
    "other": "Other goods",
}


def _dec(raw: str, field: str) -> Decimal:
    try:
        v = Decimal(str(raw).strip())
    except (InvalidOperation, AttributeError) as exc:
        raise HTTPException(status_code=400, detail=f"{field} must be a decimal string") from exc
    if v <= 0:
        raise HTTPException(status_code=400, detail=f"{field} must be > 0")
    return v


def _api_str(v: Decimal) -> str:
    s = format(v.quantize(_Q, rounding=ROUND_HALF_UP), "f").rstrip("0").rstrip(".")
    return s or "0"


def handoff_instructions() -> str:
    settings = get_settings()
    custom = (getattr(settings, "otc_handoff_instructions", None) or "").strip()
    if custom:
        return custom
    return (
        "ANCAP OTC desk — physical intake is by appointment only. "
        "Keep the intake reference on the package/custody slip. "
        "Do not mail cash. Metals and goods are inspected before ACP settlement. "
        "Indicative quotes are not final bids."
    )


def compliance_note() -> str:
    return (
        "OTC metals/goods intake is a supervised desk, not an automated DEX. "
        "Assay, title, and sanctions checks may apply. Settlement pays ACP after review."
    )


def metal_rate_acp_per_gram(kind: MetalKind) -> Decimal:
    settings = get_settings()
    overrides = getattr(settings, "otc_metal_acp_per_gram", None) or {}
    raw = str(overrides.get(kind) or DEFAULT_METAL_ACP_PER_GRAM[kind])
    return Decimal(raw)


def catalog() -> OtcCatalogPublic:
    metals = [
        OtcMetalCatalogItem(
            kind=k,  # type: ignore[arg-type]
            label=METAL_LABELS[k],
            indicative_acp_per_gram=_api_str(metal_rate_acp_per_gram(k)),  # type: ignore[arg-type]
            note="Indicative ACP/g before purity adjustment and assay.",
        )
        for k in ("gold", "silver", "platinum", "palladium")
    ]
    goods = [
        OtcGoodsCatalogItem(
            category=c,  # type: ignore[arg-type]
            label=GOODS_LABELS[c],
            note="State an ACP estimate; desk confirms after inspection.",
        )
        for c in ("electronics", "jewelry", "collectibles", "industrial", "other")
    ]
    return OtcCatalogPublic(
        metals=metals,
        goods=goods,
        handoff_instructions=handoff_instructions(),
        compliance_note=compliance_note(),
    )


def quote_metal(*, metal: MetalKind, weight_grams: str, purity_ppt: int) -> OtcQuoteResponse:
    grams = _dec(weight_grams, "weight_grams")
    if purity_ppt < 100 or purity_ppt > 1000:
        raise HTTPException(status_code=400, detail="purity_ppt must be 100..1000")
    rate = metal_rate_acp_per_gram(metal)
    purity = Decimal(purity_ppt) / Decimal(1000)
    estimated = (grams * rate * purity).quantize(_Q, rounding=ROUND_HALF_UP)
    return OtcQuoteResponse(
        rail="metal",
        estimated_acp_amount=_api_str(estimated),
        rate_note=f"Indicative {_api_str(rate)} ACP/g x purity {purity_ppt}/1000",
        details={
            "metal": metal,
            "label": METAL_LABELS[metal],
            "weight_grams": _api_str(grams),
            "purity_ppt": purity_ppt,
            "acp_per_gram": _api_str(rate),
        },
    )


def quote_goods(*, category: GoodsCategory, estimated_value_acp: str) -> OtcQuoteResponse:
    value = _dec(estimated_value_acp, "estimated_value_acp")
    return OtcQuoteResponse(
        rail="goods",
        estimated_acp_amount=_api_str(value),
        rate_note="User-stated estimate — desk may revise after inspection.",
        details={
            "category": category,
            "label": GOODS_LABELS[category],
            "estimated_value_acp": _api_str(value),
        },
    )


def build_metal_detail(*, metal: MetalKind, weight_grams: str, purity_ppt: int) -> dict[str, Any]:
    q = quote_metal(metal=metal, weight_grams=weight_grams, purity_ppt=purity_ppt)
    return dict(q.details)


def build_goods_detail(
    *,
    category: GoodsCategory,
    title: str,
    description: str | None,
    estimated_value_acp: str,
) -> dict[str, Any]:
    q = quote_goods(category=category, estimated_value_acp=estimated_value_acp)
    detail = dict(q.details)
    detail["title"] = title.strip()[:160]
    if description:
        detail["description"] = description.strip()[:2000]
    return detail


def asset_label_for(*, rail: str, detail: dict[str, Any]) -> str:
    if rail == "metal":
        return f"{detail.get('label') or detail.get('metal')} {detail.get('weight_grams')}g"
    title = (detail.get("title") or "").strip()
    cat = detail.get("label") or detail.get("category") or "goods"
    return f"{cat}: {title}" if title else str(cat)
