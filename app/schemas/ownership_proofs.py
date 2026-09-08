"""ACP ownership certificates for intangible (and title-linked) assets.

Issues a crypto-style ACP contract/certificate confirming ownership on the
ANCAP register. Not a government deed substitute — register + document_hash proof.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


OwnershipAssetClass = Literal[
    "real_estate_title",
    "real_estate_lease",
    "antique_provenance",
    "space_object_title",
    "intellectual_property",
    "patent_invention",
    "recipe_formula",
    "license",
    "digital_collectible",
    "domain_name",
    "brand_mark",
    "other_intangible",
]

OwnershipCertStatus = Literal["draft", "issued", "transferred", "revoked"]


class OwnershipCatalogItem(BaseModel):
    asset_class: OwnershipAssetClass
    label: str
    note: str


class OwnershipCatalogPublic(BaseModel):
    asset_classes: list[OwnershipCatalogItem]
    disclaimer: str


class OwnershipIssueRequest(BaseModel):
    asset_class: OwnershipAssetClass
    title: str = Field(..., min_length=1, max_length=200)
    subject_uri: str | None = Field(
        default=None,
        max_length=512,
        description="Canonical subject: parcel id, NORAD, IP registration URI, etc.",
    )
    jurisdiction: str | None = Field(default=None, max_length=64)
    document_hash: str = Field(..., min_length=64, max_length=128)
    document_uri: str | None = Field(default=None, max_length=512)
    face_value_acp: str | None = Field(
        default=None,
        description="Optional indicative ACP face / book value for the certificate",
    )
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    notes: str | None = Field(default=None, max_length=2000)
    issue_transfer_code: bool = Field(
        default=True,
        description="If true, return a one-time transfer code for peer handoff of title pointer",
    )

    @field_validator("document_hash")
    @classmethod
    def _hash(cls, v: str) -> str:
        s = (v or "").strip().lower()
        if len(s) < 64 or any(c not in "0123456789abcdef" for c in s):
            raise ValueError("document_hash must be hex sha256 (64+ chars)")
        return s


class OwnershipTransferRedeemRequest(BaseModel):
    transfer_code: str = Field(..., min_length=8, max_length=128)
    note: str | None = Field(default=None, max_length=500)


class OwnershipCertificatePublic(BaseModel):
    id: str
    contract_code: str
    asset_class: OwnershipAssetClass
    title: str
    subject_uri: str | None = None
    jurisdiction: str | None = None
    document_hash: str
    document_uri: str | None = None
    face_value_acp: str | None = None
    status: OwnershipCertStatus
    owner_user_id: str
    metadata_json: dict[str, Any] = Field(default_factory=dict)
    notes: str | None = None
    transfer_code: str | None = Field(
        default=None,
        description="Shown only once at issue; never stored in plaintext",
    )
    created_at: str
    updated_at: str
    issued_at: str | None = None


class OwnershipIssueResponse(BaseModel):
    certificate: OwnershipCertificatePublic
    disclaimer: str
