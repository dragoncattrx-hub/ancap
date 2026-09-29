#!/usr/bin/env bash
# Ensure public https://acp1.ancap.cloud reaches the compose nginx proxy (:8080).
# Cloudflare orange-clouds acp1 to the VPS (SSL mode full → origin :443).
# Hestia/default nginx must reverse-proxy that Host to Docker on both :80 and :443.
# Idempotent — safe to run on every deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/infra/nginx/host-acp1-proxy.conf"
DOMAIN="acp1.ancap.cloud"
MARKER="ANCAP_ACP1_HOST_PROXY"
SSL_DIR="/etc/nginx/ssl"
SSL_CERT="${SSL_DIR}/${DOMAIN}.crt"
SSL_KEY="${SSL_DIR}/${DOMAIN}.key"

if [[ ! -f "$SRC" ]]; then
  echo "missing $SRC" >&2
  exit 1
fi

install_conf() {
  local dest="$1"
  local dir
  dir="$(dirname "$dest")"
  mkdir -p "$dir"
  cp "$SRC" "$dest"
  # Ensure cert paths match what we generated (in case template drifts).
  if command -v sed >/dev/null 2>&1; then
    sed -i "s|ssl_certificate     .*|ssl_certificate     ${SSL_CERT};|" "$dest" || true
    sed -i "s|ssl_certificate_key .*|ssl_certificate_key ${SSL_KEY};|" "$dest" || true
  fi
  echo "installed host proxy -> $dest"
}

ensure_ssl_material() {
  mkdir -p "$SSL_DIR"
  # Prefer an existing Let's Encrypt / Hestia leaf that already covers acp1.
  shopt -s nullglob
  local le_certs=(/etc/letsencrypt/live/"${DOMAIN}"/fullchain.pem)
  local hestia_certs=(/home/*/conf/web/"${DOMAIN}"/ssl/"${DOMAIN}".pem)
  shopt -u nullglob

  if [[ -f "${le_certs[0]:-}" && -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" ]]; then
    SSL_CERT="${le_certs[0]}"
    SSL_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
    echo "using Let's Encrypt cert for ${DOMAIN}"
    return 0
  fi
  if [[ -f "${hestia_certs[0]:-}" ]]; then
    local hdir
    hdir="$(dirname "${hestia_certs[0]}")"
    if [[ -f "${hdir}/${DOMAIN}.key" ]]; then
      SSL_CERT="${hestia_certs[0]}"
      SSL_KEY="${hdir}/${DOMAIN}.key"
      echo "using Hestia cert for ${DOMAIN}"
      return 0
    fi
  fi

  if [[ -f "$SSL_CERT" && -f "$SSL_KEY" ]]; then
    echo "reusing existing self-signed cert at $SSL_CERT"
    return 0
  fi

  if ! command -v openssl >/dev/null 2>&1; then
    echo "openssl missing; cannot mint origin cert for ${DOMAIN}" >&2
    exit 1
  fi
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "$SSL_KEY" \
    -out "$SSL_CERT" \
    -subj "/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN}" 2>/dev/null \
    || openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
      -keyout "$SSL_KEY" \
      -out "$SSL_CERT" \
      -subj "/CN=${DOMAIN}"
  chmod 640 "$SSL_KEY" || true
  chmod 644 "$SSL_CERT" || true
  echo "minted Full-SSL origin cert -> $SSL_CERT"
}

reload_nginx() {
  if command -v nginx >/dev/null 2>&1; then
    nginx -t
    if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet nginx; then
      systemctl reload nginx
    else
      nginx -s reload || true
    fi
    echo "nginx reloaded"
  fi
}

patch_existing_acp1_vhosts() {
  # If Hestia/domains already claim server_name acp1, rewrite location / to compose
  # so we do not fight duplicate server_name precedence.
  local files=()
  shopt -s nullglob
  files+=(
    /etc/nginx/conf.d/domains/"${DOMAIN}".conf
    /etc/nginx/conf.d/domains/"${DOMAIN}".ssl.conf
    /home/*/conf/web/"${DOMAIN}"/nginx.conf
    /home/*/conf/web/"${DOMAIN}"/nginx.ssl.conf
  )
  shopt -u nullglob

  local conf
  for conf in "${files[@]}"; do
    [[ -f "$conf" ]] || continue
    if ! grep -q "server_name.*${DOMAIN}" "$conf" 2>/dev/null; then
      continue
    fi
    cp -a "$conf" "${conf}.bak-ancap" 2>/dev/null || true
    python3 - "$conf" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
marker = "ANCAP_ACP1_HOST_PROXY"
block = f"""
    # {marker}: forward to ANCAP compose nginx on :8080
    location / {{
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }}
"""
new, n = re.subn(
    r"location\s+/\s*\{[^{}]*\}",
    block.strip(),
    text,
    count=1,
    flags=re.S,
)
if n == 0:
    if marker in text:
        new = text
    else:
        new = re.sub(r"\}\s*$", block + "\n}\n", text, count=1)
path.write_text(new, encoding="utf-8")
print(f"patched {path}")
PY
  done
}

# Prefer a dedicated conf.d drop-in (works beside Hestia).
DEST=""
for candidate in \
  /etc/nginx/conf.d/acp1-ancap-cloud-compose-proxy.conf \
  /etc/nginx/conf.d/zz-acp1-ancap-cloud.conf
do
  if [[ -d "$(dirname "$candidate")" ]]; then
    DEST="$candidate"
    break
  fi
done

if [[ -z "$DEST" ]]; then
  echo "No /etc/nginx/conf.d — skipping host proxy install (not the tunnel/VPS host?)"
  exit 0
fi

# Need root to write system nginx; deploy user is often passwordless sudo.
if [[ "$(id -u)" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    sudo bash "$0" "$@"
    exit $?
  fi
  echo "need root to install $DEST" >&2
  exit 1
fi

ensure_ssl_material
install_conf "$DEST"
# Do NOT call v-rebuild-web-domains after patching — it overwrites SSL location / back to docroot.
patch_existing_acp1_vhosts
reload_nginx

echo "== local smoke (Host: ${DOMAIN})"
code="$(curl -sS -m 10 -o /tmp/acp1_local_rpc.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -H "Host: ${DOMAIN}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}' \
  http://127.0.0.1:8080/rpc || true)"
echo "compose direct: HTTP ${code} body=$(head -c 120 /tmp/acp1_local_rpc.json 2>/dev/null || true)"

code80="$(curl -sS -m 10 -o /tmp/acp1_host_rpc.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -H "Host: ${DOMAIN}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}' \
  http://127.0.0.1/rpc || true)"
echo "host :80: HTTP ${code80} body=$(head -c 120 /tmp/acp1_host_rpc.json 2>/dev/null || true)"

code443="$(curl -skS -m 10 -o /tmp/acp1_host_ssl_rpc.json -w '%{http_code}' \
  -H 'Content-Type: application/json' \
  -H "Host: ${DOMAIN}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}' \
  https://127.0.0.1/rpc || true)"
echo "host :443: HTTP ${code443} body=$(head -c 120 /tmp/acp1_host_ssl_rpc.json 2>/dev/null || true)"

if [[ "$code" != "200" ]]; then
  echo "WARN: compose proxy did not answer getblockcount on :8080 (check acp-node + docker nginx)" >&2
fi
if [[ "$code80" != "200" && "$code443" != "200" ]]; then
  echo "WARN: host nginx did not answer getblockcount on :80 or :443 for ${DOMAIN}" >&2
  exit 1
fi
