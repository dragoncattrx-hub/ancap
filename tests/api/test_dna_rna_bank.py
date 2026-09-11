"""DNA/RNA digital bank API tests."""

from tests.api.test_organizations import _register_and_login


def test_dna_rna_bank_encrypt_roundtrip(client):
    user, headers, _ = _register_and_login(client, "Dna Bank User")

    cipher = client.get("/v1/dna-rna-bank/cipher")
    assert cipher.status_code == 200, cipher.text
    assert cipher.json()["cipher_id"] == "aes256-gcm-hkdf-sha384-dna-rna-v1"
    assert cipher.json()["kdf"] == "HKDF-SHA384"

    created = client.post(
        "/v1/dna-rna-bank/entries",
        headers=headers,
        json={
            "molecule": "rna",
            "entry_type": "blood_rna_panel",
            "title": "15-axis blood RNA summary",
            "species": "Homo sapiens",
            "sample_id": "RNA-001",
            "sequence_summary": "panel metadata only — not a full transcriptome",
            "notes": "research use",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["molecule"] == "rna"
    assert body["cipher_id"] == "aes256-gcm-hkdf-sha384-dna-rna-v1"
    assert body["content_hash"].startswith("sha384:")
    assert body["payload"]["sample_id"] == "RNA-001"

    listed = client.get("/v1/dna-rna-bank/entries", headers=headers)
    assert listed.status_code == 200, listed.text
    assert len(listed.json()["items"]) == 1
    assert "payload" not in listed.json()["items"][0]

    detail = client.get(f"/v1/dna-rna-bank/entries/{body['id']}", headers=headers)
    assert detail.status_code == 200, detail.text
    assert detail.json()["payload"]["sequence_summary"].startswith("panel metadata")

    other, other_headers, _ = _register_and_login(client, "Dna Bank Other")
    denied = client.get(f"/v1/dna-rna-bank/entries/{body['id']}", headers=other_headers)
    assert denied.status_code == 404

    deleted = client.delete(f"/v1/dna-rna-bank/entries/{body['id']}", headers=headers)
    assert deleted.status_code == 204, deleted.text
    empty = client.get("/v1/dna-rna-bank/entries", headers=headers)
    assert empty.json()["items"] == []
