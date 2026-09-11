"""Schemas for quantum-link digital SIM desk."""
from __future__ import annotations

from pydantic import BaseModel, Field


class QuantumSimServicePublic(BaseModel):
    id: str
    review_target_id: str
    label: str
    price_from_acp: str
    blurb: str


class QuantumSimMeshLayerPublic(BaseModel):
    id: str
    label: str
    role: str


class QuantumSimResearchRefPublic(BaseModel):
    id: str
    title: str
    url: str
    note: str


class QuantumSimCatalogPublic(BaseModel):
    title: str
    tagline: str
    compliance_note: str
    research_ref: QuantumSimResearchRefPublic
    legal_href: str = "/legal/research-refs"
    services: list[QuantumSimServicePublic]
    mesh_layers: list[QuantumSimMeshLayerPublic] = Field(default_factory=list)
