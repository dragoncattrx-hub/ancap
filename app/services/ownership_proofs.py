"""ACP ownership certificate service (intangible + title-linked assets)."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AcpOwnershipCertificate
from app.schemas.ownership_proofs import (
    OwnershipCatalogItem,
    OwnershipCatalogPublic,
    OwnershipCertificatePublic,
    OwnershipIssueRequest,
    OwnershipIssueResponse,
    OwnershipTransferRedeemRequest,
)

_Q = Decimal("0.00000001")

_DISCLAIMER = (
    "ANCAP ownership certificates are crypto-style register contracts in ACP accounting. "
    "They confirm a document_hash + metadata on the ANCAP register and may include a peer "
    "transfer code. They are not a substitute for sovereign land registries, ITU/space "
    "filings, IP offices, or court judgments."
)

_ASSET_CLASSES: list[tuple[str, str, str]] = [
    ("real_estate_title", "Real estate title", "Deed / parcel title package"),
    ("real_estate_lease", "Real estate lease", "Leasehold / rental rights package"),
    ("antique_provenance", "Antique provenance", "Provenance + authenticity package"),
    ("space_object_title", "Space object title", "Satellite / orbital / payload rights"),
    ("intellectual_property", "Intellectual property", "Generic IP package (copyright / trade secret hash)"),
    ("patent_invention", "Patent / invention", "Patent application or granted invention package"),
    ("recipe_formula", "Recipe / formula", "Hashed recipe or proprietary formula — not public disclosure"),
    ("license", "License / franchise", "Exclusive license rights"),
    ("digital_collectible", "Digital collectible", "Off-chain or on-chain collectible pointer"),
    ("domain_name", "Domain name", "Domain control evidence"),
    ("brand_mark", "Brand / trademark", "Brand mark package"),
    ("other_intangible", "Other intangible", "Generic intangible ownership package"),
]


def catalog() -> OwnershipCatalogPublic:
    return OwnershipCatalogPublic(
        asset_classes=[
            OwnershipCatalogItem(asset_class=c, label=lab, note=note)  # type: ignore[arg-type]
            for c, lab, note in _ASSET_CLASSES
        ],
        disclaimer=_DISCLAIMER,
    )


def _api_str(v: Decimal) -> str:
    s = format(v.quantize(_Q, rounding=ROUND_HALF_UP), "f").rstrip("0").rstrip(".")
    return s or "0"


def _dec_opt(raw: str | None) -> Decimal | None:
    if raw is None or str(raw).strip() == "":
        return None
    try:
        v = Decimal(str(raw).strip())
    except (InvalidOperation, AttributeError) as exc:
        raise HTTPException(status_code=400, detail="face_value_acp must be a decimal string") from exc
    if v < 0:
        raise HTTPException(status_code=400, detail="face_value_acp must be >= 0")
    return v


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _public(row: AcpOwnershipCertificate, *, transfer_code: str | None = None) -> OwnershipCertificatePublic:
    face = None
    if row.face_value_acp is not None:
        face = _api_str(Decimal(str(row.face_value_acp)))
    return OwnershipCertificatePublic(
        id=str(row.id),
        contract_code=str(row.contract_code),
        asset_class=row.asset_class,  # type: ignore[arg-type]
        title=str(row.title),
        subject_uri=row.subject_uri,
        jurisdiction=row.jurisdiction,
        document_hash=str(row.document_hash),
        document_uri=row.document_uri,
        face_value_acp=face,
        status=row.status,  # type: ignore[arg-type]
        owner_user_id=str(row.owner_user_id),
        metadata_json=dict(row.metadata_json or {}),
        notes=row.notes,
        transfer_code=transfer_code,
        created_at=_iso(row.created_at) or "",
        updated_at=_iso(row.updated_at) or "",
        issued_at=_iso(row.issued_at),
    )


async def issue(
    session: AsyncSession,
    *,
    user_id: str,
    body: OwnershipIssueRequest,
) -> OwnershipIssueResponse:
    now = datetime.now(timezone.utc)
    face = _dec_opt(body.face_value_acp)
    transfer_plain: str | None = None
    transfer_hash = None
    if body.issue_transfer_code:
        transfer_plain = f"OWN-{secrets.token_urlsafe(18)}"
        transfer_hash = _hash_code(transfer_plain)

    row = AcpOwnershipCertificate(
        id=str(uuid4()),
        owner_user_id=user_id,
        contract_code=f"ACP-OWN-{uuid4().hex[:10].upper()}",
        asset_class=body.asset_class,
        title=body.title.strip()[:200],
        subject_uri=(body.subject_uri or "").strip()[:512] or None,
        jurisdiction=(body.jurisdiction or "").strip()[:64] or None,
        document_hash=body.document_hash,
        document_uri=(body.document_uri or "").strip()[:512] or None,
        face_value_acp=face,
        status="issued",
        transfer_code_hash=transfer_hash,
        metadata_json=dict(body.metadata_json or {}),
        notes=(body.notes or "").strip()[:2000] or None,
        created_at=now,
        updated_at=now,
        issued_at=now,
    )
    session.add(row)
    await session.flush()
    return OwnershipIssueResponse(
        certificate=_public(row, transfer_code=transfer_plain),
        disclaimer=_DISCLAIMER,
    )


async def list_mine(session: AsyncSession, *, user_id: str) -> list[OwnershipCertificatePublic]:
    rows = (
        await session.execute(
            select(AcpOwnershipCertificate)
            .where(AcpOwnershipCertificate.owner_user_id == user_id)
            .order_by(AcpOwnershipCertificate.created_at.desc())
        )
    ).scalars().all()
    return [_public(r) for r in rows]


async def get_one(
    session: AsyncSession, *, user_id: str, certificate_id: str
) -> OwnershipCertificatePublic:
    row = await session.get(AcpOwnershipCertificate, certificate_id)
    if not row or str(row.owner_user_id) != user_id:
        raise HTTPException(status_code=404, detail="Ownership certificate not found")
    return _public(row)


async def redeem_transfer(
    session: AsyncSession,
    *,
    user_id: str,
    body: OwnershipTransferRedeemRequest,
) -> OwnershipCertificatePublic:
    code = (body.transfer_code or "").strip()
    if not code:
        raise HTTPException(status_code=400, detail="transfer_code required")
    digest = _hash_code(code)
    row = (
        await session.execute(
            select(AcpOwnershipCertificate).where(
                AcpOwnershipCertificate.transfer_code_hash == digest,
                AcpOwnershipCertificate.status == "issued",
            )
        )
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Transfer code invalid or already used")
    if str(row.owner_user_id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot redeem your own transfer code")

    now = datetime.now(timezone.utc)
    row.owner_user_id = user_id
    row.status = "transferred"
    row.transfer_code_hash = None
    if body.note:
        prev = row.notes or ""
        row.notes = ((prev + "\n") if prev else "") + body.note.strip()[:500]
    row.updated_at = now
    # Re-issue status as issued under new owner for further use
    row.status = "issued"
    await session.flush()
    return _public(row)


async def revoke(
    session: AsyncSession, *, user_id: str, certificate_id: str
) -> OwnershipCertificatePublic:
    row = await session.get(AcpOwnershipCertificate, certificate_id)
    if not row or str(row.owner_user_id) != user_id:
        raise HTTPException(status_code=404, detail="Ownership certificate not found")
    if row.status == "revoked":
        return _public(row)
    row.status = "revoked"
    row.transfer_code_hash = None
    row.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return _public(row)
