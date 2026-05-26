from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
NGINX_CONF = REPO_ROOT / "infra" / "nginx" / "default.conf"

EXPECTED_PROXY_HIDE_HEADERS = [
    "proxy_hide_header X-Frame-Options;",
    "proxy_hide_header X-Content-Type-Options;",
    "proxy_hide_header Referrer-Policy;",
    "proxy_hide_header Permissions-Policy;",
    "proxy_hide_header Strict-Transport-Security;",
]

PROXIED_LOCATION_SNIPPETS = [
    """location / {\n        set $upstream_api api;\n        proxy_pass http://$upstream_api:8000;""",
    """location = /rpc {\n        proxy_pass http://acp-node:8545/rpc;""",
    """location = /openapi.json {\n        set $upstream_api api;\n        proxy_pass http://$upstream_api:8000/openapi.json;""",
    """location ^~ /api {\n        set $upstream_api api;\n        rewrite ^/api/?(.*)$ /$1 break;\n        proxy_pass http://$upstream_api:8000;""",
    """location ^~ /_next/ {\n        set $upstream_frontend frontend;\n        proxy_pass http://$upstream_frontend:3000$request_uri;""",
    """location / {\n        set $upstream_frontend frontend;\n        proxy_pass http://$upstream_frontend:3000$request_uri;""",
]


def _read_nginx_conf() -> str:
    return NGINX_CONF.read_text(encoding="utf-8")


def test_proxied_locations_hide_upstream_security_headers_before_readding_them():
    config = _read_nginx_conf()

    for snippet in PROXIED_LOCATION_SNIPPETS:
        assert snippet in config, f"expected nginx location block missing from {NGINX_CONF}"
        block = config.split(snippet, 1)[1].split("\n    }", 1)[0]
        for header in EXPECTED_PROXY_HIDE_HEADERS:
            assert header in block, f"missing `{header}` in proxied nginx location starting with: {snippet!r}"



def test_proxied_locations_readd_single_source_of_truth_security_headers():
    config = _read_nginx_conf()

    expected_add_headers = [
        'add_header X-Frame-Options DENY always;',
        'add_header X-Content-Type-Options nosniff always;',
        'add_header Referrer-Policy strict-origin-when-cross-origin always;',
        'add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;',
        'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    ]

    for snippet in PROXIED_LOCATION_SNIPPETS:
        block = config.split(snippet, 1)[1].split("\n    }", 1)[0]
        for header in expected_add_headers:
            assert header in block, f"missing `{header}` in proxied nginx location starting with: {snippet!r}"
