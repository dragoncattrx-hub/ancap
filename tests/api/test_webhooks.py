from tests.conftest import unique_email, unique_name


def _register_and_login(client, display_name: str = "Webhook User"):
    email = unique_email()
    password = "password123"
    registered = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": display_name},
        headers={"Authorization": ""},
    )
    assert registered.status_code in (200, 201), registered.text
    login = client.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
        headers={"Authorization": ""},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200, me.text
    return me.json(), headers


def test_webhook_crud_and_owner_scoped_access(client):
    _, owner_headers = _register_and_login(client, "Webhook Owner")
    _, stranger_headers = _register_and_login(client, "Webhook Stranger")

    created = client.post(
        "/v1/webhooks",
        headers=owner_headers,
        json={
            "url": f"https://example.com/{unique_name('wh')}",
            "event_types": ["run.completed", "receipt.ready"],
            "description": "test webhook",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    webhook_id = body["id"]
    assert body["url"].startswith("https://example.com/")
    assert body["event_types"] == ["run.completed", "receipt.ready"]

    listing = client.get("/v1/webhooks", headers=owner_headers)
    assert listing.status_code == 200, listing.text
    listed_ids = {item["id"] for item in listing.json()}
    assert webhook_id in listed_ids

    fetched = client.get(f"/v1/webhooks/{webhook_id}", headers=owner_headers)
    assert fetched.status_code == 200, fetched.text
    assert fetched.json()["id"] == webhook_id

    deliveries = client.get(f"/v1/webhooks/{webhook_id}/deliveries", headers=owner_headers)
    assert deliveries.status_code == 200, deliveries.text
    assert isinstance(deliveries.json(), list)

    stranger_listing = client.get("/v1/webhooks", headers=stranger_headers)
    assert stranger_listing.status_code == 200, stranger_listing.text
    assert webhook_id not in {item["id"] for item in stranger_listing.json()}

    stranger_fetch = client.get(f"/v1/webhooks/{webhook_id}", headers=stranger_headers)
    assert stranger_fetch.status_code == 404, stranger_fetch.text

    stranger_deliveries = client.get(f"/v1/webhooks/{webhook_id}/deliveries", headers=stranger_headers)
    assert stranger_deliveries.status_code == 404, stranger_deliveries.text

    rotated = client.post(f"/v1/webhooks/{webhook_id}/rotate-secret", headers=owner_headers)
    assert rotated.status_code == 200, rotated.text
    assert rotated.json()["id"] == webhook_id

    deleted = client.delete(f"/v1/webhooks/{webhook_id}", headers=owner_headers)
    assert deleted.status_code == 204, deleted.text

    missing = client.get(f"/v1/webhooks/{webhook_id}", headers=owner_headers)
    assert missing.status_code == 404, missing.text


def test_webhook_validation_requires_http_and_event_types(client):
    _, headers = _register_and_login(client, "Webhook Validation")

    no_events = client.post(
        "/v1/webhooks",
        headers=headers,
        json={
            "url": "https://example.com/hook",
            "event_types": [],
        },
    )
    assert no_events.status_code == 400, no_events.text
    assert no_events.json()["detail"] == "At least one event type is required"

    bad_scheme = client.post(
        "/v1/webhooks",
        headers=headers,
        json={
            "url": "ftp://example.com/hook",
            "event_types": ["run.completed"],
        },
    )
    assert bad_scheme.status_code == 400, bad_scheme.text
    assert bad_scheme.json()["detail"] == "URL must be http or https"


def test_webhook_replay_endpoint_routes_correctly(client, monkeypatch):
    """POST /webhooks/{id}/deliveries/{id}/replay routes and handles auth correctly.

    Tests the endpoint at the routing + auth layer without needing a real delivery
    in the DB (uses 404 for missing webhook/delivery — proves auth+ownership check
    passed, only the lookup failed).
    """
    _, headers = _register_and_login(client, "Webhook Replay")
    import uuid

    # Non-existent webhook → 404 (not 401/403 → auth+ownership check passed)
    fake_wh = str(uuid.uuid4())
    fake_del = str(uuid.uuid4())
    r = client.post(f"/v1/webhooks/{fake_wh}/deliveries/{fake_del}/replay", headers=headers)
    assert r.status_code == 404, f"expected 404 for unknown webhook, got {r.status_code}: {r.text}"

    # Create a real webhook
    created = client.post(
        "/v1/webhooks",
        headers=headers,
        json={"url": f"https://example.com/{unique_name('wh')}", "event_types": ["run.completed"]},
    )
    assert created.status_code == 201, created.text
    webhook_id = created.json()["id"]

    # Real webhook + non-existent delivery → 404 (proves lookup is wired)
    fake_del2 = str(uuid.uuid4())
    r2 = client.post(f"/v1/webhooks/{webhook_id}/deliveries/{fake_del2}/replay", headers=headers)
    assert r2.status_code == 404, f"expected 404 for unknown delivery, got {r2.status_code}: {r2.text}"


def test_webhook_replay_requires_auth(client_unauth):
    """Replay endpoint returns 401 without authentication."""
    import uuid
    fake_webhook = str(uuid.uuid4())
    fake_delivery = str(uuid.uuid4())
    replay = client_unauth.post(f"/v1/webhooks/{fake_webhook}/deliveries/{fake_delivery}/replay")
    assert replay.status_code == 401, replay.text


def test_webhook_get_single_delivery_404_for_nonexistent(client):
    """GET /webhooks/{id}/deliveries/{id} returns 404 for non-existent delivery."""
    _, headers = _register_and_login(client, "Webhook Get Delivery")
    import uuid
    fake_webhook = str(uuid.uuid4())
    fake_delivery = str(uuid.uuid4())
    fetched = client.get(f"/v1/webhooks/{fake_webhook}/deliveries/{fake_delivery}", headers=headers)
    assert fetched.status_code == 404, fetched.text
