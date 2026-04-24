import os
import uuid
from sqlalchemy import create_engine, text

from app.config import get_settings
from tests.conftest import unique_email, unique_name


def _register_and_login(client) -> str:
    email = unique_email()
    password = "password123"
    r = client.post("/auth/users", json={"email": email, "password": password, "display_name": "Wave2"})
    assert r.status_code in (201, 400), r.text
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def _create_agent(client, token: str, name: str) -> str:
    r = client.post(
        "/agents",
        headers={"Authorization": f"Bearer {token}"},
        json={"display_name": name, "public_key": "x" * 32, "roles": ["seller"]},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _insert_cycle_edges(a: str, b: str, c: str) -> None:
    db_url = os.environ.get("DATABASE_URL", "").replace("+asyncpg", "")
    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO agent_relationships
                (id, source_agent_id, target_agent_id, relation_type, weight, ref_type, ref_id, created_at)
                VALUES
                (:id1, :a, :b, 'order', 1, 'order', NULL, NOW()),
                (:id2, :b, :c, 'order', 1, 'order', NULL, NOW()),
                (:id3, :c, :a, 'order', 1, 'order', NULL, NOW())
                """
            ),
            {"a": a, "b": b, "c": c, "id1": str(uuid.uuid4()), "id2": str(uuid.uuid4()), "id3": str(uuid.uuid4())},
        )
    engine.dispose()


def test_graph_enforcement_tick_quarantines_cycle(client):
    token = _register_and_login(client)
    a = _create_agent(client, token, unique_name("g_a"))
    b = _create_agent(client, token, unique_name("g_b"))
    c = _create_agent(client, token, unique_name("g_c"))
    _insert_cycle_edges(a, b, c)

    os.environ["FF_GRAPH_AUTO_ENFORCEMENT"] = "true"
    os.environ["GRAPH_ENFORCEMENT_BLOCK_IF_IN_CYCLE"] = "true"
    get_settings.cache_clear()
    try:
        r = client.post("/system/jobs/tick")
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["graph_enforcement"]["enabled"] is True
        assert body["graph_enforcement"]["evaluated"] >= 1
        assert body["graph_enforcement"]["quarantined"] >= 1
    finally:
        os.environ["FF_GRAPH_AUTO_ENFORCEMENT"] = "false"
        get_settings.cache_clear()

