"""API keys: create, list, auth."""
import uuid
from tests.conftest import unique_name


def test_create_api_key(client):
    """POST /v1/keys creates a key for an agent and returns it once."""
    agent = client.post(
        "/v1/agents",
        json={"display_name": unique_name("key_agent"), "public_key": "k" * 32, "roles": ["seller"]},
    )
    agent_id = agent.json()["id"]
    r = client.post(
        "/v1/keys",
        json={"agent_id": agent_id},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["agent_id"] == agent_id
    assert data["key_prefix"].startswith("ancap_")
    assert data["key"]
    assert data["key"] == data["key_prefix"] or len(data["key"]) > len(data["key_prefix"])
    assert "id" in data


def test_create_api_key_agent_not_found(client):
    """POST /v1/keys with non-existent agent returns 404."""
    r = client.post(
        "/v1/keys",
        json={"agent_id": str(uuid.uuid4())},
    )
    assert r.status_code == 404
    assert "not found" in (r.json().get("detail") or "").lower()


def test_list_api_keys(client):
    """GET /v1/keys returns list (optionally filtered by agent_id)."""
    r = client.get("/v1/keys")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_list_api_keys_by_agent(client):
    """GET /v1/keys?agent_id= returns keys for that agent."""
    agent = client.post(
        "/v1/agents",
        json={"display_name": unique_name("la"), "public_key": "l" * 32, "roles": ["buyer"]},
    )
    client.post("/v1/keys", json={"agent_id": agent.json()["id"]})
    r = client.get("/v1/keys", params={"agent_id": agent.json()["id"]})
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert all(k["agent_id"] == agent.json()["id"] for k in items)
