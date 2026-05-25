"""Pools: create, list, get."""
from tests.conftest import unique_name


def test_create_pool(client):
    r = client.post(
        "/v1/pools",
        json={"name": unique_name("pool"), "risk_profile": "medium"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["risk_profile"] == "medium"
    assert data["status"] == "active"
    assert data["owner_agent_id"] is None


def test_create_pool_with_owner_agent(client):
    agent = client.post(
        "/v1/agents",
        json={"display_name": unique_name("pool_owner"), "public_key": "p" * 32, "roles": ["seller"]},
    )
    assert agent.status_code == 201, agent.text

    r = client.post(
        "/v1/pools",
        json={
            "name": unique_name("owned_pool"),
            "risk_profile": "medium",
            "owner_agent_id": agent.json()["id"],
        },
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["owner_agent_id"] == agent.json()["id"]


def test_list_and_get_pool(client):
    create = client.post(
        "/v1/pools",
        json={"name": unique_name("get_pool"), "risk_profile": "low"},
    )
    pid = create.json()["id"]
    r = client.get("/v1/pools", params={"limit": 5})
    assert r.status_code == 200
    r2 = client.get(f"/v1/pools/{pid}")
    assert r2.status_code == 200
    assert r2.json()["id"] == pid
    assert "owner_agent_id" in r2.json()
