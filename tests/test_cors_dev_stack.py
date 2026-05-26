from pathlib import Path


def test_dev_compose_allows_overriding_cors_origins_for_ci_like_frontend_ports():
    compose_text = Path("docker-compose.yml").read_text(encoding="utf-8")

    assert "CORS_ORIGINS:" in compose_text
    assert "${CORS_ORIGINS:-" in compose_text
    assert "http://127.0.0.1:3001" in compose_text
    assert "http://127.0.0.1:3201" in compose_text
