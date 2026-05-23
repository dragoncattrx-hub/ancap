# acp-mobile-ffi

Rust library for **non-custodial** ACP Wallet (mobile and tooling).

## API

| Function | Description |
|----------|-------------|
| `acp_create_wallet()` | New BIP39 12-word wallet + `acp1` address |
| `acp_import_mnemonic` | Derive address from mnemonic |
| `acp_validate_address` | Check `acp1...` bech32 |
| `acp_sign_transfer` | Build + sign UTXO tx (needs RPC for UTXOs) |
| `acp_estimate_fee_default` | Network min fee |

## Build

```bash
cd ACP-crypto
cargo build -p acp-mobile-ffi --release
cargo test -p acp-mobile-ffi
```

## walletd CLI (mobile-friendly)

```bash
walletd new
walletd sign-transfer --rpc https://acp1.ancap.cloud/rpc --mnemonic "..." --to acp1... --amount-acp 1
walletd submit --rpc https://acp1.ancap.cloud/rpc --raw-tx <hex>
```

Mobile app flow: **sign locally** → `POST /v1/acp/tx/broadcast` with `rawTx`.

## iOS / Android bindings

Phase P1b: add UniFFI or `cxx` bridge — see `docs/mobile/ROADMAP.md`.
