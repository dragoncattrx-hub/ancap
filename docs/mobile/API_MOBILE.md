# Mobile API — Contract

Base URL: production `https://api.ancap.cloud` (or your deployment).
All paths are also mounted under `/v1` prefix (e.g. `/v1/mobile/config`).

Implementation: `app/api/routers/mobile_acp.py`

## `GET /mobile/config`

App bootstrap: versions, maintenance, chain parameters, docs URLs.

```json
{
  "minAppVersion": "1.0.0",
  "maintenance": false,
  "maintenanceMessage": null,
  "acpDecimals": 8,
  "wacpDecimals": 18,
  "acpRpcStatus": "ok",
  "bridgeStatus": "ok",
  "bridgeEnabled": false,
  "bridgePaused": false,
  "bridgeReverseEnabled": false,
  "wacpContract": "0x...",
  "bscChainId": 56,
  "acpRpcUrl": "https://acp1.ancap.cloud/rpc",
  "acpExplorerTxBase": "https://ancap.cloud/acp/tx",
  "bscExplorerBase": "https://bscscan.com",
  "supportUrl": "https://ancap.cloud/support",
  "docs": {
    "bridge": "https://ancap.cloud/docs/wacp/bridge",
    "risks": "https://ancap.cloud/docs/wacp/risks",
    "reserve": "https://ancap.cloud/docs/wacp/reserve",
    "contracts": "https://ancap.cloud/docs/wacp/contracts",
    "walletSecurity": "https://ancap.cloud/docs/mobile/security"
  }
}
```

## `GET /acp/network/status`

```json
{
  "chain": "acp",
  "rpcStatus": "ok",
  "blockHeight": 12345,
  "minFeeAcp": "0.00000100"
}
```

## `GET /acp/address/{address}/balance`

Public read. No auth. Returns chain balance (no custodial `in_work` fields).

```json
{
  "address": "acp1...",
  "units": "100000000",
  "acp": "1",
  "utxo_count": 3
}
```

## `GET /acp/address/{address}/transactions`

Query: `limit` (1–500, default 50).

Array of `AcpTransactionPublic` (same shape as web wallet).

## `GET /acp/transactions/{txid}`

Public transaction detail.

## `POST /acp/tx/estimate-fee`

```json
{ "from": "acp1...", "to": "acp1...", "amountAcp": "1.0" }
```

```json
{
  "feeAcp": "0.00000100",
  "feeUnits": "100",
  "minFeeAcp": "0.00000100"
}
```

## `POST /acp/tx/broadcast`

Relay **already signed** raw transaction (non-custodial). Server never sees mnemonic.

```json
{ "rawTx": "<hex>" }
```

```json
{
  "accepted": true,
  "txid": "..."
}
```

## Bridge (existing)

Use `app/api/routers/bridge_rail.py`:

| Method | Path |
|--------|------|
| GET | `/bridge/status` |
| GET | `/bridge/wacp/status` |
| GET | `/bridge/wacp/reserve-proof` |
| POST | `/bridge/intents/acp-to-bsc` |
| POST | `/bridge/intents/bsc-to-acp` |
| GET | `/bridge/intents/me` (auth) |

Mobile should bind intents by `(acp_address, bsc_address)`; optional ANCAP login in v1.1.

## Auth

Mobile **read** endpoints: no auth.
Broadcast: rate-limited by IP (10 req/min, configurable via `MOBILE_BROADCAST_RATE_LIMIT_PER_MINUTE`).
Bridge intents with `require_auth`: optional link to ANCAP account later.
