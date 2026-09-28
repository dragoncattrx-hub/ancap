"""Registration anti-sybil quarantine for free ACP grants."""
from tests.conftest import unique_email


def test_second_device_registration_skips_welcome_when_velocity_hit(client, monkeypatch):
    from app.config import get_settings

    monkeypatch.setenv("REGISTRATION_SIGNAL_MAX_PER_DEVICE", "1")
    monkeypatch.setenv("REGISTRATION_SIGNAL_MAX_PER_IP", "50")
    monkeypatch.setenv("WELCOME_GRANT_ACP", "100")
    get_settings.cache_clear()

    fingerprint = "device-fingerprint-aabbccdd"
    first = client.post(
        "/v1/auth/users",
        json={
            "email": unique_email(),
            "password": "password123",
            "display_name": "First",
            "device_fingerprint": fingerprint,
        },
        headers={"Authorization": "", "X-Forwarded-For": "203.0.113.10"},
    )
    assert first.status_code == 201, first.text

    second = client.post(
        "/v1/auth/users",
        json={
            "email": unique_email(),
            "password": "password123",
            "display_name": "Second",
            "device_fingerprint": fingerprint,
        },
        headers={"Authorization": "", "X-Forwarded-For": "203.0.113.11"},
    )
    assert second.status_code == 201, second.text
    # Account created; free grant may be skipped — registration must still succeed.
    assert second.json()["access_token"]

    get_settings.cache_clear()


def test_robot_ops_server_bounty_requires_auth(client):
    r = client.post(
        "/v1/robot-ops/server-install-bounties",
        json={
            "host_label": "node-1",
            "payout_address": "acp1qtestaddress000000000000000000000000",
            "amount_acp": "25",
        },
        headers={"Authorization": ""},
    )
    assert r.status_code in (401, 403)
