# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "infra" / "nginx" / "default.conf"
t = p.read_text(encoding="utf-8")
marker = 'add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;'
if marker in t:
    print("already hardened")
    raise SystemExit(0)

old = (
    '        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;\n'
    '        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;'
)
new = (
    '        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;\n'
    '        add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;\n'
    '        add_header Cross-Origin-Resource-Policy "same-site" always;\n'
    '        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;'
)
n = t.count(old)
if n < 1:
    raise SystemExit(f"header block not found; sample around Permissions-Policy missing")
p.write_text(t.replace(old, new), encoding="utf-8")
print(f"patched {n} locations")
