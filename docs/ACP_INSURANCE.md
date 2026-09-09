# ACP Insurance Desk

Universal parametric coverage settled in **ACP** (RFC `economy/insurance`).

## API

- `GET /v1/insurance/catalog`
- `POST /v1/insurance/quote`
- `POST /v1/insurance/policies`
- `GET /v1/insurance/policies`
- `GET /v1/insurance/policies/{id}`
- `GET /v1/insurance/pools/{id}`
- `POST /v1/insurance/policies/{id}/claims`

Coverage classes: wallet, bridge, cargo, real estate, commodities, health/travel, NFC, cyber, livestock, space, custom.

## UI

`/insurance` — quote + buy with ACP.

## Note

Prototype capital rail — not a licensed insurer. Premiums/claims denominated in ACP; contract hashes for desk settlement.
