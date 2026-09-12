"""Startup-investment literacy HTTP surface."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.startup_invest import (
    StartupInvestBriefPublic,
    StartupInvestCatalogPublic,
    StartupInvestPrinciplePublic,
    StartupInvestRefPublic,
    StartupInvestSectorPublic,
)
from app.services import startup_invest as svc

router = APIRouter(prefix="/startups", tags=["Startup invest"])


@router.get("/catalog", response_model=StartupInvestCatalogPublic)
async def startup_invest_catalog():
    raw = svc.catalog()
    return StartupInvestCatalogPublic(
        title=raw["title"],
        tagline=raw["tagline"],
        compliance_note=raw["compliance_note"],
        as_of=raw["as_of"],
        research_ref=StartupInvestRefPublic(**raw["research_ref"]),
        research_refs=[StartupInvestRefPublic(**r) for r in raw.get("research_refs") or []],
        sectors=[StartupInvestSectorPublic(**s) for s in raw.get("sectors") or []],
        principles=[StartupInvestPrinciplePublic(**p) for p in raw.get("principles") or []],
        briefs=[StartupInvestBriefPublic(**b) for b in raw["briefs"]],
        principles_doc=raw.get("principles_doc") or "docs/STARTUP_INVEST_DESK.md",
        legal_href=raw.get("legal_href") or "/legal/research-refs",
    )
