"""Users: me (requires auth)."""
from tests.conftest import unique_email


def test_me_unauthorized(client):
    # Explicitly opt out of the session-wide default token to verify the 401 path.
    r = client.get("/v1/users/me", headers={"Authorization": ""})
    assert r.status_code == 401


def test_me_success(client):
    email = unique_email()
    reg = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "pass1234", "display_name": "Me Test"},
    )
    assert reg.status_code == 201, reg.text
    login = client.post("/v1/auth/login", json={"email": email, "password": "pass1234"})
    assert login.status_code == 200, login.text
    data = login.json()
    token = data.get("access_token")
    assert token, data
    r = client.get("/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == email
