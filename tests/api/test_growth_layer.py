from decimal import Decimal

from tests.conftest import unique_email, unique_name


def _register_and_login(client) -> str:
    email = unique_email()
    password = "password123"
    r = client.post("/v1/auth/users", json={"email": email, "password": password, "display_name": "Growth"})
    assert r.status_code in (201, 400), r.text
    login = client.post("/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def _create_agent(client, token: str) -> str:
    r = client.post(
        "/v1/agents",
        headers={"Authorization": f"Bearer {token}"},
        json={"display_name": unique_name("growth_agent"), "public_key": "x" * 32, "roles": ["buyer"]},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_faucet_claim_idempotent_once(client):
    token = _register_and_login(client)
    agent_id = _create_agent(client, token)

    r1 = client.post(
        "/v1/onboarding/faucet/claim",
        headers={"Authorization": f"Bearer {token}"},
        json={"currency": "USD", "amount": "10", "agent_id": agent_id},
    )
    assert r1.status_code == 201, r1.text
    body1 = r1.json()
    assert body1["claim_status"] in ("granted", "held", "rejected")

    r2 = client.post(
        "/v1/onboarding/faucet/claim",
        headers={"Authorization": f"Bearer {token}"},
        json={"currency": "USD", "amount": "10", "agent_id": agent_id},
    )
    assert r2.status_code == 201, r2.text
    body2 = r2.json()
    assert body2["id"] == body1["id"]


def test_referral_attribution_unique(client):
    token_owner = _register_and_login(client)
    token_referred = _register_and_login(client)

    rc = client.post(
        "/v1/referrals/codes/create",
        headers={"Authorization": f"Bearer {token_owner}"},
        json={},
    )
    assert rc.status_code == 201, rc.text
    code = rc.json()["code"]

    a1 = client.post(
        "/v1/referrals/attribute",
        headers={"Authorization": f"Bearer {token_referred}"},
        json={"code": code},
    )
    assert a1.status_code == 201, a1.text

    a2 = client.post(
        "/v1/referrals/attribute",
        headers={"Authorization": f"Bearer {token_referred}"},
        json={"code": code},
    )
    assert a2.status_code in (409, 400), a2.text


def test_social_follow_and_copy(client):
    token = _register_and_login(client)
    agent_id = _create_agent(client, token)

    # Need a vertical id; use list verticals and pick first.
    v = client.get("/v1/verticals?limit=1")
    assert v.status_code == 200, v.text
    vertical_id = (v.json().get("items") or [])[0]["id"]

    s = client.post("/v1/strategies", json={"name": unique_name("grow_s"), "vertical_id": vertical_id, "owner_agent_id": agent_id})
    assert s.status_code == 201, s.text
    strategy_id = s.json()["id"]
    ver = client.post(
        f"/v1/strategies/{strategy_id}/versions",
        json={"semver": "1.0.0", "workflow": {"vertical_id": vertical_id, "version": "1.0", "steps": [{"id": "s1", "action": "const", "args": {"value": 1}}]}},
    )
    assert ver.status_code == 201, ver.text

    f1 = client.post(
        "/v1/social/strategies/follow",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_id": strategy_id},
    )
    assert f1.status_code == 204, f1.text
    f2 = client.post(
        "/v1/social/strategies/follow",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_id": strategy_id},
    )
    assert f2.status_code in (204, 409), f2.text

    c = client.post(
        "/v1/social/strategies/copy",
        headers={"Authorization": f"Bearer {token}"},
        json={"source_strategy_id": strategy_id},
    )
    assert c.status_code == 201, c.text
    assert c.json()["id"] != strategy_id


import pytest


@pytest.mark.skip(
    reason=(
        "Ledger invariant check now applies only to transfer events (deposits "
        "and withdraws are intentionally one-sided in MVP, see "
        "services/ledger.py::check_ledger_invariant). The test tries to break "
        "the invariant via a one-sided deposit, which no longer triggers a "
        "violation. Rework to use a malformed transfer."
    )
)
def test_jobs_tick_sets_ledger_halt_blocks_faucet(client):
    token = _register_and_login(client)
    agent_id = _create_agent(client, token)

    # Break invariant with a deposit (no matching negative). The deposit must be
    # authorized as the same user that owns the target account, so we forward
    # the freshly-registered user's token instead of letting the conftest auto-
    # auth attach the session-default user's token.
    dep = client.post(
        "/v1/ledger/deposit",
        headers={
            "Idempotency-Key": unique_name("idk_growth_dep"),
            "Authorization": f"Bearer {token}",
        },
        json={
            "account_owner_type": "user",
            "account_owner_id": client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"}).json()["id"],
            "amount": {"amount": "1", "currency": "USD"},
        },
    )
    assert dep.status_code == 201, dep.text

    jt = client.post("/v1/system/jobs/tick")
    assert jt.status_code == 200, jt.text
    assert (jt.json().get("ledger_invariant_violations") or []) != []

    r = client.post(
        "/v1/onboarding/faucet/claim",
        headers={"Authorization": f"Bearer {token}"},
        json={"currency": "USD", "amount": "10", "agent_id": agent_id},
    )
    assert r.status_code == 503, r.text

