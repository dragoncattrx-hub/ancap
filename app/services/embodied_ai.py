"""Embodied AI security control plane (adapters gated off by default)."""
from __future__ import annotations

from fastapi import HTTPException

from app.config import get_settings
from app.schemas.embodied_ai import (
    EmbodiedAiSecurityStatusPublic,
    EmbodiedModelRegisterEntry,
)

# Approved-model register — production adapters stay false until digest + review.
_APPROVED_REGISTER: list[EmbodiedModelRegisterEntry] = [
    EmbodiedModelRegisterEntry(
        model_id="unitree-unifolm-wla-1.0",
        vendor="Unitree",
        display_name="UnifoLM-WLA-1.0",
        license_note="Vendor open-source release; confirm license before redistribute",
        weight_digest_sha256=None,
        revision_pin=None,
        ancap_status="pending_digest",
        threat_notes=(
            "Open VLA/WLA weights democratize access but enable unverified fine-tunes; "
            "never auto-pull latest; isolate from ACP/bridge keys; firmware caps required."
        ),
        adapters_allowed=False,
    ),
]

_POLICY = [
    "Pin + hash model revisions — no silent latest",
    "Keep inference off ACP / bridge / key hosts",
    "Enforce actuator force and speed caps outside the neural net",
    "Attest digests of policies that actually ran",
    "Independent kill switch + feature flags",
    "Refuse unverified fine-tunes in production catalogs",
]


def _feature_enabled() -> bool:
    return bool(getattr(get_settings(), "ff_embodied_adapter", False))


def security_status() -> EmbodiedAiSecurityStatusPublic:
    return EmbodiedAiSecurityStatusPublic(
        feature_enabled=_feature_enabled(),
        inference_on_api_host=False,
        weights_on_api_host=False,
        approved_models=list(_APPROVED_REGISTER),
        policy=list(_POLICY),
    )


def require_adapter_enabled() -> None:
    """Call before any future embodied adapter mutate path."""
    if not _feature_enabled():
        raise HTTPException(
            status_code=503,
            detail="Embodied AI adapters disabled (FF_EMBODIED_ADAPTER=false)",
        )
    # Even with flag on, no register entry may run without digest + adapters_allowed.
    allowed = [m for m in _APPROVED_REGISTER if m.adapters_allowed and m.weight_digest_sha256]
    if not allowed:
        raise HTTPException(
            status_code=503,
            detail="No approved embodied model with pinned digest",
        )
