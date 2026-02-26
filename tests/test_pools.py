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
