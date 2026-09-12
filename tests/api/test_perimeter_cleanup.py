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
    body = cat.json()
    services = body["services"]
    assert any(s["id"] == "perimeter-full-sweep" for s in services)
    assert any(s["contamination"] == "mixed_all" for s in services)
    assert any(s["id"] == "perimeter-micro-site" and s.get("small_operator") is True for s in services)
    assert body.get("not_rwa_yield") is True
    note = (body.get("accessibility_note") + " " + body.get("market_structure_note")).lower()
    assert "key ceremony" in note or "login" in note
    assert "aave" in note or "rwa" in note


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
    assert "perimeter-micro-site" in ids


def test_blast_radius_canary_holds():
    from app.services.perimeter_blast_radius import run_canary_proof

    proof = run_canary_proof()
    assert proof["proof_status"] == "held"
    assert proof["namespaces"]["fingerprints_distinct"] is True
    foreign = [a for a in proof["attempts"] if a["role"] != "control_perimeter"]
    assert all(a["opened"] is False for a in foreign)
    control = next(a for a in proof["attempts"] if a["role"] == "control_perimeter")
    assert control["opened"] is True
    assert proof["captured_brief"]["content_hash"].startswith("sha384:")


def test_blast_radius_fails_if_dna_key_collides(monkeypatch):
    from app.services import dna_rna_crypto, perimeter_crypto
    from app.services.perimeter_blast_radius import run_canary_proof

    monkeypatch.setattr(dna_rna_crypto, "derive_bank_key", perimeter_crypto.derive_vault_key)
    proof = run_canary_proof()
    assert proof["proof_status"] == "failed"
    dna_peri = next(a for a in proof["attempts"] if a["role"] == "dna_key_perimeter_aad")
    assert dna_peri["opened"] is True


def test_blast_radius_http_and_owner_job(client):
    public = client.get("/v1/perimeter-cleanup/blast-radius")
    assert public.status_code == 200, public.text
    body = public.json()
    assert body["proof_status"] == "held"
    assert body["subject"] == "canary"
    assert any("Snapshot SHA-384" in step for step in body["procedure"])
    assert len(body["attempts"]) == 5

    headers = _register_user(client, "blast")
    create = client.post(
        "/v1/perimeter-cleanup/jobs",
        headers=headers,
        json={
            "service_id": "perimeter-micro-site",
            "contamination": "industrial",
            "site_label": "captured brief gate",
        },
    )
    assert create.status_code == 201, create.text
    job_id = create.json()["id"]
    proof = client.get(f"/v1/perimeter-cleanup/jobs/{job_id}/blast-radius", headers=headers)
    assert proof.status_code == 200, proof.text
    captured = proof.json()
    assert captured["subject"] == "captured_owner_brief"
    assert captured["proof_status"] == "held"
    assert captured["captured_brief"]["kind"] == "owner_job"
    assert "plaintext_sha384" not in captured["captured_brief"] or captured["captured_brief"].get("plaintext_sha384") in (None, "")

