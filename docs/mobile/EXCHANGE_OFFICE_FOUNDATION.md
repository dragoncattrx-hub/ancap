# Exchange Office Foundation (iPhone / mobile)

ACP-hub multi-asset exchange desk for the ACP Wallet on iPhone (Expo).

## Model

**ACP is the accounting hub.** Every supported asset quotes:

1. **Into ACP** — sell asset → ACP (`usdt_trc20`, metals, goods, wACP redeem, fiat planned)
2. **From ACP** — ACP → asset (`wacp_bsc` mint, USDT indicative, fiat planned)
3. **Cross (all ↔ all)** — `FROM → ACP → TO` as a two-leg ticket (`rail=hub_cross`)

Settlement still uses existing rails; this layer unifies catalog, quotes, and tickets for the phone UX.

## Rails

| Rail | Assets | Status |
|------|--------|--------|
| `ledger` | ACP | live |
| `swap_desk` | USDT TRC-20 → ACP | live (manual desk) |
| `otc_metal` | Au/Ag/Pt/Pd → ACP | live (supervised) |
| `otc_goods` | physical goods → ACP | live (RFQ) |
| `otc_commodity` | oil, gas, uranium, timber, sand, stone, ore… → ACP | live (indicative unit rates) |
| GC/XRF assay proto | metal & gas purity peaks → indicative ACP | `/assay/gc/*` educational prototype |
| Title / intangibles | real estate, antiques, space, patents, recipes → ACP; ownership certificates | see `docs/mobile/TITLE_OWNERSHIP_RAILS.md` |
| `bridge` | ACP ↔ wACP BSC | live/beta by bridge flags |
| `dex_deep_link` | USDT BSC via Pancake / smart-pay | beta |
| `fiat_onramp` | USD/EUR | planned placeholders |
| `hub_cross` | any listed cross pair | synthetic quote |

## API (`/v1`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/mobile/exchange/catalog` | public |
| POST | `/mobile/exchange/quote` | public |
| GET | `/mobile/exchange/quotes/{quote_id}` | public (TTL cache) |
| POST | `/mobile/exchange/tickets` | user |
| GET | `/mobile/exchange/tickets` | user |
| GET | `/mobile/exchange/tickets/{id}` | user |
| POST | `/mobile/exchange/tickets/{id}/cancel` | user |

Creating an OTC metal/goods ticket also opens an `acp_otc_intake_orders` row and links `rail_ref_*`.

## Config

- `EXCHANGE_OFFICE_ENABLED` (default true)
- `EXCHANGE_QUOTE_TTL_SECONDS` (default 120)
- `EXCHANGE_ACP_TO_USDT_RATE` (optional; else `1/USDT_TRC20_TO_ACP_RATE`)
- `EXCHANGE_FIAT_ACP_RATES` (placeholder map)
- existing: `USDT_TRC20_TO_ACP_RATE`, `OTC_METAL_ACP_PER_GRAM`, bridge flags

## Mobile (Expo)

- Tab **Exchange** (`app/(tabs)/exchange.tsx`) — catalog chips, amount, purity/goods estimate, quote
- Client: `@ancap/acp-api-client` `getExchangeCatalog` / `quoteExchange` / ticket methods
- Ticket open + auth session wiring is the next slice (ANCAP login on device)

## Out of this foundation

- Automated Tron deposit watcher / ACP payout hot-wallet
- Live metal market feed / DEX router signing
- Operator UI for ticket → rail completion
- Fiat partner on-ramp execute
- Full in-app bridge intent create from Exchange tab

## Files

- `app/schemas/exchange_office.py`
- `app/services/exchange_office.py`
- `app/api/routers/exchange_office.py`
- `app/db/models.py` → `AcpExchangeTicket`
- `alembic/versions/062_exchange_office.py`
- `ancap-mobile/apps/acp-wallet-expo/app/(tabs)/exchange.tsx`
