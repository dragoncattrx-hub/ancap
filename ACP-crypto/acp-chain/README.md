# ACP Chain - repositories and turnkey plan

Own anonymous cryptocurrency ACP (ANCAP Chain Protocol). Full step-by-step plan (stages 0–10): [../docs/ACP_CRYPTO.md](../docs/ACP_CRYPTO.md).

## Repositories (planned)

| Repository | Destination |
|-----------------------|--------------------------------------------------|
| **acp-node** | Noda (Rust): blockchain, consensus PoS, P2P, RPC |
| **acp-wallet** | CLI (Rust/Go) + Web (TS): keys, signature, tx |
| **acp-exchange-kit** | RPC, indexer, webhooks, docker for exchanges |
| **acp-docs** | Heats (protocol, crypto, consensus), guides |

## Stack

- **Node**: Rust. CI/CD, linters, reproducible builds.
- **Wallet**: CLI + Web; keys on the client.
- **Exchangers**: RPC + incoming index + webhook confirmed.

## Practical development procedure

1. Spec + Crypto Spec → 2. acp-crypto → 3. Single-node node → 4. PoS (local network) → 5. P2P → 6. Privacy → 7. Wallet CLI/Web → 8. Exchange kit → 9. Testnet → mainnet.

Detailed — V [../docs/ACP_CRYPTO.md](../docs/ACP_CRYPTO.md).
