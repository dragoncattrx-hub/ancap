# Пилот wACP rail в BSC mainnet

Цель: включить мост в **боевой сети BSC (chain id 56)** после деплоя контрактов и настройки API. Репозиторий не хранит приватные ключи и адреса продакшена — только шаблоны.

## 0. Что нельзя сделать из репозитория автоматически

- Подписать транзакции в mainnet без `PRIVATE_KEY` (или кошелька) на вашей машине.
- Включить `BRIDGE_RAIL_ENABLED=true` на **ancap.cloud** без вашего `docker compose`/секретов на сервере.

Ниже — полный порядок действий для оператора.

## 1. Контракты (Foundry)

```bash
cd contracts/bridge-bsc
forge install foundry-rs/forge-std@v1.9.4
export PRIVATE_KEY=...          # deployer EOA (никогда в git)
# Лимиты минта (18 decimals wACP), при необходимости переопределите:
# export BRIDGE_MAX_SINGLE_MINT_WEI=...
# export BRIDGE_MINT_CAP_PER_DAY_WEI=...

forge script script/Deploy.s.sol:DeployScript \
  --rpc-url "$BSC_MAINNET_RPC" \
  --broadcast \
  -vvv
```

Сохраните из логов адреса **WACP** и **BridgeGateway**. Проверка предсказания адреса gateway: `forge test --match-contract DeployPredictionTest`.

После деплоя при необходимости передайте владение мультисигу (отдельные транзакции от deployer):

- `WACP.transferOwnership(newOwner)`
- `BridgeGateway.transferOwnership(newOwner)`

## 2. Postgres

На той же БД, что и API:

```bash
alembic upgrade head
```

(миграция **039** — только таблицы `bridge_*`.)

## 3. Переменные API (Docker / systemd)

1. Скопируйте [`deploy/bridge-mainnet.pilot.env.example`](../deploy/bridge-mainnet.pilot.env.example) в секретный файл на сервере.
2. Подставьте реальные `BRIDGE_WACP_CONTRACT`, `BRIDGE_GATEWAY_CONTRACT`, `BRIDGE_RESERVE_ACP_ADDRESS`, `BRIDGE_OPERATOR_SECRET`, свой `BRIDGE_BSC_RPC_URL`.
3. Поднимите стек с этим env (пример):

```bash
docker compose --env-file /path/to/bridge.env -f docker-compose.prod.yml build --no-cache
docker compose --env-file /path/to/bridge.env -f docker-compose.prod.yml up -d
```

Пока не готовы к приёму пользователей, можно оставить **`BRIDGE_RAIL_PAUSED=true`** и **`BRIDGE_DRY_RUN=true`** для сухого прогона оркестратора (если поведение dry-run вас устраивает; иначе см. код `bridge_dry_run`).

## 4. Cron / tick

Настройте периодический вызов `POST /v1/system/jobs/tick` с `X-Cron-Secret`, если задан `CRON_SECRET` (см. [bridge-launch-checklist.md](./bridge-launch-checklist.md)).

## 5. ACP и горячий кошелёк

Мост **не заменяет** настройку `ACP_RPC_URL`, `acp-node`, мнемоники резерва. Не меняйте genesis и ключи пользовательских кошельков; резерв для депозитов ACP — отдельный операторский адрес в `BRIDGE_RESERVE_ACP_ADDRESS`.

## 6. Пилот «включён», но безопасный старт

1. Короткий allowlist BSC-адресов через админ-API (если включён режим allowlist).
2. Низкие caps на контракте (`setCaps`) и лимиты в env скрипта деплоя.
3. Мониторинг `reconciliation_mismatch` в `bridge_audit_events`.

После стабилизации пилота задокументируйте тег релиза по [bridge-launch-checklist.md](./bridge-launch-checklist.md) (`bridge-v1.0.0-mainnet`).
