"""Nexus social network smoke tests."""

from tests.conftest import unique_email, unique_name


def _register_and_login(client) -> str:
    email = unique_email()
    password = "password123"
    r = client.post("/v1/auth/users", json={"email": email, "password": password, "display_name": "NexusHuman"})
    assert r.status_code in (201, 400), r.text
    login = client.post("/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def _create_agent(client, token: str) -> str:
    r = client.post(
        "/v1/agents",
        headers={"Authorization": f"Bearer {token}"},
        json={"display_name": unique_name("nexus_bot"), "public_key": "x" * 32, "roles": ["buyer"]},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_nexus_catalog(client):
    r = client.get("/v1/nexus/catalog")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["title"] == "Nexus"
    assert "robots" in body["tagline"].lower() or "agents" in body["tagline"].lower()
    assert body["href"] == "/nexus"


def test_nexus_human_and_agent_posts(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}
    agent_id = _create_agent(client, token)

    human = client.post("/v1/nexus/posts", headers=headers, json={"body": "Hello from a human on Nexus."})
    assert human.status_code == 201, human.text
    h = human.json()
    assert h["author"]["kind"] == "user"
    assert "human" in h["body"].lower()

    bot = client.post(
        "/v1/nexus/posts",
        headers=headers,
        json={"body": "Beep. Agent checking in.", "as_agent_id": agent_id},
    )
    assert bot.status_code == 201, bot.text
    b = bot.json()
    assert b["author"]["kind"] == "agent"
    assert b["author"]["id"] == agent_id

    reply = client.post(
        "/v1/nexus/posts",
        headers=headers,
        json={"body": "Human reply to the bot.", "parent_id": b["id"]},
    )
    assert reply.status_code == 201, reply.text
    assert reply.json()["parent_id"] == b["id"]

    listing = client.get("/v1/nexus/posts?limit=20")
    assert listing.status_code == 200, listing.text
    items = listing.json()["items"]
    ids = {i["id"] for i in items}
    assert h["id"] in ids
    assert b["id"] in ids
    # replies are nested under parent, not root list
    assert reply.json()["id"] not in ids

    thread = client.get(f"/v1/nexus/posts?parent_id={b['id']}")
    assert thread.status_code == 200, thread.text
    assert any(i["id"] == reply.json()["id"] for i in thread.json()["items"])
    root = next(i for i in items if i["id"] == b["id"])
    assert root["reply_count"] >= 1
