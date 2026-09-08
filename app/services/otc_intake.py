"""OTC intake desk: metals, goods/antiques, commodities, real estate, space, IP → ACP."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from fastapi import HTTPException

from app.config import get_settings
from app.schemas.otc_intake import (
    CommodityKind,
    GoodsCategory,
    IpKind,
    MetalKind,
    OtcCatalogPublic,
    OtcCommodityCatalogItem,
    OtcGoodsCatalogItem,
    OtcIpCatalogItem,
    OtcMetalCatalogItem,
    OtcQuoteResponse,
    OtcRealEstateCatalogItem,
    OtcSpaceCatalogItem,
    RealEstateDeal,
    SpaceObjectClass,
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
    "antiques": "Antiques",
    "industrial": "Industrial materials",
    "other": "Other goods",
}

REAL_ESTATE_LABELS: dict[str, str] = {
    "sale": "Real estate sale",
    "rental": "Real estate rental / lease",
}

SPACE_LABELS: dict[str, str] = {
    "satellite": "Satellite / spacecraft",
    "star": "Star (title lot)",
    "planet": "Planet (title lot)",
    "moon": "Moon / natural satellite",
    "debris_slot": "Debris / salvage rights",
    "orbital_slot": "Orbital slot / frequency rights",
    "payload_rights": "Payload / rideshare rights",
    "other_space": "Other space object / title",
}

SPACE_STARTING_ACP: dict[str, str] = {
    "satellite": "250000",
    "star": "3500000",
    "planet": "1800000",
    "moon": "450000",
    "debris_slot": "40000",
    "orbital_slot": "180000",
    "payload_rights": "95000",
    "other_space": "50000",
}

IP_LABELS: dict[str, str] = {
    "patent": "Patent / invention",
    "recipe": "Recipe / proprietary formula",
}

IP_OWNERSHIP_CLASS: dict[str, str] = {
    "patent": "patent_invention",
    "recipe": "recipe_formula",
}

IP_NOTES: dict[str, str] = {
    "patent": "Patent RFQ — application/grant package + document hash; issue patent_invention certificate after review.",
    "recipe": "Recipe/formula RFQ — hashed package only (not public disclosure); issue recipe_formula certificate after review.",
}

# Indicative desk rates — override via OTC_COMMODITY_ACP_PER_UNIT
DEFAULT_COMMODITY_ACP_PER_UNIT: dict[str, str] = {
    "oil": "80",  # ACP / barrel
    "natural_gas": "0.45",  # ACP / m³
    "uranium": "220",  # ACP / kg U3O8-equivalent (indicative)
    "coal": "110",  # ACP / tonne
    "timber": "95",  # ACP / m³
    "sand": "18",  # ACP / tonne
    "stone": "28",  # ACP / tonne crushed stone / aggregate
    "gravel": "22",  # ACP / tonne
    "iron_ore": "105",  # ACP / tonne
    "copper_ore": "175",  # ACP / tonne concentrate proxy
    "lithium": "18",  # ACP / kg LCE proxy
    "rare_earths": "55",  # ACP / kg TREO proxy
}

COMMODITY_LABELS: dict[str, str] = {
    "oil": "Crude oil",
    "natural_gas": "Natural gas",
    "uranium": "Uranium",
    "coal": "Coal",
    "timber": "Timber / forest",
    "sand": "Sand",
    "stone": "Stone / rock",
    "gravel": "Gravel",
    "iron_ore": "Iron ore",
    "copper_ore": "Copper ore",
    "lithium": "Lithium",
    "rare_earths": "Rare earths",
}

COMMODITY_UNITS: dict[str, str] = {
    "oil": "bbl",
    "natural_gas": "m3",
    "uranium": "kg",
    "coal": "t",
    "timber": "m3",
    "sand": "t",
    "stone": "t",
    "gravel": "t",
    "iron_ore": "t",
    "copper_ore": "t",
    "lithium": "kg",
    "rare_earths": "kg",
}

COMMODITY_KINDS: tuple[str, ...] = tuple(COMMODITY_LABELS.keys())


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
        "Do not mail cash. Metals, goods, antiques, commodities, real-estate title packages, "
        "space-object title docs, and IP packages (patents / recipes) are reviewed before ACP settlement. "
        "Indicative quotes are not final bids. Controlled materials (e.g. uranium) require "
        "licensed counterparties and export/sanctions clearance."
    )


def compliance_note() -> str:
    return (
        "OTC metals/goods/antiques/commodities/real-estate/space/IP intake is a supervised desk, not an automated DEX. "
        "Assay, title, custody, export-control, and sanctions checks may apply. Settlement pays ACP after review. "
        "Uranium and controlled space assets may be refused without proper licensing. "
        "Patent and recipe packages require document_hash; recipes stay confidential (hash + metadata only). "
        "ACP ownership certificates are register proofs — not a substitute for sovereign land/space/IP registries."
    )


def metal_rate_acp_per_gram(kind: MetalKind) -> Decimal:
    settings = get_settings()
    overrides = getattr(settings, "otc_metal_acp_per_gram", None) or {}
    raw = str(overrides.get(kind) or DEFAULT_METAL_ACP_PER_GRAM[kind])
    return Decimal(raw)


def commodity_rate_acp_per_unit(kind: CommodityKind) -> Decimal:
    settings = get_settings()
    overrides = getattr(settings, "otc_commodity_acp_per_unit", None) or {}
    raw = str(overrides.get(kind) or DEFAULT_COMMODITY_ACP_PER_UNIT[kind])
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
        for c in ("electronics", "jewelry", "collectibles", "antiques", "industrial", "other")
    ]
    real_estate = [
        OtcRealEstateCatalogItem(
            deal_type=d,  # type: ignore[arg-type]
            label=REAL_ESTATE_LABELS[d],
            note="Sale or rental RFQ — deed/lease hash required for ownership certificate later.",
        )
        for d in ("sale", "rental")
    ]
    space_objects = [
        OtcSpaceCatalogItem(
            object_class=c,  # type: ignore[arg-type]
            label=SPACE_LABELS[c],
            note="Space-object title RFQ — NORAD/COSPAR + document hash preferred. Starting auction price is indicative.",
            indicative_starting_acp=SPACE_STARTING_ACP[c],
        )
        for c in SPACE_LABELS
    ]
    ip_assets = [
        OtcIpCatalogItem(
            kind=k,  # type: ignore[arg-type]
            label=IP_LABELS[k],
            note=IP_NOTES[k],
            ownership_asset_class=IP_OWNERSHIP_CLASS[k],
        )
        for k in IP_LABELS
    ]
    commodities = [
        OtcCommodityCatalogItem(
            kind=k,  # type: ignore[arg-type]
            label=COMMODITY_LABELS[k],
            unit=COMMODITY_UNITS[k],
            indicative_acp_per_unit=_api_str(commodity_rate_acp_per_unit(k)),  # type: ignore[arg-type]
            note=f"Indicative ACP per {COMMODITY_UNITS[k]} before grade/assay and desk review.",
        )
        for k in COMMODITY_KINDS
    ]
    return OtcCatalogPublic(
        metals=metals,
        goods=goods,
        commodities=commodities,
        real_estate=real_estate,
        space_objects=space_objects,
        ip_assets=ip_assets,
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


def quote_commodity(
    *,
    commodity: CommodityKind,
    quantity: str,
    grade_note: str | None = None,
) -> OtcQuoteResponse:
    qty = _dec(quantity, "quantity")
    rate = commodity_rate_acp_per_unit(commodity)
    estimated = (qty * rate).quantize(_Q, rounding=ROUND_HALF_UP)
    unit = COMMODITY_UNITS[commodity]
    details: dict[str, Any] = {
        "commodity": commodity,
        "label": COMMODITY_LABELS[commodity],
        "quantity": _api_str(qty),
        "unit": unit,
        "acp_per_unit": _api_str(rate),
    }
    if grade_note:
        details["grade_note"] = grade_note.strip()[:120]
    return OtcQuoteResponse(
        rail="commodity",
        estimated_acp_amount=_api_str(estimated),
        rate_note=f"Indicative {_api_str(rate)} ACP/{unit}",
        details=details,
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


def build_commodity_detail(
    *,
    commodity: CommodityKind,
    quantity: str,
    grade_note: str | None = None,
) -> dict[str, Any]:
    q = quote_commodity(commodity=commodity, quantity=quantity, grade_note=grade_note)
    return dict(q.details)



def quote_real_estate(
    *,
    deal_type: RealEstateDeal,
    estimated_value_acp: str,
    jurisdiction: str | None = None,
    lease_months: int | None = None,
) -> OtcQuoteResponse:
    value = _dec(estimated_value_acp, "estimated_value_acp")
    details: dict[str, Any] = {
        "deal_type": deal_type,
        "label": REAL_ESTATE_LABELS[deal_type],
        "estimated_value_acp": _api_str(value),
    }
    if jurisdiction:
        details["jurisdiction"] = jurisdiction.strip()[:64]
    if deal_type == "rental" and lease_months:
        details["lease_months"] = int(lease_months)
    note = (
        "Rental/lease NPV estimate — desk confirms lease terms."
        if deal_type == "rental"
        else "Sale estimate — desk confirms deed/title package."
    )
    return OtcQuoteResponse(
        rail="real_estate",
        estimated_acp_amount=_api_str(value),
        rate_note=note,
        details=details,
    )


def quote_space(
    *,
    object_class: SpaceObjectClass,
    estimated_value_acp: str,
    norad_or_cospar_id: str | None = None,
) -> OtcQuoteResponse:
    value = _dec(estimated_value_acp, "estimated_value_acp")
    details: dict[str, Any] = {
        "object_class": object_class,
        "label": SPACE_LABELS[object_class],
        "estimated_value_acp": _api_str(value),
        "indicative_starting_acp": SPACE_STARTING_ACP.get(object_class, "0"),
    }
    if norad_or_cospar_id:
        details["norad_or_cospar_id"] = norad_or_cospar_id.strip()[:64]
    return OtcQuoteResponse(
        rail="space",
        estimated_acp_amount=_api_str(value),
        rate_note="Space-object title estimate — desk + compliance review required.",
        details=details,
    )


def build_real_estate_detail(
    *,
    deal_type: RealEstateDeal,
    address_or_parcel: str,
    estimated_value_acp: str,
    jurisdiction: str | None = None,
    lease_months: int | None = None,
    document_hash: str | None = None,
) -> dict[str, Any]:
    q = quote_real_estate(
        deal_type=deal_type,
        estimated_value_acp=estimated_value_acp,
        jurisdiction=jurisdiction,
        lease_months=lease_months,
    )
    detail = dict(q.details)
    detail["address_or_parcel"] = address_or_parcel.strip()[:240]
    if document_hash:
        detail["document_hash"] = document_hash.strip().lower()[:128]
    return detail


def build_space_detail(
    *,
    object_class: SpaceObjectClass,
    estimated_value_acp: str,
    space_object_id: str | None = None,
    jurisdiction: str | None = None,
    document_hash: str | None = None,
) -> dict[str, Any]:
    q = quote_space(
        object_class=object_class,
        estimated_value_acp=estimated_value_acp,
        norad_or_cospar_id=space_object_id,
    )
    detail = dict(q.details)
    if jurisdiction:
        detail["jurisdiction"] = jurisdiction.strip()[:64]
    if document_hash:
        detail["document_hash"] = document_hash.strip().lower()[:128]
    return detail


def quote_ip(
    *,
    kind: IpKind,
    estimated_value_acp: str,
    registration_uri: str | None = None,
) -> OtcQuoteResponse:
    value = _dec(estimated_value_acp, "estimated_value_acp")
    details: dict[str, Any] = {
        "kind": kind,
        "label": IP_LABELS[kind],
        "estimated_value_acp": _api_str(value),
        "ownership_asset_class": IP_OWNERSHIP_CLASS[kind],
    }
    if registration_uri:
        details["registration_uri"] = registration_uri.strip()[:512]
    note = (
        "Recipe/formula estimate — desk confirms hash package; content stays confidential."
        if kind == "recipe"
        else "Patent/invention estimate — desk confirms filing package + document hash."
    )
    return OtcQuoteResponse(
        rail="ip",
        estimated_acp_amount=_api_str(value),
        rate_note=note,
        details=details,
    )


def build_ip_detail(
    *,
    kind: IpKind,
    title: str,
    estimated_value_acp: str,
    registration_uri: str | None = None,
    jurisdiction: str | None = None,
    document_hash: str | None = None,
) -> dict[str, Any]:
    q = quote_ip(kind=kind, estimated_value_acp=estimated_value_acp, registration_uri=registration_uri)
    detail = dict(q.details)
    detail["title"] = title.strip()[:200]
    if jurisdiction:
        detail["jurisdiction"] = jurisdiction.strip()[:64]
    if document_hash:
        detail["document_hash"] = document_hash.strip().lower()[:128]
    return detail


def asset_label_for(*, rail: str, detail: dict[str, Any]) -> str:
    if rail == "metal":
        return f"{detail.get('label') or detail.get('metal')} {detail.get('weight_grams')}g"
    if rail == "commodity":
        unit = detail.get("unit") or ""
        return f"{detail.get('label') or detail.get('commodity')} {detail.get('quantity')}{unit}"
    if rail == "real_estate":
        parcel = (detail.get("address_or_parcel") or "").strip()
        label = detail.get("label") or detail.get("deal_type") or "real_estate"
        return f"{label}: {parcel}" if parcel else str(label)
    if rail == "space":
        oid = detail.get("norad_or_cospar_id") or detail.get("space_object_id") or ""
        label = detail.get("label") or detail.get("object_class") or "space"
        return f"{label}: {oid}" if oid else str(label)
    if rail == "ip":
        title = (detail.get("title") or "").strip()
        label = detail.get("label") or detail.get("kind") or "ip"
        return f"{label}: {title}" if title else str(label)
    title = (detail.get("title") or "").strip()
    cat = detail.get("label") or detail.get("category") or "goods"
    return f"{cat}: {title}" if title else str(cat)
