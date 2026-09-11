"""Perimeter cleanup desk + Abrams Suite-B vault tests."""

from uuid import uuid4

from app.services import perimeter_crypto
from app.services.perimeter_cleanup import catalog


def _register_user(client, label: str):
    email = f"{label}_{uuid4().hex[:12]}@test.com"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": "password123", "display_name": label},
        headers={"Authorization": ""},
    )
    assert res.status_code in (200, 201), res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_perimeter_catalog_and_cipher(client):
    c = client.get("/v1/perimeter-cleanup/cipher")
    assert c.status_code == 200, c.text
    body = c.json()
    assert body["algorithm"] == "AES-256-GCM"
    assert body["kdf"] == "HKDF-SHA384"
    assert "abrams-suiteb" in body["cipher_id"]

    cat = client.get("/v1/perimeter-cleanup/catalog")
    assert cat.status_code == 200, cat.text
    services = cat.json()["services"]
    assert any(s["id"] == "perimeter-full-sweep" for s in services)
    assert any(s["contamination"] == "mixed_all" for s in services)


def test_perimeter_crypto_roundtrip():
    ct, nonce, chash, cipher_id = perimeter_crypto.encrypt_payload(
        {"site_label": "north fence", "contamination": "mixed_all"}
    )
    assert cipher_id == perimeter_crypto.CIPHER_ID
    assert chash.startswith("sha384:")
    out = perimeter_crypto.decrypt_payload(ciphertext_b64=ct, nonce_b64=nonce)
    assert out["site_label"] == "north fence"


def test_perimeter_job_create_and_decrypt(client):
    headers = _register_user(client, "peri")
    create = client.post(
        "/v1/perimeter-cleanup/jobs",
        headers=headers,
        json={
            "service_id": "perimeter-full-sweep",
            "contamination": "mixed_all",
            "site_label": "Plant gate perimeter",
            "perimeter_meters": "420",
            "notes": "oil + dust",
        },
    )
    assert create.status_code == 201, create.text
    job = create.json()
    assert job["cipher_id"] == perimeter_crypto.CIPHER_ID
    assert job["payload"]["site_label"] == "Plant gate perimeter"
    assert "ciphertext" not in job

    got = client.get(f"/v1/perimeter-cleanup/jobs/{job['id']}", headers=headers)
    assert got.status_code == 200, got.text
    assert got.json()["payload"]["contamination"] == "mixed_all"


def test_catalog_helper_lists_full_sweep():
    raw = catalog()
    ids = {s["id"] for s in raw["services"]}
    assert "perimeter-full-sweep" in ids
