import os
import uuid

from app.config import get_settings
from tests.conftest import unique_email


def _register_and_login(client) -> str:
    email = unique_email()
    password = "password123"
    r = client.post("/auth/users", json={"email": email, "password": password, "display_name": "Wave4"})
    assert r.status_code in (201, 400), r.text
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def test_governance_weighted_vote_and_auto_apply(client):
    token = _register_and_login(client)
    os.environ["FF_GOVERNANCE_AUTO_APPLY"] = "true"
    get_settings.cache_clear()
    try:
        proposal = client.post(
            "/governance/proposals",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "kind": "policy_update",
                "target_type": "policy",
                "payload_json": {
                    "scope_type": "global",
                    "scope_id": "00000000-0000-0000-0000-000000000000",
                    "policy_json": {"max_steps": 777},
                },
            },
        )
        assert proposal.status_code == 201, proposal.text
        pid = proposal.json()["id"]
        submit = client.post(f"/governance/proposals/{pid}/submit", headers={"Authorization": f"Bearer {token}"})
        assert submit.status_code == 200, submit.text
        vote = client.post(
            f"/governance/proposals/{pid}/vote",
            headers={"Authorization": f"Bearer {token}"},
            json={"vote": "approve", "reason": "weighted vote test"},
        )
        assert vote.status_code == 200, vote.text
        decide = client.post(
            f"/governance/proposals/{pid}/decide",
            headers={"Authorization": f"Bearer {token}"},
            json={"decision": "active", "reason": "activate"},
        )
        assert decide.status_code == 200, decide.text
        audit = client.get(f"/governance/proposals/{pid}/audit")
        assert audit.status_code == 200, audit.text
        rows = audit.json().get("items") or []
        assert any((x.get("event_json") or {}).get("vote_weight") is not None for x in rows)
        assert any(x.get("event_type") == "proposal_auto_applied" for x in rows)
    finally:
        os.environ["FF_GOVERNANCE_AUTO_APPLY"] = "false"
        get_settings.cache_clear()


def test_settlement_receipt_has_signature_metadata(client):
    os.environ["CHAIN_ANCHOR_DRIVER"] = "mock"
    get_settings.cache_clear()
    try:
        token = _register_and_login(client)
        token_target = _register_and_login(client)
        me = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        me_target = client.get("/users/me", headers={"Authorization": f"Bearer {token_target}"})
        assert me.status_code == 200, me.text
        assert me_target.status_code == 200, me_target.text
        uid = me.json()["id"]
        target_uid = me_target.json()["id"]
        corr = f"wave4-{uuid.uuid4().hex}"
        create = client.post(
            "/settlements/intents",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "intent_type": "stake_lock",
                "source_owner_type": "user",
                "source_owner_id": uid,
                "target_owner_type": "user",
                "target_owner_id": target_uid,
                "amount_currency": "USD",
                "amount_value": "1",
                "correlation_id": corr,
            },
        )
        assert create.status_code == 201, create.text
        recs = client.get("/settlements/receipts")
        assert recs.status_code == 200, recs.text
        items = recs.json().get("items") or []
        mine = [x for x in items if x.get("correlation_id") == corr]
        assert mine, "Expected receipt for created settlement intent"
        assert mine[0].get("node_signature") is not None
    finally:
        os.environ["CHAIN_ANCHOR_DRIVER"] = "acp"
        get_settings.cache_clear()
