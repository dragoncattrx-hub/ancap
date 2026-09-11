"""Digital passport API tests."""

import hashlib
import uuid

from tests.api.test_organizations import _create_org, _register_and_login


def _unique_uid_hash(prefix: str) -> str:
    digest = hashlib.sha256(f"{prefix}:{uuid.uuid4()}".encode()).hexdigest()
    return f"sha256:{digest}"


def _verify_member(client, org_id, admin_headers, member_user_id, nfc_hash=None):
    body = {}
    if nfc_hash:
        body["nfc_uid_hash"] = nfc_hash
    return client.post(
        f"/v1/organizations/{org_id}/identity/members/{member_user_id}/verify",
        headers=admin_headers,
        json=body,
    )


def _register_nfc(client, org_id, member_headers, uid_hash):
    return client.post(
        f"/v1/organizations/{org_id}/identity/nfc/register",
        headers=member_headers,
        json={"uid_hash": uid_hash, "label": "biohax"},
    )


def _issue_passport(client, org, owner_headers, member, member_headers):
    uid_hash = _unique_uid_hash("edu")
    reg = _register_nfc(client, org["id"], member_headers, uid_hash)
    assert reg.status_code == 201, reg.text
    verify = _verify_member(client, org["id"], owner_headers, member["id"], uid_hash)
    assert verify.status_code == 200, verify.text
    wallet = "0x" + ("e" * 40)
    issue = client.post(
        f"/v1/organizations/{org['id']}/identity/members/{member['id']}/passport",
        headers=owner_headers,
        json={"wallet_address": wallet, "nfc_credential_id": reg.json()["id"]},
    )
    assert issue.status_code == 201, issue.text
    return issue.json()


def test_digital_passport_issue_and_list(client):
    owner, owner_headers, _ = _register_and_login(client, "Passport Owner")
    member, member_headers, _ = _register_and_login(client, "Passport Member")
    org = _create_org(client, owner_headers, "passport_org")

    add = client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": member["email"], "role": "member"},
    )
    assert add.status_code == 201, add.text

    uid_hash = _unique_uid_hash("issue")
    reg = _register_nfc(client, org["id"], member_headers, uid_hash)
    assert reg.status_code == 201, reg.text

    verify = _verify_member(client, org["id"], owner_headers, member["id"], uid_hash)
    assert verify.status_code == 200, verify.text

    wallet = "0x" + ("b" * 40)
    issue = client.post(
        f"/v1/organizations/{org['id']}/identity/members/{member['id']}/passport",
        headers=owner_headers,
        json={"wallet_address": wallet, "nfc_credential_id": reg.json()["id"]},
    )
    assert issue.status_code == 201, issue.text
    body = issue.json()
    assert body["status"] == "active"
    assert body["wallet_address"] == wallet.lower()
    assert body["token_id"] >= 1
    assert body["claim_hash"].startswith("0x")

    listed = client.get("/v1/passports/me", headers=member_headers)
    assert listed.status_code == 200, listed.text
    assert len(listed.json()["items"]) == 1

    meta = client.get(f"/v1/passports/{body['id']}/metadata")
    assert meta.status_code == 200, meta.text
    assert meta.json()["name"].startswith("ANCAP Digital Passport")


def test_digital_passport_revoke_on_member_suspend(client):
    owner, owner_headers, _ = _register_and_login(client, "Revoke Owner")
    member, member_headers, _ = _register_and_login(client, "Revoke Member")
    org = _create_org(client, owner_headers, "revoke_org")

    client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": member["email"], "role": "member"},
    )

    uid_hash = _unique_uid_hash("revoke")
    _register_nfc(client, org["id"], member_headers, uid_hash)
    _verify_member(client, org["id"], owner_headers, member["id"], uid_hash)

    wallet = "0x" + ("d" * 40)
    issue = client.post(
        f"/v1/organizations/{org['id']}/identity/members/{member['id']}/passport",
        headers=owner_headers,
        json={"wallet_address": wallet},
    )
    assert issue.status_code == 201, issue.text
    passport_id = issue.json()["id"]

    suspend = client.patch(
        f"/v1/organizations/{org['id']}/identity/members/{member['id']}/status",
        headers=owner_headers,
        json={"verification_status": "suspended"},
    )
    assert suspend.status_code == 200, suspend.text

    fetched = client.get(f"/v1/passports/{passport_id}", headers=member_headers)
    assert fetched.status_code == 200, fetched.text
    assert fetched.json()["status"] == "revoked"


def test_nfc_policy_blocks_admin_without_credential(client):
    owner, owner_headers, _ = _register_and_login(client, "Policy Owner")
    member, member_headers, _ = _register_and_login(client, "Policy Member")
    org = _create_org(client, owner_headers, "policy_org")

    client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": member["email"], "role": "admin"},
    )

    enable = client.put(
        f"/v1/organizations/{org['id']}/identity/policy",
        headers=owner_headers,
        json={"require_nfc_for_admins": True},
    )
    assert enable.status_code == 200, enable.text

    verify = _verify_member(client, org["id"], member_headers, member["id"])
    assert verify.status_code == 403, verify.text
    assert "NFC credential" in verify.json()["detail"]


def test_passport_education_docs_encrypt_roundtrip(client):
    owner, owner_headers, _ = _register_and_login(client, "Edu Owner")
    member, member_headers, _ = _register_and_login(client, "Edu Member")
    org = _create_org(client, owner_headers, "edu_org")
    client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": member["email"], "role": "member"},
    )
    passport = _issue_passport(client, org, owner_headers, member, member_headers)
    pid = passport["id"]

    cipher = client.get("/v1/passports/education/cipher")
    assert cipher.status_code == 200, cipher.text
    assert cipher.json()["cipher_id"] == "chacha20poly1305-hkdf-sha256-v2"

    created = client.post(
        f"/v1/passports/{pid}/education-docs",
        headers=member_headers,
        json={
            "doc_type": "diploma",
            "title": "MSc Cryptography",
            "institution": "ANCAP Academy",
            "program": "Applied Crypto",
            "credential_id": "DIP-42",
            "issued_on": "2024-06-01",
            "notes": "honours",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["title_hint"] == "MSc Cryptography"
    assert body["cipher_id"] == "chacha20poly1305-hkdf-sha256-v2"
    assert body["payload"]["institution"] == "ANCAP Academy"
    assert body["content_hash"].startswith("sha256:")

    listed = client.get(f"/v1/passports/{pid}/education-docs", headers=member_headers)
    assert listed.status_code == 200, listed.text
    assert len(listed.json()["items"]) == 1
    assert "payload" not in listed.json()["items"][0]

    detail = client.get(
        f"/v1/passports/{pid}/education-docs/{body['id']}",
        headers=member_headers,
    )
    assert detail.status_code == 200, detail.text
    assert detail.json()["payload"]["credential_id"] == "DIP-42"

    other, other_headers, _ = _register_and_login(client, "Edu Other")
    denied = client.get(
        f"/v1/passports/{pid}/education-docs/{body['id']}",
        headers=other_headers,
    )
    assert denied.status_code == 404

    deleted = client.delete(
        f"/v1/passports/{pid}/education-docs/{body['id']}",
        headers=member_headers,
    )
    assert deleted.status_code == 204, deleted.text
    empty = client.get(f"/v1/passports/{pid}/education-docs", headers=member_headers)
    assert empty.status_code == 200
    assert empty.json()["items"] == []
