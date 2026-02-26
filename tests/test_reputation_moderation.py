"""Reputation and Moderation."""
import uuid


def test_reputation_not_found(client):
    r = client.get(
        "/v1/reputation",
        params={"subject_type": "agent", "subject_id": str(uuid.uuid4())},
    )
    assert r.status_code == 404


def test_reputation_get_requires_valid_subject_id(client):
    """GET /v1/reputation returns 400 when subject_id is not a valid UUID."""
    r = client.get(
        "/v1/reputation",
        params={"subject_type": "agent", "subject_id": "not-a-uuid"},
    )
    assert r.status_code == 400
    assert "subject_id" in (r.json().get("detail") or "").lower() or "uuid" in (r.json().get("detail") or "").lower()


def test_reputation_events_list(client):
    """GET /v1/reputation/events returns list (possibly empty) with cursor fields."""
    agent_id = uuid.uuid4()
    # Use a random agent UUID; events may be empty
    r = client.get(
        "/v1/reputation/events",
        params={"subject_type": "agent", "subject_id": str(agent_id), "limit": 10},
    )
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "next_cursor" in data
    assert isinstance(data["items"], list)


def test_reputation_events_list_invalid_cursor(client):
    """GET /v1/reputation/events with invalid cursor returns 400."""
    r = client.get(
        "/v1/reputation/events",
        params={"subject_type": "agent", "subject_id": str(uuid.uuid4()), "cursor": "invalid"},
    )
    assert r.status_code == 400


def test_reputation_recompute(client):
    """POST /v1/reputation/recompute accepts subject_type and subject_id."""
    r = client.post(
        "/v1/reputation/recompute",
        json={"subject_type": "agent", "subject_id": str(uuid.uuid4())},
    )
    assert r.status_code == 202
    data = r.json()
    assert data.get("status") == "accepted"
    assert "subject_type" in data and "subject_id" in data


def test_moderation_action(client):
    r = client.post(
        "/v1/moderation/actions",
        json={
            "target_type": "pool",
            "target_id": "00000000-0000-0000-0000-000000000000",
            "action": "halt",
        },
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_moderation_agent_graph_context(client):
    """GET /v1/moderation/agents/{id}/graph-context returns metrics + flags for moderation (ROADMAP 2.1)."""
    from tests.conftest import unique_name
    create = client.post(
        "/v1/agents",
        json={"display_name": unique_name("mod_ctx"), "public_key": "m" * 32, "roles": ["seller"]},
    )
    agent_id = create.json()["id"]
    r = client.get(f"/v1/moderation/agents/{agent_id}/graph-context")
    assert r.status_code == 200
    data = r.json()
    assert "metrics" in data and "flags" in data
    assert "reciprocity_score" in data["metrics"] and "cluster_size" in data["metrics"] and "in_cycle" in data["metrics"]
    assert "in_cycle" in data["flags"] and "suspicious_density_high" in data["flags"] and "large_cluster" in data["flags"]
    assert isinstance(data["flags"]["in_cycle"], bool)


def test_moderation_agent_graph_context_not_found(client):
    r = client.get(f"/v1/moderation/agents/{uuid.uuid4()}/graph-context")
    assert r.status_code == 404
