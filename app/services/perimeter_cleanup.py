"""Perimeter cleanup field service — encrypted job briefs (Abrams Suite-B vault)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PerimeterCleanupJob
from app.schemas.perimeter_cleanup import PerimeterJobCreate
from app.services import perimeter_crypto

ALLOWED_CONTAMINATION = frozenset(
    {
        "chemical",
        "biological",
        "radiological_survey",
        "industrial",
        "oil_hydrocarbon",
        "soil",
        "water",
        "mixed_all",
    }
)

_SERVICES: tuple[dict[str, Any], ...] = (
    {
        "id": "perimeter-full-sweep",
        "label": "Full perimeter sweep",
        "contamination": "mixed_all",
        "description": "Уборка периметра от всех видов загрязнений: химия, органика, нефтепродукты, промышленная пыль, грунт/вода — по лицензированному протоколу.",
        "price_from_acp": "2500",
        "unit": "site day",
    },
    {
        "id": "perimeter-chemical",
        "label": "Chemical perimeter wipe-down",
        "contamination": "chemical",
        "description": "Нейтрализация и вывоз химических следов по периметру объекта (licensed hazmat only).",
        "price_from_acp": "1800",
        "unit": "zone",
    },
    {
        "id": "perimeter-bio",
        "label": "Biological sanitation perimeter",
        "contamination": "biological",
        "description": "Санитарная обработка периметра от биологических загрязнений (licensed bio-sanitation).",
        "price_from_acp": "2200",
        "unit": "zone",
    },
    {
        "id": "perimeter-rad-survey",
        "label": "Radiological survey + clean protocol",
        "contamination": "radiological_survey",
        "description": "Съёмка и протокол очистки периметра после радиационного обследования (survey notes only; licensed partner).",
        "price_from_acp": "5000",
        "unit": "survey",
    },
    {
        "id": "perimeter-oil",
        "label": "Oil / hydrocarbon perimeter",
        "contamination": "oil_hydrocarbon",
        "description": "Сбор нефтепродуктов и углеводородов по периметру склада/площадки.",
        "price_from_acp": "1600",
        "unit": "zone",
    },
    {
        "id": "perimeter-industrial",
        "label": "Industrial dust & waste perimeter",
        "contamination": "industrial",
        "description": "Уборка промышленной пыли, шлама и твёрдых отходов по периметру.",
        "price_from_acp": "1200",
        "unit": "zone",
    },
    {
        "id": "perimeter-micro-site",
        "label": "Small-site perimeter (operators)",
        "contamination": "industrial",
        "description": (
            "Короткий выезд на малый периметр (двор, ворота, складская площадка). "
            "Для небольших операторов: тот же at-rest сейф, без отдельной key-ceremony. "
            "Лицензия подрядчика всё равно нужна, если класс загрязнения это требует."
        ),
        "price_from_acp": "400",
        "unit": "small site",
        "small_operator": True,
    },
)


def cipher_info() -> dict[str, str]:
    return {
        "cipher_id": perimeter_crypto.CIPHER_ID,
        "algorithm": "AES-256-GCM",
        "kdf": "HKDF-SHA384",
        "aad": perimeter_crypto.KEY_INFO.decode("ascii"),
        "note": (
            "Abrams Suite-B style at-rest vault (v1): AES-256-GCM + HKDF-SHA384. "
            "Public algorithms in the same class as Abrams Type-1 radio stacks; "
            "not classified Type 1 keying. Distinct key namespace from DNA/passport vaults. "
            "Blast-radius proof: GET /perimeter-cleanup/blast-radius."
        ),
        "blast_radius_href": "/perimeter-cleanup/blast-radius",
    }


def catalog() -> dict[str, Any]:
    return {
        "title": "Perimeter cleanup desk",
        "tagline": "Уборка периметра от всех видов загрязнений — ACP-paid, vault encrypted Abrams Suite-B.",
        "cipher": cipher_info(),
        "compliance_note": (
            "Field work requires licensed operators and local environmental permits. "
            "ANCAP stores encrypted job briefs only — we do not perform unlicensed hazmat ourselves. "
            "Radiological items are survey/protocol notes, not waste custody."
        ),
        "accessibility_note": (
            "Catalog and cipher metadata are public without login. AES-256-GCM + HKDF-SHA384 "
            "run at rest on the operator host: the client submits a form, not a key ceremony. "
            "Creating a job still requires an account so briefs stay owner-scoped. "
            "A SHA-384 content hash is shown without decrypting notes."
        ),
        "market_structure_note": (
            "This desk is a licensed field-service rail settled in ACP. It is not an Aave pool, "
            "not a Maker vault, not a tokenized RWA, and not a DeFi yield wrapper around cleanup jobs. "
            "Transparency here means public cipher parameters, a key namespace distinct from DNA and "
            "passport vaults, and per-job content hashes — not on-chain lending reserves."
        ),
        "not_rwa_yield": True,
        "blast_radius_href": "/perimeter-cleanup/blast-radius",
        "services": [
            {
                **item,
                "licensed_operator_required": True,
                "small_operator": bool(item.get("small_operator", False)),
            }
            for item in _SERVICES
        ],
    }


def _service(service_id: str) -> dict[str, Any]:
    for item in _SERVICES:
        if item["id"] == service_id:
            return item
    raise ValueError("Unknown perimeter service_id")


def _payload_from_create(body: PerimeterJobCreate) -> dict[str, Any]:
    svc = _service(body.service_id)
    if body.contamination not in ALLOWED_CONTAMINATION:
        raise ValueError("Invalid contamination kind")
    payload: dict[str, Any] = {
        "service_id": body.service_id,
        "service_label": svc["label"],
        "contamination": body.contamination,
        "site_label": body.site_label.strip(),
    }
    if body.perimeter_meters:
        payload["perimeter_meters"] = body.perimeter_meters.strip()
    if body.address_or_coords:
        payload["address_or_coords"] = body.address_or_coords.strip()
    if body.contact_hint:
        payload["contact_hint"] = body.contact_hint.strip()
    if body.schedule_window:
        payload["schedule_window"] = body.schedule_window.strip()
    if body.notes:
        payload["notes"] = body.notes.strip()
    if body.survey_json:
        payload["survey_json"] = body.survey_json
    if body.extra:
        payload["extra"] = body.extra
    return payload


async def list_jobs(session: AsyncSession, *, user_id: uuid.UUID) -> list[PerimeterCleanupJob]:
    q = (
        select(PerimeterCleanupJob)
        .where(PerimeterCleanupJob.owner_user_id == str(user_id))
        .order_by(PerimeterCleanupJob.created_at.desc())
    )
    return list((await session.execute(q)).scalars().all())


async def add_job(
    session: AsyncSession,
    *,
    user_id: uuid.UUID,
    body: PerimeterJobCreate,
) -> PerimeterCleanupJob:
    _service(body.service_id)
    payload = _payload_from_create(body)
    ct, nonce, chash, cipher_id = perimeter_crypto.encrypt_payload(payload)
    now = datetime.now(timezone.utc)
    row = PerimeterCleanupJob(
        id=str(uuid.uuid4()),
        owner_user_id=str(user_id),
        service_id=body.service_id,
        contamination=body.contamination,
        site_label_hint=body.site_label.strip()[:200],
        status="draft",
        cipher_id=cipher_id,
        nonce_b64=nonce,
        ciphertext_b64=ct,
        content_hash=chash,
        metadata_json={"price_from_acp": _service(body.service_id)["price_from_acp"]},
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    await session.flush()
    return row


async def get_job(
    session: AsyncSession,
    *,
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    decrypt: bool = False,
) -> tuple[PerimeterCleanupJob, dict[str, Any] | None]:
    row = await session.get(PerimeterCleanupJob, str(job_id))
    if row is None or str(row.owner_user_id) != str(user_id):
        raise LookupError("Job not found")
    payload = None
    if decrypt:
        payload = perimeter_crypto.decrypt_payload(
            ciphertext_b64=row.ciphertext_b64,
            nonce_b64=row.nonce_b64,
        )
    return row, payload
