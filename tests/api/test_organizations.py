import re

from tests.conftest import unique_email, unique_name


def _register_and_login(client, display_name: str = "Org User"):
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
    return me.json(), headers, email


def _create_org(client, headers, name_prefix: str = "org"):
    response = client.post(
        "/v1/organizations",
        headers=headers,
        json={"name": unique_name(name_prefix), "description": "organization test"},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_organization_member_management_blocks_owner_role_assignment(client):
    owner, owner_headers, _ = _register_and_login(client, "Org Owner")
    _, member_headers, member_email = _register_and_login(client, "Org Member")
    org = _create_org(client, owner_headers, "rbac_org")

    add_owner = client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": member_email, "role": "owner"},
    )
    assert add_owner.status_code == 400, add_owner.text
    assert add_owner.json()["detail"] == "Owner role cannot be assigned via this endpoint"

    add_member = client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": member_email, "role": "member"},
    )
    assert add_member.status_code == 201, add_member.text
    assert add_member.json()["role"] == "member"

    promote_to_owner = client.patch(
        f"/v1/organizations/{org['id']}/members/{add_member.json()['user_id']}/role",
        headers=owner_headers,
        json={"role": "owner"},
    )
    assert promote_to_owner.status_code == 400, promote_to_owner.text
    assert promote_to_owner.json()["detail"] == "Owner role cannot be assigned via this endpoint"

    owner_listing = client.get(f"/v1/organizations/{org['id']}/members", headers=owner_headers)
    assert owner_listing.status_code == 200, owner_listing.text
    roles = {item["user_id"]: item["role"] for item in owner_listing.json()}
    assert roles[owner["id"]] == "owner"
    assert roles[add_member.json()["user_id"]] == "member"

    member_listing = client.get(f"/v1/organizations/{org['id']}/members", headers=member_headers)
    assert member_listing.status_code == 200, member_listing.text


def test_organization_slugify_falls_back_when_name_has_no_slug_chars(client):
    _, headers, _ = _register_and_login(client, "Slug User")

    created = client.post(
        "/v1/organizations",
        headers=headers,
        json={"name": "!!!", "description": "slug fallback"},
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert re.fullmatch(r"organization(?:-\d+)?", body["slug"])


def test_organization_member_can_leave_but_owner_cannot_be_removed(client):
    owner, owner_headers, _ = _register_and_login(client, "Org Owner Leave")
    member, member_headers, member_email = _register_and_login(client, "Org Member Leave")
    org = _create_org(client, owner_headers, "leave_org")

    add_member = client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": member_email, "role": "member"},
    )
    assert add_member.status_code == 201, add_member.text

    leave = client.delete(
        f"/v1/organizations/{org['id']}/members/{member['id']}",
        headers=member_headers,
    )
    assert leave.status_code == 204, leave.text

    owner_listing = client.get(f"/v1/organizations/{org['id']}/members", headers=owner_headers)
    assert owner_listing.status_code == 200, owner_listing.text
    remaining_ids = {item["user_id"] for item in owner_listing.json()}
    assert member["id"] not in remaining_ids

    owner_remove_attempt = client.delete(
        f"/v1/organizations/{org['id']}/members/{owner['id']}",
        headers=owner_headers,
    )
    assert owner_remove_attempt.status_code == 400, owner_remove_attempt.text
    assert owner_remove_attempt.json()["detail"] == "Cannot remove organization owner"


def test_organization_owner_can_delete_but_admin_cannot(client):
    _, owner_headers, _ = _register_and_login(client, "Org Owner Delete")
    _, admin_headers, admin_email = _register_and_login(client, "Org Admin Delete")
    org = _create_org(client, owner_headers, "delete_org")

    add_admin = client.post(
        f"/v1/organizations/{org['id']}/members",
        headers=owner_headers,
        json={"email": admin_email, "role": "admin"},
    )
    assert add_admin.status_code == 201, add_admin.text

    admin_delete_attempt = client.delete(
        f"/v1/organizations/{org['id']}",
        headers=admin_headers,
    )
    assert admin_delete_attempt.status_code == 403, admin_delete_attempt.text

    owner_delete = client.delete(
        f"/v1/organizations/{org['id']}",
        headers=owner_headers,
    )
    assert owner_delete.status_code == 204, owner_delete.text

    missing = client.get(f"/v1/organizations/{org['id']}", headers=owner_headers)
    assert missing.status_code == 404, missing.text


def test_org_audit_requires_auth(client_unauth):
    """GET /organizations/{id}/audit requires auth."""
    import uuid
    r = client_unauth.get(f"/v1/organizations/{uuid.uuid4()}/audit")
    assert r.status_code == 401, r.text


def test_org_audit_returns_403_for_non_member(client):
    """GET /organizations/{id}/audit returns 403 for authenticated non-member."""
    _, headers, _ = _register_and_login(client, "Audit Tester")
    import uuid
    fake_org = str(uuid.uuid4())
    r = client.get(f"/v1/organizations/{fake_org}/audit", headers=headers)
    # Not a member → 403 (role check fails before UUID lookup)
    assert r.status_code == 403, f"expected 403, got {r.status_code}"


def test_org_audit_export_requires_auth(client_unauth):
    """GET /organizations/{id}/audit/export requires auth."""
    import uuid
    r = client_unauth.get(f"/v1/organizations/{uuid.uuid4()}/audit/export")
    assert r.status_code == 401, r.text
