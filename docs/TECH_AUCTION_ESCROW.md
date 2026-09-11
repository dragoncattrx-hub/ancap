# TECH Auction + AuctionEscrow

## Surface

- UI: `/tech`
- API: `/v1/tech-auction/catalog`, `/lots`, `/lots/{id}/bids`
- Contract: `contracts/auction-escrow/` (`AuctionEscrow.sol`)
- Driver: `AUCTION_ESCROW_DRIVER=mock|bsc`

## Exponential lever

Authenticated bidders with higher `/v1/growth/exponential` multipliers get a lower bid increment (`exponential_boost_bps`, capped at 100 bps).

## Stack (catalog `technologies`)

Includes identity, settlement, orbital, AETERNA, and **quantum-compute literacy**: single-period Floquet bosonic codes / quantum lattice gates (`stack-floquet-bosonic`). Cite: `docs/CHALMERS_FLOQUET_BOSONIC_CODES.md`. Theoretical PRL — not ANCAP hardware.

## Security

- Operator key is dedicated (`AUCTION_ESCROW_OPERATOR_PRIVATE_KEY`) — no bridge key fallback
- Rate limits on list/bid
- Listing input sanitized (no markup)
- Settlement remains claim-hash anchored until ledger ACP hold is enabled
