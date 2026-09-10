"""Embodied AI security status API."""
from __future__ import annotations

from fastapi import APIRouter

from app.schemas.embodied_ai import EmbodiedAiSecurityStatusPublic
from app.services import embodied_ai as svc

router = APIRouter(tags=["Embodied AI Security"])


@router.get("/embodied-ai/security", response_model=EmbodiedAiSecurityStatusPublic)
async def embodied_ai_security_status():
    """Public control-plane status — adapters stay off until digest + review."""
    return svc.security_status()
