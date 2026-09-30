# Oracle Cloud Free Tier — ACP node plan

**Status:** `[~]` Operator account registered; VM / ARM64 image / peer join still open.  
**Goal:** Run a public-facing **Always Free** ACP full/validator-class node on Oracle Cloud Ampere A1 so the network has a second home besides the primary `ancap.cloud` stack, and so contributors can see the exact action plan on GitHub.

This document is the **public plan of action**. It does **not** contain OCI tenancy IDs, SSH keys, RPC tokens, or miner reward secrets.

---

## Why Oracle Cloud Free Tier

Oracle Cloud **Always Free** includes Ampere **A1** shapes with a per-tenancy budget of roughly:

| Resource | Always Free budget (typical) |
|----------|------------------------------|
| Compute | Up to **2 OCPU** + **12 GB RAM** (ARM64 / aarch64), split across VMs |
| Storage | Free block volume + object storage within free-tier caps |
| Network | Free egress / VCN within free-tier caps |

For a lean Rust `acp-node` (RocksDB + JSON-RPC + miner), that budget is enough for a dedicated Ubuntu ARM64 host.

```text
Oracle Cloud Always Free (Ampere A1)
        │
        ├── 2 OCPU (ARM64)
        ├── 12 GB RAM
        ├── Ubuntu 22.04/24.04 aarch64
        └── Free block volume
             │
             ▼
        Docker / systemd
             │
             ▼
        acp-node (linux/arm64)
             │
             ├── peer sync → primary peer (acp1.ancap.cloud /rpc)
             ├── public read RPC (rate-limited)
             └── optional miner / validator role
```

---

## Current truth

