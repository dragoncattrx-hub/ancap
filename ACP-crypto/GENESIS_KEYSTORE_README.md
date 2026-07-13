# Genesis keystore checksums (operator)

SHA-256 of keystore JSON files uploaded to Sicret. Regenerate after keystore rotation.

Local canonical copies: `C:\Users\drago\Desktop\Sicret\wallets-canonical\` (never commit keystores).

| Bucket | Address | Keystore | SHA-256 |
|---|---|---|---|
| creator | `acp1qrfw3d50jd4864vxhatuknhw65jwv463ccr6flsl` | `creator.keystore.json` | `4949f46129516101fb6356fdac9889afeceb71308a9b8bb3a531fae27af610fb` |
| validator | `acp1qp69rhaq4k8lgfwdqynqq5uva7uvswne8qq6g5um` | `validator-reserve.keystore.json` | `7629dac096969063b980999488f5472a20cfc7b6d97b5ec4d63fb396c3be8f7c` |
| public | `acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm` | `public-liquidity.keystore.json` | `e44e2b345bed780c13f34fb08c34ab0fb689922af653ca1322c04937e0687f17` |
| ecosystem | `acp1qq9t4lf4z7lprt7a6nr682cl02f5tcyh45stakdf` | `ecosystem-grants.keystore.json` | `9a7f0519d90eb4bf0d3bb3d90993efa41de5110c083b66a544559e54e503ca47` |

Ecosystem migrated 2026-07-13; supersedes genesis slot `acp1qrpavez2tttvly2umdjz8jfsdu5yjqjftuyzmau5`.

Verify alignment (CI / pre-genesis):

```bash
python scripts/verify-genesis-keystores.py
```

Verify keystore files derive manifest addresses (requires `walletd`):

```bash
python scripts/verify-genesis-keystores.py --keystore-dir /path/to/keystores
```

Regenerate checksums after Sicret upload:

```bash
python scripts/upload-keystores-to-sicret.py
```

Genesis submit (`build_and_submit_genesis`) blocks when manifest addresses diverge from `genesis-addresses.json`. Set `ACP_GENESIS_KEYSTORE_DIR` to also verify keystore files before submit.
