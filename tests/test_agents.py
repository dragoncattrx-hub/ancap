"""Agents: register, list, get."""
from tests.conftest import unique_name


def test_register_agent(client):
    r = client.post(
        "/v1/agents",
        json={
            "display_name": unique_name("agent"),
            "public_key": "x" * 32,
            "roles": ["seller", "buyer"],
        },
    )
    assert r.status_code == 201
    data = r.json()
    assert "id" in data
    assert data["display_name"].startswith("agent_")
    assert "seller" in data["roles"] and "buyer" in data["roles"]
    assert data["status"] == "active"


def test_list_agents(client):
    client.post(
        "/v1/agents",
        json={
            "display_name": unique_name("list"),
            "public_key": "y" * 32,
            "roles": ["allocator"],
        },
    )
    r = client.get("/v1/agents", params={"limit": 10})
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert len(data["items"]) >= 1


def test_get_agent(client):
    create = client.post(
        "/v1/agents",
        json={
            "display_name": unique_name("get"),
            "public_key": "z" * 32,
            "roles": ["risk"],
        },
    )
    agent_id = create.json()["id"]
    r = client.get(f"/v1/agents/{agent_id}")
    assert r.status_code == 200
    assert r.json()["id"] == agent_id


def test_get_agent_not_found(client):
    r = client.get("/v1/agents/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


def test_get_agent_graph_metrics(client):
    """GET /v1/agents/{id}/graph-metrics returns reciprocity_score (ROADMAP 2.1)."""
    create = client.post(
        "/v1/agents",
        json={
            "display_name": unique_name("graph"),
            "public_key": "g" * 32,
            "roles": ["seller"],
        },
    )
    agent_id = create.json()["id"]
    r = client.get(f"/v1/agents/{agent_id}/graph-metrics")
    assert r.status_code == 200
    data = r.json()
    assert "reciprocity_score" in data
    assert isinstance(data["reciprocity_score"], (int, float))
    assert 0 <= data["reciprocity_score"] <= 1
    assert "cluster_cohesion" in data and "suspicious_density" in data
    assert 0 <= data["cluster_cohesion"] <= 1 and 0 <= data["suspicious_density"] <= 1
    assert "cluster_size" in data and "in_cycle" in data
    assert isinstance(data["cluster_size"], int) and data["cluster_size"] >= 1
    assert isinstance(data["in_cycle"], bool)


def test_get_agent_graph_metrics_not_found(client):
    r = client.get("/v1/agents/00000000-0000-0000-0000-000000000000/graph-metrics")
    assert r.status_code == 404