| Item | State |
|------|--------|
| Oracle Cloud registration | **[x] Done** (operator registered) |
| Ampere A1 VM created | **[x] Done** — region `eu-zurich-1`, instance OCID `ocid1.instance.oc1.eu-zurich-1.an5heljrk5swcsqcw3oxkmxyh4fhhct2sxdodjipljfiprqrtvj32loxj46a` ([OCI console](https://cloud.oracle.com/compute/instances/ocid1.instance.oc1.eu-zurich-1.an5heljrk5swcsqcw3oxkmxyh4fhhct2sxdodjipljfiprqrtvj32loxj46a?region=eu-zurich-1)) |
| Ubuntu ARM64 + Docker | `[~]` Pending SSH bootstrap (needs public IP + security-list SSH) |
| `linux/arm64` `acp-node` image / binary | `[~]` Build via [`scripts/deploy-oracle-acp-node.ps1`](../scripts/deploy-oracle-acp-node.ps1) |
| Chain data dir + snapshot / sync from tip | `[ ]` Open |
| Peer `peer_rpc_urls` → primary network | `[ ]` Open — primary peer `https://acp1.ancap.cloud/rpc` |
| Public hostname + TLS + rate limit | `[ ]` Open |
| Document live peer URL in public status | `[~]` This page; hostname TBD after bootstrap |

Primary production node today remains the Docker `acp-node` service behind `acp1.ancap.cloud` on the ANCAP host (`docker-compose.prod.yml`). Oracle is a **parallel / secondary** node track, not a cutover away from `ancap.cloud`.

### Operator bootstrap (after Public IP is known)

```powershell
.\scripts\deploy-oracle-acp-node.ps1 `
  -HostIp <PUBLIC_IP> `
  -KeyPath $env:USERPROFILE\Downloads\ssh-key-2026-09-30.key `
  -User ubuntu
```

Do **not** commit the private SSH key. Rotate the key if it was shared in chat.

---

## ARM64 requirement (critical)

Oracle Ampere A1 is **aarch64**. The node must run an ARM64 binary or `linux/arm64` container.

Repo fact:

- Build context: [`ACP-crypto/acp-node/Dockerfile`](../ACP-crypto/acp-node/Dockerfile)
- Image builds with stock `rust:*-bookworm` and `cargo build --release` — **no hard-coded `x86_64`**.
- On an Ampere host (or via `docker buildx --platform linux/arm64`), the result is a native ARM64 `acp-node`.

### Preferred build paths

**A. Build on the Oracle VM (simplest)**

```bash
git clone <this-repo> ancap && cd ancap/ACP-crypto
docker build -f acp-node/Dockerfile -t ancap/acp-node:arm64 .
```

**B. Cross-build from an x86_64 workstation (CI / laptop)**

```bash
cd ACP-crypto
docker buildx create --use --name acp-arm || docker buildx use acp-arm
docker buildx build --platform linux/arm64 -f acp-node/Dockerfile \
  -t ancap/acp-node:arm64 --load .
```

**C. Native cargo on Ubuntu aarch64**

```bash
sudo apt update && sudo apt install -y build-essential cmake clang \
  libclang-dev libsnappy-dev liblz4-dev libzstd-dev zlib1g-dev libbz2-dev
cd ACP-crypto/acp-node
cargo build --release
sudo install -m 755 target/release/acp-node /opt/acp/bin/acp-node
```

If a dependency later fails on aarch64, fix that crate / feature flag before marking this track done — do not ship an amd64 binary under qemu as the long-term production path.

---

## Phased action plan

### Phase O0 — Account & tenancy `[x]`

- [x] Register Oracle Cloud Free Tier
- [ ] Confirm Always Free Ampere A1 capacity is available in the chosen home region
- [ ] Enable MFA on the Oracle account
- [ ] Create a dedicated compartment (e.g. `ancap-acp`) — no secrets in GitHub

### Phase O1 — Ampere VM `[ ]`

Suggested shape (fits Free Tier when capacity allows):

- Shape: **VM.Standard.A1.Flex**
- OCPU / memory: start with **1–2 OCPU**, **6–12 GB** RAM (stay inside tenancy Always Free budget)
- Image: **Ubuntu 22.04 or 24.04 Minimal aarch64**
- Boot + block volume: enough for OS + growing RocksDB (plan ≥ 50–100 GB free-tier eligible volume if available)
- VCN security list / NSG:
  - SSH `22` from operator IP only
  - ACP P2P if used (`30333` or configured listen)
  - JSON-RPC `8545` only via reverse proxy / Cloudflare later — not wide-open without token + rate limit

### Phase O2 — Host baseline `[ ]`

On the VM:

```bash
sudo apt update && sudo apt upgrade -y
# Docker Engine (official Ubuntu aarch64 packages) + fail2ban + unattended-upgrades
```

- Create system user / data dir: `/var/lib/acp-node`
- Install config from [`acp-node.toml.example`](../ACP-crypto/acp-node/acp-node.toml.example)
- Set `ACP_RPC_TOKEN` (or toml `rpc.token`) for non-public RPC methods — **never commit the token**
- Point `peer_rpc_urls` at the primary public peer (today: `https://acp1.ancap.cloud/rpc` or the operator-approved peer list)

### Phase O3 — Run `acp-node` `[ ]`

Option 1 — Docker:

```bash
docker run -d --name acp-node --restart unless-stopped \
  -v /var/lib/acp-node:/var/lib/acp-node \
  -v /etc/acp/acp-node.toml:/etc/acp/acp-node.toml:ro \
  -e ACP_DATA_DIR=/var/lib/acp-node \
  -e ACP_RPC_TOKEN="(set on host, not in git)" \
  -p 127.0.0.1:8545:8545 \
  ancap/acp-node:arm64
```

Option 2 — systemd unit wrapping `/opt/acp/bin/acp-node`.

Health checks:

- Local: `curl -sS http://127.0.0.1:8545/rpc` JSON-RPC `getblockcount` / `getblockchaininfo` (method names as implemented by the node)
- Confirm height advances toward the primary peer tip
- Confirm ARM binary: `uname -m` → `aarch64`, and container `Architecture: arm64`

### Phase O4 — Public edge `[ ]`

- Put RPC behind nginx/Caddy + TLS (or Cloudflare Tunnel / DNS-only)
- Rate-limit `/rpc` (mirror spirit of [`infra/nginx/default.conf`](../infra/nginx/default.conf) `acp_rpc` zone)
- Publish a stable hostname (e.g. `acp2.ancap.cloud` or a dedicated oracle hostname) only after health is green
- Update public peer list once the node is caught up — without publishing admin tokens

### Phase O5 — Validator / miner posture `[ ]`

Distinguish carefully:

| Role | Meaning on ACP today |
|------|----------------------|
| Full node | Sync + serve RPC; required baseline |
| Miner / assembler | Optional `ACP_MINER_*` / config — only with a funded reward address the operator controls |
| Future PoS validator | Protocol path still maturing; do not claim BFT validator-set membership until implemented |

Oracle Free Tier is **first** a resilient full node + public read peer. Validator economics (reserve payouts, stake) stay documented in [`docs/ACP_WALLET_ROLES.md`](ACP_WALLET_ROLES.md) and must not mix Free Tier marketing with unearned consensus claims.

### Phase O6 — GitHub transparency `[~]`

- [x] This plan file in the monorepo
- [ ] Link from root README / crypto README (same PR)
- [ ] After go-live: short STATUS note with public peer URL + ARM64 evidence (no secrets)
- [ ] Optional: CI job `docker buildx --platform linux/arm64` smoke for `acp-node` (build-only, no deploy keys)

---

## Security & hygiene

- Never commit OCI API keys, SSH private keys, `ACP_RPC_TOKEN`, miner keystores, or tenancy OCID dump files.
- Prefer ephemeral deploy keys / instance principals over long-lived user keys where possible.
- Free Tier ≠ anonymous: still apply fail2ban, SSH key-only auth, unattended security updates.
- RocksDB data is valuable — schedule volume snapshots; document restore without publishing chain key material.

---

## Success criteria

1. `uname -m` / image arch = **aarch64 / arm64**
2. Node syncs to the same tip family as `acp1.ancap.cloud`
3. Authenticated / rate-limited public RPC reachable for peers and explorers
4. This doc’s Phase O0–O4 checkboxes updated to `[x]` with a dated STATUS blurb
5. No secrets in git history

---

## Related

- Node crate: [`ACP-crypto/acp-node/`](../ACP-crypto/acp-node/)
- Example config: [`ACP-crypto/acp-node/acp-node.toml.example`](../ACP-crypto/acp-node/acp-node.toml.example)
- Prod compose service: `acp-node` in [`docker-compose.prod.yml`](../docker-compose.prod.yml)
- Public RPC host pattern: `acp1.ancap.cloud` in [`infra/nginx/default.conf`](../infra/nginx/default.conf)
- Lean chain notes: [`docs/ACP_LEAN_CHAIN.md`](ACP_LEAN_CHAIN.md)
