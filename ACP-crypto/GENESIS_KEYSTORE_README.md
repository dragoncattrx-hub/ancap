# Genesis keystore checksums (operator)

SHA-256 of keystore JSON files. Production copies live under `Sicret/` on the server (`/run/secrets` in containers).

| Bucket | Address | Keystore | Notes |
|---|---|---|---|
| creator | `acp1qrfw3d50jd4864vxhatuknhw65jwv463ccr6flsl` | `creator.keystore.json` | |
| validator | `acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um` | `validator-reserve.keystore.json` | |
| public | `acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm` | `public-liquidity.keystore.json` | |
| ecosystem | `acp1qq9t4lf4z7lprt7a6nr682cl02f5tcyh45stakdf` | `ecosystem-grants.keystore.json` | Migrated 2026-07-13; supersedes `acp1qrpavez2...` |

Verify alignment (CI / pre-genesis):

```bash
python scripts/verify-genesis-keystores.py
```

Verify keystore files derive manifest addresses (requires `walletd`):

```bash
python scripts/verify-genesis-keystores.py --keystore-dir /path/to/keystores
```

Genesis submit (`build_and_submit_genesis`) blocks when manifest addresses diverge from `genesis-addresses.json`. Set `ACP_GENESIS_KEYSTORE_DIR` to also verify keystore files before submit.
