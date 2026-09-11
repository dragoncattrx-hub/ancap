# Digital DNA / RNA Bank

> Status: MVP | encrypted off-chain vault | Phase R12 companion to AETERNA

## Overview

ANCAP **DNA/RNA Bank** is a separate product surface from AETERNA hash vault and Digital Passport education docs.

- UI: `/dna-bank`
- API: `/v1/dna-rna-bank/*`
- Stores **metadata / panel summaries only** — full genomes and large FASTQ/BAM are rejected by schema limits
- Encryption at rest: **AES-256-GCM + HKDF-SHA384** (`cipher_id=aes256-gcm-hkdf-sha384-dna-rna-v1`)

Distinct from:

| Surface | Cipher |
|---------|--------|
| Passport education docs | ChaCha20-Poly1305 + HKDF-SHA256 v2 |
| Wallet / mail credentials | AES-GCM (other KDF info) |
| DNA/RNA bank | AES-256-GCM + HKDF-SHA384 v1 |

## Interoperability boundary (not a DeFi silo)

Cipher **namespaces are intentional isolation**, not a product silo against Aave/Maker-style protocols.

- DNA/RNA and passport vaults hold **private application data**. They are not collateral adapters and do not share master keys with lending markets.
- Cross-surface / DeFi interoperability happens via **explicit export envelopes**: decrypt locally → emit a redacted attestation or hash receipt → consume that receipt in a workflow or on-chain call. Cipher choice at rest does not need to match the DeFi protocol’s AEAD.
- Performance variance (AES-GCM vs ChaCha20) stays inside the vault path; hot DeFi UX is unaffected because markets never decrypt vault blobs.
- Goal: **security domains stay separate; interchange is typed and deliberate**, not ambient key reuse.

## Env

| Env | Purpose |
|-----|---------|
| `FF_DNA_RNA_BANK` | Feature flag (default true) |
| `DNA_RNA_BANK_MASTER_KEY` | Optional dedicated master key; else derived from `SECRET_KEY` |

## API

- `GET /v1/dna-rna-bank/cipher`
- `GET|POST /v1/dna-rna-bank/entries`
- `GET|DELETE /v1/dna-rna-bank/entries/{id}`

## Related

- Migration: `073_dna_rna_bank`
- Crypto: `app/services/dna_rna_crypto.py`
- Service: `app/services/dna_rna_bank.py`
- Router: `app/api/routers/dna_rna_bank.py`
- AETERNA: `docs/AETERNA_LONGEVITY_MARKETPLACE_ROADMAP.md`
