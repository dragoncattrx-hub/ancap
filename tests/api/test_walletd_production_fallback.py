"""Production must refuse deterministic walletd fallback wallet generation."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.config import get_settings
from app.services import acp_wallet


def _patch_settings(monkeypatch, environment: str) -> None:
    settings = get_settings()
    monkeypatch.setattr(
        acp_wallet,
        "get_settings",
        lambda: SimpleNamespace(
            environment=environment,
            acp_walletd_path=getattr(settings, "acp_walletd_path", None),
        ),
    )


def test_require_walletd_in_production_raises(monkeypatch):
    _patch_settings(monkeypatch, "production")
    with pytest.raises(RuntimeError, match="refusing insecure fallback"):
        acp_wallet._require_walletd_in_production()


def test_generate_wallet_secret_refuses_fallback_in_production(monkeypatch):
    _patch_settings(monkeypatch, "production")
    monkeypatch.setattr(acp_wallet, "_walletd_available", lambda: False)
    with pytest.raises(RuntimeError, match="refusing insecure fallback"):
        acp_wallet.generate_wallet_secret()


def test_generate_wallet_secret_allows_fallback_outside_production(monkeypatch):
    _patch_settings(monkeypatch, "development")
    monkeypatch.setattr(acp_wallet, "_walletd_available", lambda: False)
    payload, mnemonic, address = acp_wallet.generate_wallet_secret()
    assert isinstance(payload, str) and payload
    assert isinstance(mnemonic, str) and mnemonic
    assert address.startswith("acp1")
