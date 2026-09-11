"""Digital DNA/RNA bank request/response schemas."""
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

MoleculeKind = Literal["dna", "rna"]
DnaRnaEntryType = Literal[
    "sequence_summary",
    "vcf_panel",
    "blood_rna_panel",
    "transcriptome_summary",
    "methylation_panel",
    "microbiome_rna",
    "other",
]


class DnaRnaBankCreate(BaseModel):
    molecule: MoleculeKind = "dna"
    entry_type: DnaRnaEntryType = "sequence_summary"
    title: str = Field(..., min_length=1, max_length=200)
    species: Optional[str] = Field(None, max_length=120)
    sample_id: Optional[str] = Field(None, max_length=120)
    collected_on: Optional[str] = Field(None, max_length=32)
    lab_hint: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=4000)
    # Never send full genomes — only short summaries / panel metadata.
    sequence_summary: Optional[str] = Field(None, max_length=8000)
    panel_json: Optional[dict[str, Any]] = None
    extra: Optional[dict[str, Any]] = None


class DnaRnaBankSummary(BaseModel):
    id: str
    molecule: str
    entry_type: str
    title_hint: str
    species_hint: Optional[str] = None
    cipher_id: str
    content_hash: str
    created_at: datetime
    updated_at: datetime


class DnaRnaBankPublic(DnaRnaBankSummary):
    payload: dict[str, Any]


class DnaRnaBankListResponse(BaseModel):
    items: list[DnaRnaBankSummary]
    cipher_id: str


class DnaRnaBankCipherInfo(BaseModel):
    cipher_id: str
    algorithm: str
    kdf: str
    aad: str
    note: str
