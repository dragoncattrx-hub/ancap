"""Quantum-link digital SIM HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.quantum_sim import (
    QuantumSimCatalogPublic,
    QuantumSimMeshLayerPublic,
    QuantumSimPrinciplePublic,
    QuantumSimResearchRefPublic,
    QuantumSimServicePublic,
)
from app.services import quantum_sim as svc

router = APIRouter(prefix="/quantum-sim", tags=["Quantum SIM"])


@router.get("/catalog", response_model=QuantumSimCatalogPublic)
async def quantum_sim_catalog():
    raw = svc.catalog()
    return QuantumSimCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        research_ref=QuantumSimResearchRefPublic(**raw["research_ref"]),
        principles=[QuantumSimPrinciplePublic(**p) for p in raw["principles"]],
        principles_doc=raw["principles_doc"],
        legal_href=raw["legal_href"],
        services=[QuantumSimServicePublic(**s) for s in raw["services"]],
        mesh_layers=[QuantumSimMeshLayerPublic(**m) for m in raw["mesh_layers"]],
    )
