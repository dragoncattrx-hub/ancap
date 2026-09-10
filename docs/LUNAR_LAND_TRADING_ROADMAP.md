# ANCAP — Lunar Land Trading Roadmap (R13)

> Status: foundation in progress | Added: 2026-09-10  
> Goal: ACP-settled **lunar parcel registry + interest desk** enriched by open science signals (NASA–IBM Lunar Foundation Model themes: ice, volcanism, crater morphology).  
> Master priority **R13** · Related: Galaxy title auction (`/galaxy`), OTC `moon` class, R11 orbital edge (compute — not parcels)  
> Public surface: `/lunar`

## Product thesis

Buyers express **interest / reserve / bid** on selenographic parcels in an ANCAP register. Parcels are catalogued with grid refs and science tags inspired by multi-instrument lunar observation models (see [NASA–IBM Lunar Foundation Model](https://lnkd.in/p/e-SbXYMZ) — ice deposits, volcanic history, crater detection). Settlement is in **ACP**. Proofs are **platform registry certificates**, not sovereign deeds.

**Non-goals (v1):** claiming Outer Space Treaty–compliant national ownership; selling “real” lunar real estate as enforceable land title; hosting proprietary NASA/IBM model weights; LFM inference on the API host.

**Goals (v1–v2):** static science-tagged catalog → authenticated interests → optional ownership-proof handoff → later LFM adapter for enrichment metadata.

## Compliance / risk gates

1. Clear disclaimer: ANCAP lunar parcels are **speculative registry claims**, not recognized property under the Outer Space Treaty of 1967.
2. Science tags are **indicative** (catalog / future LFM adapter), not geological guarantees.
3. Distinct from Galaxy whole-body `sat-luna` lots and OTC class `moon`.
4. Distinct from R11 SpaceX sealed-edge compute nodes.

## Phased delivery

### Phase L0 — Spec & brand `[x]`

- Division name **Lunar Land**, schemas in `app/schemas/lunar_land.py`.
- Landing `/lunar` with reserve CTA + science tag legend.
- Roadmap hooks in MASTER / PRODUCTION / CLAUDE.

### Phase L1 — Catalog + interest API `[x]`

- Tables: `lunar_parcels`, `lunar_interest_orders`.
- Feature flag `FF_LUNAR_LAND` (default on for public browse).
- APIs: status, list/get parcels, create/list interests (auth).
- Seed catalog of polar / mare / crater demo parcels with LFM-theme tags.

### Phase L2 — Checkout UX `[ ]`

- Interest → ACP escrow hold.
- Link settled parcels into ownership-proof rail (`rail=space` / class `lunar_parcel`).
- Galaxy Luna lot CTA → `/lunar`.

### Phase L3 — LFM enrichment adapter `[ ]`

- Optional off-host adapter that attaches NASA–IBM open-model **metadata tiles** (ice likelihood, volcanic class, crater density) to parcel `metadata_json`.
- Never store model weights on the ANCAP API disk.

### Phase L4 — Secondary market `[ ]`

- Transfer interests / settled claims between users with audit receipt.

## API surface (MVP)

```
GET  /lunar/status
GET  /lunar/parcels
GET  /lunar/parcels/{id}
POST /lunar/interests
GET  /lunar/interests
```

## References

- IBM Research / NASA Lunar Foundation Model announcement: https://lnkd.in/p/e-SbXYMZ
- Does **not** block Phase 6 mobile MVP or R9–R12.
