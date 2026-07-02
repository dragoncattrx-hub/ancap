from __future__ import annotations

from uuid import uuid4

import pytest


@pytest.fixture
def auth_headers(client):
    email = f"scanner_{uuid4().hex[:12]}@test.com"
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "scanner user"},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_payment_scanner_parse_acp_uri(client, auth_headers):
    res = client.post(
        "/v1/payment-scanner/parse",
        json={"raw_text": "acp:acp1qexample?amount=10", "source": "paste"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    payload = res.json()
    assert payload["detected_network"] == "acp"
    assert payload["address"] == "acp1qexample"
    assert payload["amount"] == "10"
    assert payload["requires_manual_confirm"] is True


def test_payment_scanner_parse_ocr_invoice(client, auth_headers):
    addr = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
    raw = f"""
    INVOICE #INV-2048
    Pay to: {addr}
    Total due: 12.50 USDT
    """
    res = client.post(
        "/v1/payment-scanner/parse",
        json={"raw_text": raw, "source": "ocr"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    payload = res.json()
    assert payload["address"] == addr
    assert payload["amount"] == "12.5"
    assert payload["currency"] == "USDT"
    assert payload["label"] == "INV-2048"
    assert payload["confidence"] >= 0.75
    assert any("OCR" in note for note in payload["parse_notes"])


def test_payment_scanner_parse_evm_invoice(client, auth_headers):
    addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    raw = f"""
    Payment request
    Send to wallet: {addr}
    Amount due: 25.00
    Network: BSC
    """
    res = client.post(
        "/v1/payment-scanner/parse",
        json={"raw_text": raw, "source": "ocr"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    payload = res.json()
    assert payload["address"].lower() == addr.lower()
    assert payload["amount"] == "25"
    assert payload["detected_network"] == "bsc"
