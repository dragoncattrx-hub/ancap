"""Embodied AI / humanoid model security schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class EmbodiedModelRegisterEntry(BaseModel):
    model_id: str
    vendor: str
    display_name: str
    license_note: str = ""
    weight_digest_sha256: str | None = Field(
        default=None,
        description="Pinned weight digest when known; None = not approved for adapters",
    )
    revision_pin: str | None = None
    ancap_status: str = Field(
        description="pending_digest | reviewed | rejected | production_hold"
    )
    threat_notes: str = ""
    adapters_allowed: bool = False


class EmbodiedAiSecurityStatusPublic(BaseModel):
    feature_enabled: bool = Field(
        description="FF_EMBODIED_ADAPTER — must stay false until review"
    )
    controls_doc: str = "docs/EMBODIED_AI_SECURITY_CONTROLS.md"
    inference_on_api_host: bool = False
    weights_on_api_host: bool = False
    approved_models: list[EmbodiedModelRegisterEntry]
    policy: list[str]
