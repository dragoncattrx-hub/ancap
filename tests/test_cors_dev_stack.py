from pathlib import Path


def test_dev_compose_allows_overriding_cors_origins_for_ci_like_frontend_ports():
    compose_text = Path("docker-compose.yml").read_text(encoding="utf-8")

    assert "CORS_ORIGINS:" in compose_text
    assert "${CORS_ORIGINS:-" in compose_text
    assert "http://127.0.0.1:3001" in compose_text
    assert "http://127.0.0.1:3201" in compose_text


def test_prod_compose_forwards_cors_origins_for_ancap_cloud():
    compose_text = Path("docker-compose.prod.yml").read_text(encoding="utf-8")

    assert "CORS_ORIGINS:" in compose_text
    assert "${CORS_ORIGINS:-https://ancap.cloud,https://www.ancap.cloud}" in compose_text
    assert "NEXT_PUBLIC_API_URL: https://api.ancap.cloud/v1" in compose_text


def test_auth_cookie_docs_match_lax_runtime():
    auth_text = Path("app/api/routers/auth.py").read_text(encoding="utf-8")
    assert 'samesite="lax"' in auth_text
    roadmap = Path("MASTER_ROADMAP.md").read_text(encoding="utf-8")
    assert "SameSite=lax" in roadmap
    # Stale strict claim must not reappear as the active cookie policy.
    assert "auth cookie set/clear paths use `SameSite=strict`" not in roadmap
