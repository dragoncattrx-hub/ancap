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
