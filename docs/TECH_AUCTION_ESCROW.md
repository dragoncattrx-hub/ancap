# TECH Auction + AuctionEscrow

## Surface

- UI: `/tech`
- API: `/v1/tech-auction/catalog`, `/lots`, `/lots/{id}/bids`
- Contract: `contracts/auction-escrow/` (`AuctionEscrow.sol`)
- Driver: `AUCTION_ESCROW_DRIVER=mock|bsc`

## Exponential lever

Authenticated bidders with higher `/v1/growth/exponential` multipliers get a lower bid increment (`exponential_boost_bps`, capped at 100 bps).

## Security

- Operator key is dedicated (`AUCTION_ESCROW_OPERATOR_PRIVATE_KEY`) — no bridge key fallback
- Rate limits on list/bid
- Listing input sanitized (no markup)
- Settlement remains claim-hash anchored until ledger ACP hold is enabled
