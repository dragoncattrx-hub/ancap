# Title rails + ACP ownership certificates

## OTC / Exchange

| Rail / asset | Purpose |
|--------------|---------|
| `goods` + category `antiques` | Antiques → ACP RFQ |
| `real_estate` (`sale` / `rental`) | Real estate sale or lease package → ACP |
| `space` | Space-object / orbital / payload title → ACP |
| `ip` (`patent` / `recipe`) | Patent inventions and hashed recipes/formulas → ACP |

Exchange catalog chips: `goods_antiques`, `real_estate_sale`, `real_estate_rental`, `space_*`, `ip_patent`, `ip_recipe` with rails `otc_goods` / `otc_real_estate` / `otc_space` / `otc_ip`.

### API

| Method | Path |
|--------|------|
| GET | `/wallet/acp/otc/catalog` |
| POST | `/wallet/acp/otc/quote/real-estate` |
| POST | `/wallet/acp/otc/quote/space` |
| POST | `/wallet/acp/otc/quote/ip` |
| POST | `/wallet/acp/otc/orders` (`rail=real_estate` \| `space` \| `ip` \| `goods` with `antiques`) |
| GET | `/v1/mobile/exchange/catalog` |

## ACP ownership certificates (intangibles)

Crypto-style **register contracts** proving ownership of intangible / title-linked assets via `document_hash` + metadata. Optional one-time transfer code for peer handoff of the title pointer.

Asset classes include: real estate title/lease, antique provenance, space object title, generic IP, **patent invention**, **recipe/formula**, license, digital collectible, domain, brand, other intangible.

Post-settlement mapping from OTC `ip` rail:

| OTC `ip_kind` | Ownership class |
|---------------|-----------------|
| `patent` | `patent_invention` |
| `recipe` | `recipe_formula` |

Recipes stay confidential: only the hash + metadata enter the register (not the recipe text).

### API

| Method | Path | Auth |
|--------|------|------|
| GET | `/v1/ownership-proofs/catalog` | public |
| POST | `/v1/ownership-proofs/certificates` | user |
| GET | `/v1/ownership-proofs/certificates` | user |
| GET | `/v1/ownership-proofs/certificates/{id}` | user |
| POST | `/v1/ownership-proofs/transfers/redeem` | user |
| POST | `/v1/ownership-proofs/certificates/{id}/revoke` | user |

Migration: `063_title_ownership` (widens OTC `rail` to 32 chars + `acp_ownership_certificates`).

**Disclaimer:** certificates are ANCAP register proofs — not a substitute for sovereign land, ITU/space, or IP registries.
