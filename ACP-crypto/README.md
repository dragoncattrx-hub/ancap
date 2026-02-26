# ACP — ANCAP Chain Protocol

Криптовалюта и протокол сети для платформы **ANCAP** (AI-Native Capital Allocation Platform). Токен **ACP** используется как:

- execution gas и комиссии за run/листинг
- stake для репутации и governance
- коллатерал для страховых пулов и slashing

## Структура репозитория

| Пакет | Назначение |
|-------|------------|
| **acp-crypto** | Криптография: мнемоника BIP39, адреса bech32 `acp1...`, транзакции, блоки, параметры протокола (supply, эмиссия, комиссии). |
| **acp-node** | Нода: RocksDB, mempool, JSON-RPC, майнер. Запуск: `cargo run -p acp-node` или через конфиг `acp-node.toml`. |
| **acp-wallet** | CLI-кошелёк и примеры: генерация genesis-кошельков, отправка genesis-блока, переводы ACP. |
| **acp-docs** | Спеки протокола и гайды. |
| **acp-chain** | Доп. инструменты цепочки. |
| **acp-exchange-kit** | Интеграции для бирж/кошельков. |

## Быстрый старт

1. **Сборка** (из корня ACP-crypto):

   ```bash
   cargo build --release
   ```

2. **Конфиг ноды** — скопировать `acp-node/acp-node.toml.example` в `acp-node.toml` (или `/etc/acp/acp-node.toml`), при необходимости задать `data_dir`, `rpc.listen`, `peer_rpc_urls`.

3. **Переменные окружения** (опционально):

   - `ACP_DATA_DIR` — каталог данных ноды (по умолчанию `/var/lib/acp-node`)
   - `ACP_RPC_LISTEN` — адрес:порт RPC (по умолчанию `127.0.0.1:8545`)
   - `ACP_CHAIN_ID` — ID сети (по умолчанию 1001)
   - `ACP_RPC_URL` — для wallet examples: URL RPC ноды (по умолчанию `http://127.0.0.1:8545/rpc`)
   - `ACP_ECOSYSTEM_MNEMONIC` — мнемоника кошелька Ecosystem (для примеров переводов)

4. **Genesis** (первый запуск):

   ```bash
   cargo run -p acp-wallet --example genesis_wallets   # создать genesis-addresses.json
   cargo run -p acp-wallet --example build_and_submit_genesis   # нода должна быть запущена, БД пустая
   ```

5. **Пример перевода 500 ACP** с Ecosystem на тестовый адрес:

   ```bash
   cargo run -p acp-wallet --example transfer_500_acp
   ```

## Параметры протокола (acp-crypto)

- **Токен:** ACP, 1 ACP = 10^8 units, адреса `acp1...` (bech32).
- **Chain ID:** mainnet `acp-mainnet-1`, testnet `acp-testnet-1` (строковые); числовой по умолчанию 1001.
- **Genesis:** base supply 210M ACP; распределение Creator / Validator Reserve / Public / Ecosystem (см. `protocol_params.rs`).
- **Комиссия:** минимум 100 units (0.000001 ACP) за транзакцию.

## Интеграция с ANCAP

В основном проекте ANCAP (Python/FastAPI) слой **Chain anchors** (L3) может анкорить хэши артефактов и событий (stake, slash, settlement) в сеть ACP — через отдельный сервис или RPC вызовы к acp-node. Токен ACP планируется использовать для stake, fee и governance в ANCAP v2.
