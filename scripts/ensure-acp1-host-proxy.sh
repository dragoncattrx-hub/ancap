#!/usr/bin/env bash
# Ensure public https://acp1.ancap.cloud/rpc reaches compose nginx (:8080).
#
# Root cause history:
# - Cloudflare Full SSL hits Hestia on 185.x:443 (not *:443 / not loopback).
# - Hestia had `location = /rpc { proxy_pass http://IP:18080/... }` (dead port) → HTML 404.
# - A catch-all `listen 80` drop-in never binds beside Hestia's IP-specific listeners.
#
# Strategy: rewrite Hestia domain vhosts in place (exact /rpc + /healthz + / → :8080).
# Idempotent — safe on every deploy. Do NOT call v-rebuild-web-domains after patching.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="acp1.ancap.cloud"
MARKER="ANCAP_ACP1_HOST_PROXY"
PUB_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [[ -z "${PUB_IP}" ]]; then
  PUB_IP="127.0.0.1"
fi

if [[ "$(id -u)" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    sudo bash "$0" "$@"
    exit $?
  fi
  echo "need root to patch host nginx for ${DOMAIN}" >&2
  exit 1
fi

patch_vhosts() {
  python3 - <<'PY'
from pathlib import Path
import re

files = []
for p in [
    Path("/etc/nginx/conf.d/domains/acp1.ancap.cloud.conf"),
    Path("/etc/nginx/conf.d/domains/acp1.ancap.cloud.ssl.conf"),
    Path("/home/admin/conf/web/acp1.ancap.cloud/nginx.conf"),
    Path("/home/admin/conf/web/acp1.ancap.cloud/nginx.ssl.conf"),
]:
    if p.exists():
        files.append(p)

if not files:
    raise SystemExit("no Hestia/domain acp1 nginx confs found")

block = """
    # ANCAP_ACP1_HOST_PROXY: /rpc + /healthz → compose nginx :8080
    location = /rpc {
        proxy_pass http://127.0.0.1:8080/rpc;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }
    location = /rpc/ {
        return 308 /rpc;
    }
    location = /healthz {
        proxy_pass http://127.0.0.1:8080/healthz;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
"""

for path in files:
    text = path.read_text(encoding="utf-8")
    # Backup once.
    bak = path.with_suffix(path.suffix + ".bak-ancap")
    if not bak.exists():
        bak.write_text(text, encoding="utf-8")

    # Strip prior ANCAP location clusters and any exact /rpc|/healthz|location /.
    while "ANCAP_ACP1_HOST_PROXY" in text:
        nxt = re.sub(
            r"\n[ \t]*#[^\n]*ANCAP_ACP1_HOST_PROXY[^\n]*(?:\n[ \t]*location[^\n]*\{[^{}]*\})+",
            "\n",
            text,
            count=1,
            flags=re.S,
        )
        if nxt == text:
            # Orphan marker comments
            text = text.replace("ANCAP_ACP1_HOST_PROXY", "ANCAP_ACP1_HOST_PROXY_OLD")
            break
        text = nxt

    text = re.sub(r"\n[ \t]*location\s*=\s*/rpc\s*\{[^{}]*\}", "", text, flags=re.S)
    text = re.sub(r"\n[ \t]*location\s*=\s*/rpc/\s*\{[^{}]*\}", "", text, flags=re.S)
    text = re.sub(r"\n[ \t]*location\s*=\s*/healthz\s*\{[^{}]*\}", "", text, flags=re.S)
    # Remove generic location / (docroot or stale proxy). Keep ACME ^~ and regex denies.
    text = re.sub(r"\n[ \t]*location\s*/\s*\{[^{}]*\}", "", text, flags=re.S)
    # Kill legacy dead upstream if still present elsewhere.
    text = re.sub(
        r"proxy_pass\s+http://[\d.]+:18080[^;]*;",
        "proxy_pass http://127.0.0.1:8080/rpc;",
        text,
    )

    text = re.sub(r"\}\s*$", block + "\n}\n", text, count=1)
    path.write_text(text, encoding="utf-8")
    print(f"patched {path}")
PY
}

remove_conflicting_dropin() {
  # Catch-all *:80/:443 drop-ins cannot bind beside Hestia IP listeners and
  # only produce conflicting server_name warnings. Prefer in-place domain patches.
  local drop
  for drop in \
    /etc/nginx/conf.d/acp1-ancap-cloud-compose-proxy.conf \
    /etc/nginx/conf.d/zz-acp1-ancap-cloud.conf
  do
    if [[ -f "$drop" ]]; then
      mv -f "$drop" "${drop}.disabled-ancap" 2>/dev/null || rm -f "$drop"
      echo "disabled conflicting drop-in $drop"
    fi
  done
}

reload_nginx() {
  nginx -t
  if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
    systemctl reload nginx
  else
    nginx -s reload || true
  fi
  echo "nginx reloaded"
}

if [[ ! -d /etc/nginx/conf.d ]]; then
  echo "No /etc/nginx/conf.d — skipping (not the VPS host?)"
  exit 0
fi

remove_conflicting_dropin
patch_vhosts
reload_nginx

echo "== smoke (compose + host public IP ${PUB_IP})"
printf '%s' '{"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}' > /tmp/acp1_rpc.json

code="$(curl -sS -m 10 -o /tmp/acp1_local_rpc.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -H "Host: ${DOMAIN}" \
  --data-binary @/tmp/acp1_rpc.json \
  http://127.0.0.1:8080/rpc || true)"
echo "compose :8080: HTTP ${code} body=$(head -c 120 /tmp/acp1_local_rpc.json 2>/dev/null || true)"

code80="$(curl -sS -m 10 -o /tmp/acp1_host_rpc.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -H "Host: ${DOMAIN}" \
  --data-binary @/tmp/acp1_rpc.json \
  "http://${PUB_IP}/rpc" || true)"
echo "host :80 @ ${PUB_IP}: HTTP ${code80} body=$(head -c 120 /tmp/acp1_host_rpc.json 2>/dev/null || true)"

code443="$(curl -skS -m 10 -o /tmp/acp1_host_ssl_rpc.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -H "Host: ${DOMAIN}" \
  --data-binary @/tmp/acp1_rpc.json \
  "https://${PUB_IP}/rpc" || true)"
echo "host :443 @ ${PUB_IP}: HTTP ${code443} body=$(head -c 120 /tmp/acp1_host_ssl_rpc.json 2>/dev/null || true)"

if [[ "$code" != "200" ]]; then
  echo "WARN: compose proxy did not answer getblockcount on :8080" >&2
fi
if [[ "$code80" != "200" && "$code443" != "200" ]]; then
  echo "host nginx did not answer getblockcount on :80/:443 for ${DOMAIN}" >&2
  ss -lntp 2>/dev/null | grep -E ':80 |:443 ' || true
  exit 1
fi
