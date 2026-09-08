"""Banknote/coin authenticity + numismatic ACP valuation prototype."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from fastapi import HTTPException

from app.config import get_settings
from app.schemas.numismatic_auth import (
    NumismaticAuthPublic,
    NumismaticAuthRequest,
    NumismaticCatalogCurrency,
    NumismaticCatalogPublic,
    NumismaticFeatureDef,
    NumismaticValuePublic,
    NumismaticValueRequest,
)

_Q = Decimal("0.00000001")

_DISCLAIMER = (
    "ANCAP numismatic desk prototype for the iPhone wallet — educational only. "
    "Not a forensic authenticity certificate, not a dealer bid, not an insurance appraisal. "
    "Counterfeit detection requires trained inspection and, when needed, a licensed expert."
)

_FEATURES: list[NumismaticFeatureDef] = [
    NumismaticFeatureDef(id="watermark", label="Watermark visible in transmitted light", applies_to=["banknote"], weight=0.18),
    NumismaticFeatureDef(id="security_thread", label="Embedded security thread", applies_to=["banknote"], weight=0.16),
    NumismaticFeatureDef(id="hologram", label="Hologram / OVI / kinetic patch", applies_to=["banknote"], weight=0.14),
    NumismaticFeatureDef(id="uv_fibers", label="UV fibers / UV ink react under lamp", applies_to=["banknote"], weight=0.12),
    NumismaticFeatureDef(id="microprint", label="Microprint legible under magnification", applies_to=["banknote"], weight=0.10),
    NumismaticFeatureDef(id="serial_format", label="Serial number format matches series", applies_to=["banknote"], weight=0.10),
    NumismaticFeatureDef(id="paper_feel", label="Paper feel / crispness consistent", applies_to=["banknote"], weight=0.08),
    NumismaticFeatureDef(id="intaglio", label="Intaglio raised ink tactile", applies_to=["banknote"], weight=0.12),
    NumismaticFeatureDef(id="weight_match", label="Weight within expected tolerance", applies_to=["coin"], weight=0.22),
    NumismaticFeatureDef(id="diameter_match", label="Diameter / thickness match", applies_to=["coin"], weight=0.18),
    NumismaticFeatureDef(id="edge_reeding", label="Edge / reeding correct", applies_to=["coin"], weight=0.16),
    NumismaticFeatureDef(id="strike_details", label="Strike details / mint mark crisp", applies_to=["coin"], weight=0.16),
    NumismaticFeatureDef(id="magnetism", label="Magnetic response as expected", applies_to=["coin"], weight=0.14),
    NumismaticFeatureDef(id="surface_wear", label="Wear pattern consistent with grade", applies_to=["coin"], weight=0.14),
]

_GRADE_MULT = {
    "G": Decimal("0.55"),
    "VG": Decimal("0.70"),
    "F": Decimal("0.85"),
    "VF": Decimal("1.00"),
    "XF": Decimal("1.35"),
    "AU": Decimal("1.70"),
    "UNC": Decimal("2.20"),
    "PR": Decimal("3.50"),
}

_RARITY_MULT = {
    "common": Decimal("1.0"),
    "scarce": Decimal("1.8"),
    "rare": Decimal("3.5"),
    "very_rare": Decimal("8.0"),
    "unique_est": Decimal("20.0"),
}

# Indicative ACP per 1 face unit of local currency (placeholders; desk overrides later)
_DEFAULT_FACE_ACP: dict[str, str] = {
    "USD": "1",
    "EUR": "1.08",
    "GBP": "1.25",
    "UAH": "0.025",
    "RUB": "0.011",
    "CHF": "1.12",
    "JPY": "0.0067",
    "CNY": "0.14",
}


def _dec(raw: str | None, field: str) -> Decimal | None:
    if raw is None or str(raw).strip() == "":
        return None
    try:
        return Decimal(str(raw).strip())
    except (InvalidOperation, AttributeError) as exc:
        raise HTTPException(status_code=400, detail=f"{field} must be a decimal string") from exc


def _api_str(v: Decimal) -> str:
    s = format(v.quantize(_Q, rounding=ROUND_HALF_UP), "f").rstrip("0").rstrip(".")
    return s or "0"


def catalog() -> NumismaticCatalogPublic:
    return NumismaticCatalogPublic(
        currencies=[
            NumismaticCatalogCurrency(
                code="USD",
                label="US Dollar",
                note_series=["Federal Reserve $1–$100", "Silver Certificate (legacy)"],
                coin_series=["Lincoln cent", "Jefferson nickel", "Morgan dollar", "American Eagle"],
            ),
            NumismaticCatalogCurrency(
                code="EUR",
                label="Euro",
                note_series=["Europa series", "First series"],
                coin_series=["Euro circulating", "Commemorative €2", "Silver proof"],
            ),
            NumismaticCatalogCurrency(
                code="UAH",
                label="Ukrainian hryvnia",
                note_series=["Current series", "Early independence"],
                coin_series=["Circulating", "NBU commemorative"],
            ),
            NumismaticCatalogCurrency(
                code="RUB",
                label="Russian ruble",
                note_series=["Bank of Russia current", "Soviet legacy (collectible)"],
                coin_series=["Circulating", "Commemorative"],
            ),
            NumismaticCatalogCurrency(
                code="GBP",
                label="Pound sterling",
                note_series=["Bank of England polymer", "Paper legacy"],
                coin_series=["Circulating", "Sovereign / bullion"],
            ),
            NumismaticCatalogCurrency(
                code="CHF",
                label="Swiss franc",
                note_series=["SNB current"],
                coin_series=["Circulating", "Vreneli"],
            ),
        ],
        features=_FEATURES,
        grades=[
            {"code": "G", "label": "Good"},
            {"code": "VG", "label": "Very Good"},
            {"code": "F", "label": "Fine"},
            {"code": "VF", "label": "Very Fine"},
            {"code": "XF", "label": "Extremely Fine"},
            {"code": "AU", "label": "About Uncirculated"},
            {"code": "UNC", "label": "Uncirculated"},
            {"code": "PR", "label": "Proof"},
        ],
        rarity_tiers=[
            {"code": "common", "label": "Common"},
            {"code": "scarce", "label": "Scarce"},
            {"code": "rare", "label": "Rare"},
            {"code": "very_rare", "label": "Very rare"},
            {"code": "unique_est", "label": "Unique / estimate"},
        ],
        disclaimer=_DISCLAIMER,
    )


def _face_acp_rate(currency_code: str) -> Decimal:
    settings = get_settings()
    overrides = getattr(settings, "numismatic_face_acp_rates", None) or {}
    raw = overrides.get(currency_code) or overrides.get(currency_code.lower()) or _DEFAULT_FACE_ACP.get(currency_code)
    if raw is None:
        # fall back to exchange fiat placeholders when present
        fiat = getattr(settings, "exchange_fiat_acp_rates", None) or {}
        raw = fiat.get(currency_code.lower()) or fiat.get(f"fiat_{currency_code.lower()}") or "1"
    return Decimal(str(raw))


def authenticate(req: NumismaticAuthRequest) -> NumismaticAuthPublic:
    applicable = [f for f in _FEATURES if req.kind in f.applies_to]
    if not applicable:
        raise HTTPException(status_code=400, detail="No features defined for kind")

    present = set(req.features_present or [])
    missing = set(req.features_missing or [])
    unchecked = set(req.features_unchecked or [])
    overlap = present & missing
    if overlap:
        raise HTTPException(status_code=400, detail=f"Feature both present and missing: {sorted(overlap)}")

    checks: list[dict] = []
    score_num = Decimal("0")
    score_den = Decimal("0")
    flags: list[str] = []

    for feat in applicable:
        score_den += Decimal(str(feat.weight))
        status = "unchecked"
        if feat.id in present:
            status = "present"
            score_num += Decimal(str(feat.weight))
        elif feat.id in missing:
            status = "missing"
            flags.append(f"Missing security/physical check: {feat.label}")
        elif feat.id in unchecked:
            status = "unchecked"
        checks.append({"id": feat.id, "label": feat.label, "status": status, "weight": feat.weight})

    # Coin measurement heuristics (soft)
    if req.kind == "coin":
        w = _dec(req.measured_weight_g, "measured_weight_g")
        d = _dec(req.measured_diameter_mm, "measured_diameter_mm")
        if w is not None and (w <= 0 or w > 500):
            flags.append("Implausible measured weight")
            missing.add("weight_match")
            present.discard("weight_match")
        if d is not None and (d <= 5 or d > 80):
            flags.append("Implausible measured diameter")
            missing.add("diameter_match")
            present.discard("diameter_match")
        if req.magnetic is True and "magnetism" not in present and "magnetism" not in missing:
            flags.append("Magnetic response noted — verify against series spec")

    if score_den <= 0:
        raise HTTPException(status_code=400, detail="Invalid feature weights")

    checked_weight = Decimal("0")
    for feat in applicable:
        if feat.id in present or feat.id in missing:
            checked_weight += Decimal(str(feat.weight))

    authenticity_score = int((score_num / score_den * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    authenticity_score = max(0, min(100, authenticity_score))

    if checked_weight / score_den < Decimal("0.35"):
        verdict = "insufficient_data"
        flags.append("Too few checks completed — inspect more security features.")
    elif authenticity_score >= 80 and not any("Missing" in f for f in flags):
        verdict = "likely_genuine"
    elif authenticity_score >= 55:
        verdict = "needs_review"
    else:
        verdict = "suspect"

    if req.serial_or_mint_mark and req.kind == "banknote":
        serial = req.serial_or_mint_mark.strip()
        if len(serial) < 4:
            flags.append("Serial looks too short for most modern series")
            if verdict == "likely_genuine":
                verdict = "needs_review"

    return NumismaticAuthPublic(
        kind=req.kind,
        currency_code=req.currency_code,
        series_or_denomination=req.series_or_denomination.strip(),
        authenticity_score=authenticity_score,
        verdict=verdict,  # type: ignore[arg-type]
        checks=checks,
        flags=flags,
        next_step=(
            "If verdict is likely_genuine, run numismatic valuation; "
            "for needs_review/suspect, photograph UV/macro and escalate to OTC collectibles desk."
        ),
        disclaimer=_DISCLAIMER,
    )


def value(req: NumismaticValueRequest) -> NumismaticValuePublic:
    face = _dec(req.face_value_hint, "face_value_hint")
    if face is None:
        # default face hints by kind
        face = Decimal("1") if req.kind == "coin" else Decimal("10")

    rate = _face_acp_rate(req.currency_code)
    face_acp = (face * rate).quantize(_Q, rounding=ROUND_HALF_UP)
    grade_m = _GRADE_MULT[req.grade]
    rarity_m = _RARITY_MULT[req.rarity]
    premium = (grade_m * rarity_m).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    auth_note = "Authenticity not supplied — valuation assumes collector risk haircut."
    auth_factor = Decimal("0.85")
    if req.authenticity_score is not None:
        if req.authenticity_score >= 80:
            auth_factor = Decimal("1.0")
            auth_note = f"Authenticity score {req.authenticity_score}/100 — full numismatic factor applied."
        elif req.authenticity_score >= 55:
            auth_factor = Decimal("0.7")
            auth_note = f"Authenticity score {req.authenticity_score}/100 — review haircut −30%."
        else:
            auth_factor = Decimal("0.25")
            auth_note = f"Authenticity score {req.authenticity_score}/100 — suspect haircut −75%."

    # Age soft premium
    age_m = Decimal("1.0")
    if req.year is not None:
        age = max(0, 2026 - int(req.year))
        if age >= 100:
            age_m = Decimal("1.4")
        elif age >= 50:
            age_m = Decimal("1.2")
        elif age >= 25:
            age_m = Decimal("1.1")

    unit = (face_acp * premium * auth_factor * age_m).quantize(_Q, rounding=ROUND_HALF_UP)
    total = (unit * Decimal(int(req.quantity))).quantize(_Q, rounding=ROUND_HALF_UP)

    return NumismaticValuePublic(
        kind=req.kind,
        currency_code=req.currency_code,
        series_or_denomination=req.series_or_denomination.strip(),
        grade=req.grade,
        rarity=req.rarity,
        indicative_acp_amount=_api_str(total),
        face_reference_acp=_api_str(face_acp * Decimal(int(req.quantity))),
        premium_factor=_api_str(premium * auth_factor * age_m),
        rate_note=(
            f"Face≈{_api_str(face)} {req.currency_code} × {_api_str(rate)} ACP "
            f"× grade {req.grade} × rarity {req.rarity} × qty {req.quantity}"
        ),
        authenticity_note=auth_note,
        next_step="Open OTC goods intake (collectibles) with this estimate, or keep for personal records.",
        disclaimer=_DISCLAIMER,
    )
