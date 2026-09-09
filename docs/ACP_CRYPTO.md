# ACP Crypto

Canonical ACP chain/wallet notes live under `ACP-crypto/` (sibling package tree in this monorepo).

Start here:
- `ACP-crypto/acp-docs/`
- `ACP-crypto/acp-chain/`
- `ACP-crypto/acp-wallet/`
- [Post-quantum envelope encryption](ACP_PQC_ENCRYPTION.md)

Current application primitive: versioned X-Wing draft-10 (X25519 + FIPS 203
ML-KEM-768) envelopes for off-chain payloads. Chain signatures remain hybrid
Ed25519 + Dilithium2 for wire compatibility.
