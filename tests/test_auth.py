"""Auth: register user, login."""
from tests.conftest import unique_email


def test_register_user(client):
    email = unique_email()
    r = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": "Test User"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == email
    assert data["display_name"] == "Test User"
    assert "id" in data


def test_register_duplicate_email(client):
    email = unique_email()
    client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": "First"},
    )
    r = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "other456", "display_name": "Second"},
    )
    assert r.status_code == 400


def test_login(client):
    email = unique_email()
    client.post(
        "/v1/auth/users",
        json={"email": email, "password": "secret123", "display_name": "Login Test"},
    )
    r = client.post("/v1/auth/login", json={"email": email, "password": "secret123"})
    assert r.status_code == 200
    data = r.json()
    assert data["token_type"] == "bearer"
    assert "access_token" in data
    assert data["expires_in"] == 3600


def test_login_wrong_password(client):
    email = unique_email()
    client.post(
        "/v1/auth/users",
        json={"email": email, "password": "secret123", "display_name": "User"},
    )
    # Use 8+ chars so body passes validation; we expect 400 for wrong password
    r = client.post("/v1/auth/login", json={"email": email, "password": "wrongpass"})
    assert r.status_code == 400
