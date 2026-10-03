# ACP Explorer (Blockchair-style)

Public read surface for the ACP lean chain on `ancap.cloud`.

## UI

| Route | Purpose |
|---|---|
| `/explorer` | Universal search, tip stats, latest blocks / tip txs |
| `/explorer/block/[id]` | Block by height or hash |
| `/explorer/tx/[txid]` | Structured I/O (default full; optional redacted) |
| `/explorer/address/[addr]` | Balance, UTXOs, indexed history |
| `/explorer/mempool` | Mempool + fee estimate |
| `/explorer/stats` | UTXO set, tokenomics, free-distribution, index watermark |
| `/docs/acp/explorer` | Operator/docs page |

`/acp/tx/[txid]` permanently redirects to `/explorer/tx/[txid]`. Default config `ACP_EXPLORER_TX_BASE=https://ancap.cloud/explorer/tx`.

## API (`/api/v1/acp/explorer`)

- `GET /status`, `/efficiency`
- `GET /search?q=`
- `GET /blocks?limit=&before_height=`
- `GET /block/{id}`
- `GET /tx/{txid}?view=full|redacted`
- `GET /address/{addr}?history_limit=&history_offset=`
- `GET /mempool`, `/stats`
- `GET /tokenomics/snapshot`, `/supply-layout`

Node JSON-RPC is **not** exposed to browsers. Backend uses `acp_rpc_call`.

## Indexer

Tables (migration `086_acp_explorer_index`):

- `acp_explorer_indexer_state`
- `acp_explorer_blocks`
- `acp_explorer_txs`
- `acp_explorer_address_events`

Advanced on `POST /v1/system/jobs/tick` via `acp_explorer_index_tick` (chunked backfill).
