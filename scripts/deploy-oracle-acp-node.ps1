# Deploy acp-node to an Oracle Cloud Ampere (ARM64) VM over SSH.
# NEVER commit the private key. Pass paths as parameters.
#
# Example:
#   .\scripts\deploy-oracle-acp-node.ps1 `
#     -HostIp 1.2.3.4 `
#     -KeyPath "$env:USERPROFILE\Downloads\ssh-key-2026-09-30.key" `
#     -User ubuntu
#
# Prerequisites on the VM: Ubuntu aarch64, outbound HTTPS, ports 22 open to you.
# Opens 8545 only on localhost; put Cloudflare Tunnel / nginx in front later.

param(
  [Parameter(Mandatory = $true)][string]$HostIp,
  [Parameter(Mandatory = $true)][string]$KeyPath,
  [string]$User = "ubuntu",
  [string]$PeerRpc = "https://acp1.ancap.cloud/rpc",
  [string]$RepoUrl = "https://github.com/dragoncattrx-hub/ancap.git"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $KeyPath)) {
  throw "SSH key not found: $KeyPath"
}

# OpenSSH on Windows rejects keys that are too open.
icacls $KeyPath /inheritance:r | Out-Null
icacls $KeyPath /grant:r "$env:USERNAME:(R)" | Out-Null

$ssh = @(
  "-i", $KeyPath,
  "-o", "StrictHostKeyChecking=accept-new",
  "-o", "IdentitiesOnly=yes",
  "${User}@${HostIp}"
)

Write-Host "==> Probe SSH ${User}@${HostIp}"
& ssh @ssh "uname -m && free -h | head -n 2"

$remote = @"
set -euo pipefail
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends ca-certificates curl git docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker "$User" || true
mkdir -p "\$HOME/ancap-src" /tmp/acp-node-build
if [ ! -d "\$HOME/ancap-src/.git" ]; then
  git clone --depth 1 "$RepoUrl" "\$HOME/ancap-src"
else
  git -C "\$HOME/ancap-src" fetch --depth 1 origin master
  git -C "\$HOME/ancap-src" reset --hard origin/master
fi
cd "\$HOME/ancap-src/ACP-crypto"
sudo docker build -f acp-node/Dockerfile -t ancap/acp-node:arm64 .
sudo mkdir -p /var/lib/acp-node /etc/acp
if [ ! -f /etc/acp/acp-node.toml ]; then
  sudo tee /etc/acp/acp-node.toml >/dev/null <<'TOML'
role = "full"

[p2p]
listen = "0.0.0.0:30333"
max_peers = 50

[rpc]
listen = "0.0.0.0:8545"

[metrics]
listen = "127.0.0.1:9101"

[storage]
data_dir = "/var/lib/acp-node"
pruning = true
db_cache_mb = 512

peer_rpc_urls = ["$PeerRpc"]
TOML
fi
sudo docker rm -f acp-node 2>/dev/null || true
sudo docker run -d --name acp-node --restart unless-stopped \
  -v /var/lib/acp-node:/var/lib/acp-node \
  -v /etc/acp/acp-node.toml:/etc/acp/acp-node.toml:ro \
  -e ACP_DATA_DIR=/var/lib/acp-node \
  -e ACP_RPC_LISTEN=0.0.0.0:8545 \
  -p 127.0.0.1:8545:8545 \
  -p 30333:30333 \
  ancap/acp-node:arm64
sleep 3
sudo docker ps --filter name=acp-node
curl -sS -X POST http://127.0.0.1:8545/rpc \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}' || true
echo
uname -m
"@

Write-Host "==> Remote bootstrap (Docker ARM64 acp-node)"
$remote | & ssh @ssh "bash -s"

Write-Host "Done. Bind public RPC via tunnel/nginx; do not expose 8545 without rate limits + token."
Write-Host "Update docs/ORACLE_CLOUD_ACP_NODE_PLAN.md with the public peer URL once TLS is live."
