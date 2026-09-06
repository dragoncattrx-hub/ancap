# ANCAP — AETERNA Longevity Marketplace Roadmap

> Status: foundation in progress | Added: 2026-09-07  
> Goal: **AETERNA** — ANCAP division for longevity / genomic wellness: ACP-paid analysis & partner-clinic workflows, DNA data vault (incl. Sequencing.com-style import), interactive genome sandbox.  
> Master priority **R12** · Related: Workflow Store, org identity, compliance matrix  
> Visual thesis: DNA + Cas9 awareness + blockchain settlement (see `/aeterna` hero)

## Product thesis

People pay ACP for **structured longevity workflows**: upload / link sequenced DNA, explore annotated variants in a sandbox, request AI briefs, and route **licensed clinical partners** for consult intents (pigmentation, telomere panels, disease-risk reports, longevity plans).

**Non-goals (v1):** consumer DIY CRISPR/Cas9 kits, wet-lab protocols, gene synthesis, pathogen work, unlicensed enhancement procedures.

**Goals (v1–v2):** DNA vault → consent → paid workflow catalog → partner match → ACP settlement → audit receipt.

## Compliance gates (must ship with MVP)

1. Explicit consent + genomic processing notice (region flags GDPR / health data).
2. Copy forbids medical diagnosis claims and DIY gene editing.
3. Intent categories are **consult / report / partner handoff**, not lab recipes.
4. Partner listings require jurisdiction + license_ref before `verified=true`.
5. Vault stores **content hash + metadata** first; raw genome blobs behind encrypted object store later.

## Sequencing.com bridge

- Users may paste / link Sequencing.com export URIs (`source=sequencing_com`).
- Later: OAuth / file-import adapter; v1 is URI + SHA-256 of local export.
- Docs: https://sequencing.com/

## Phased delivery

### Phase A0 — Spec & brand `[x]`

- Division name **AETERNA**, schemas in `app/schemas/aeterna.py`.
- Landing `/aeterna` with DNA/Cas9/blockchain visual.
- Workflow Store templates under category **AETERNA**.

### Phase A1 — Vault + intent API `[~]`

- Tables: `aeterna_dna_vault`, `aeterna_intent_orders`, `aeterna_partners`.
- Feature flag `FF_AETERNA`.
- APIs: status, vault CRUD metadata, intent orders, partner registry.

### Phase A2 — Checkout UX `[ ]`

- Filter `/ai/workflows?category=AETERNA`.
- Org desk + personal vault UI.
- Bundle: `aeterna-longevity-pack`.

### Phase A3 — Sandbox viz `[ ]`

- Variant browser / trait playground on vaulted VCF summaries (read-only annotation).
- No edit simulation that implies real editing capability.

### Phase A4 — Partner network `[ ]`

- Verified clinics, escrow ACP until consult delivered.
- Mobile consent + PIN/biometrics step-up for vault unlock.

### Phase A5 — Economy `[ ]`

- Creator-listed genomic workflows under Vertical `AETERNA`.
- Insurance / employer longevity benefits rails (optional).

## API surface (MVP)

```
GET  /aeterna/status
POST /aeterna/vault
GET  /aeterna/vault
POST /aeterna/intents
GET  /aeterna/intents
GET  /organizations/{org_id}/aeterna/summary
POST /organizations/{org_id}/aeterna/partners
GET  /organizations/{org_id}/aeterna/partners
```

## Workflow slugs (catalog)

- `aeterna-dna-wellness-report`
- `aeterna-longevity-panel-brief`
- `aeterna-pigmentation-consult-brief`
- `aeterna-telomere-panel-review`
- `aeterna-disease-risk-navigator`
