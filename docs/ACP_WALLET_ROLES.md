# ACP wallet roles and tokenomics (operator reference)

Last updated: 2026-07-13.

## Official tokenomics (210M ACP, protocol)

| Bucket | Share | ACP | On-chain form |
|---|---:|---:|---|
| Creator vesting | 33% | 69,300,000 | Vesting contract / dedicated wallet |
| Validator emission reserve | 50% | 105,000,000 | Protocol accounting (not a spendable UTXO) |
| Public & liquidity | 12% | 25,200,000 | Treasury / LP wallets |
| Ecosystem grants | 5% | 10,500,000 | Grants wallet |

Source: `ACP-crypto/acp-crypto/src/protocol_params.rs`, `docs/FINANCE_MODEL.md`.

Annual validator payout: **10.5M ACP/year** from the 105M reserve (not new mint).

## Production operator wallets (must stay separate)

| Role | Address | Keystore | Never use for |
|---|---|---|---|
| **Bridge reserve** | `acp1qrz3ksr8gpv4ah208t5qvzxx0f4vc7a7ws7uqluz` | `Sicret/bridge-bsc/acp-reserve-keystore.json` | Custodial sweep, genesis dumps |
| **Custodial hot** | `acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9` | `Sicret/custodial-hot.keystore.json` (required; not on server today) | wACP backing |
| **Genesis treasury** | `acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl` | `Sicret/genesis-v2/genesis-treasury.keystore.json` | Bridge reserve |
| **Project treasury** | `acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902` | `Sicret/project-treasury-keystore.json` | Bridge reserve |
| **Bridge release hot** | `acp1qq805ke8uggeszjcnyeru8wcjded7qt7g5sescpc` | `Sicret/bridge-bsc/acp-release-hot-mnemonic.txt` | wACP backing |

### Env naming bug (fixed intent)

On production, `ACP_HOT_*` in `docker-compose.prod.yml` points at **bridge reserve** signer material
for reverse-rail payouts. That is correct for bridge orchestrator, but must **not** be confused with
**custodial hot** `acp1qzfdkq...`.

Recommended env split:

- `ACP_BRIDGE_RESERVE_KEYSTORE_FILE` — bridge reserve (`acp1qrz3...`)
- `ACP_CUSTODIAL_HOT_KEYSTORE_FILE` — custodial hot (`acp1qzfdkq...`)
- `ACP_RELEASE_HOT_MNEMONIC_FILE` — BSC→ACP release wallet

## What broke (2026-07-13 sweep)

1. **Bridge reserve emptied** while **800,001 wACP** remains on BSC → `reserve_health: critical`.
2. **~210M ACP** moved to custodial hot, but **custodial hot keystore is missing** on the server → funds are not spendable.
3. **Genesis v2** did not persist custodial hot keystore; mnemonic in `activity-wallets-seeds.txt` derives a **different** PQC address.
4. **Regenesis v2** used a simplified layout (genesis treasury ~207M) instead of the official 33/50/12/5 wallet split.

## Invariants (enforce in scripts and CI)

```
bridge_reserve_acp >= wacp_total_supply_acp   # backing ratio >= 1
```

Before any transfer **from** bridge reserve:

```bash
curl -s -H 'User-Agent: ancap-backend/1.0' https://ancap.cloud/api/v1/bridge/wacp/reserve-proof
```

Never run `scripts/sweep-acp-to-hot.sh` against bridge reserve when `backing_ratio < 1` would result.

## Recovery plan

### Immediate (bridge)

1. Locate **custodial hot keystore** (`KeystoreV3` for `acp1qzfdkq...`).
2. Upload to server: `/run/secrets/custodial-hot.keystore.json`
3. Run: `bash scripts/restore-bridge-reserve.sh 800999.999999`
4. Verify `GET /api/v1/bridge/wacp/reserve-proof` → `backing_ratio >= 1`, `reserve_health: healthy`
5. Optionally `BRIDGE_RAIL_PAUSED=true` until step 4 passes.

### Medium term (tokenomics alignment)

Regenesis **v3** should allocate genesis outputs to official buckets using keystores under `Desktop/ACP/wallets/`:

| Bucket | Keystore |
|---|---|
| Creator | `creator.keystore.json` → `acp1qrfw3d50jd4864vxhatuknhw65jwv463ccr6flsl` |
| Validator reserve marker | `validator-reserve.keystore.json` |
| Public & liquidity | `public-liquidity.keystore.json` |
| Ecosystem | **Keystore lost** for `acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5` (PQC KeystoreV3 never saved in genesis batch). Mnemonic in `genesis-wallets.txt` does not derive this address. On 2026-07-13 the 10.5M bucket was moved to custodial hot via chain rewind + treasury transfer (`scripts/recover-ecosystem-to-hot-rewind.py`). Do **not** use `ecosystem.keystore.json` / `ecosystem-canonical.keystore.json` — wrong address `acp1qqr09ngk...`. |
| Bridge reserve | `bridge-reserve.keystore.json` |
| Operator float | custodial hot keystore (generated + saved at genesis time) |

`build_and_submit_genesis_v2.rs` should **require** `ACP_HOT_KEYSTORE_FILE` and verify address match before submit.

### Redistribution after hot keystore recovery

| Destination | Amount (ACP) | Purpose |
|---|---:|---|
| Bridge reserve | 801,000 | wACP backing |
| Project treasury | 1,000,000 | Miner rewards target |
| Genesis treasury | ~207,643,981 | Operator pool per genesis v2 |
| Bridge reserve (genesis slot) | 301,000 | Only if not already covered by 801k line |

Exact amounts: read live balances + `reserve-proof` before moving.
