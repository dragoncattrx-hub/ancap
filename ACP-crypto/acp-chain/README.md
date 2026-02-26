# ACP Chain — репозитории и план «под ключ»

Собственная анонимная криптовалюта ACP (ANCAP Chain Protocol). Полный пошаговый план (этапы 0–10): [../docs/ACP_CRYPTO.md](../docs/ACP_CRYPTO.md).

## Репозитории (планируется)

| Репозиторий           | Назначение                                      |
|-----------------------|--------------------------------------------------|
| **acp-node**          | Нода (Rust): блокчейн, консенсус PoS, P2P, RPC  |
| **acp-wallet**        | CLI (Rust/Go) + Web (TS): ключи, подпись, tx    |
| **acp-exchange-kit** | RPC, indexer, webhooks, docker для бирж         |
| **acp-docs**          | Спеки (protocol, crypto, consensus), гайды     |

## Стек

- **Нода**: Rust. CI/CD, линтеры, reproducible builds.
- **Кошелёк**: CLI + Web; ключи на клиенте.
- **Обменники**: RPC + индекс входящих + webhook confirmed.

## Практический порядок разработки

1. Спека + Crypto Spec → 2. acp-crypto → 3. Нода single-node → 4. PoS (локальная сеть) → 5. P2P → 6. Приватность → 7. Wallet CLI/Web → 8. Exchange kit → 9. Testnet → mainnet.

Подробно — в [../docs/ACP_CRYPTO.md](../docs/ACP_CRYPTO.md).
