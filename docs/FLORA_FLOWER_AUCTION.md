# FLORA flower auction

ACP escrow desk for selling **any flower in any form** (cut, bouquet, potted, seed, bulb, dried, arrangement, hybrid-architecture literacy, other) with quantity from **1 to unlimited (∞)**.

## Surfaces

| Surface | Path |
|--------|------|
| Frontend | `/flora` |
| Catalog | `GET /v1/flora-auction/catalog` |
| List lot | `POST /v1/flora-auction/lots` |
| Bid | `POST /v1/flora-auction/lots/{lot_id}/bids` |

## Featured ad

**Black Beauty** (`flower-black-beauty`) — rose × daisy CRISPR-themed **literacy** lot. Hero art: `/flora/black-beauty.jpg`.

Not a CE/FDA plant variety, not a live GMO release sold by ANCAP. Physical plants / seeds / cuttings stay with licensed growers and florists under phytosanitary and local trade law.

## Settlement

- Hashed `AuctionEscrow` claim (`vertical=flora`)
- Bid deals sealed with X-Wing PQC envelopes (`deal_cipher_*` on `flora_auction_bids`)
- Insurance asset ref: `flora_auction_lot` (`coverage_class=floriculture`)

## Migration

`078_flora_auction` — tables `flora_auction_lots`, `flora_auction_bids`.
