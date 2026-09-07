# ACP Privacy — unlinkable receive (v1)

> Status: shipped foundation | 2026-09-07  
> Goal: **maximum practical anonymity** for ACP users without illegal mixers/tumblers.

## What “maximum” means here

| Layer | Capability |
|-------|------------|
| Unlinkability | One-time **subaddresses** from view public key (`ACP/subaddr/v1/{index}`) |
| Data minimization | Wallet history + explorer default **redacted** (`?privacy=1`, `?view=redacted`) |
| Key hygiene | View wire can be bound without exposing spend key long-term |
| Honest limit | Amounts remain visible to anyone with a full node (transparent UTXO ledger) |

**Not included (by design):** coinjoin/mixers, dark-pool laundering rails, or claims that ACP is “invisible.”

## Protocol

- Rust: `ACP-crypto/acp-crypto/src/privacy.rs`
- `WalletIdentity::receive_subaddress_v0(index)` — index `0` = primary
- `walletd address --index N` returns subaddress + `view_pubkey_wire_hex`
- Transfers scan indices `0..=64` for UTXOs; change prefers subaddress `1`

## Platform API

```
GET  /v1/wallet/acp/privacy/status
POST /v1/wallet/acp/privacy/receive-address   # body: { wallet_password?, label? }
GET  /v1/wallet/acp/transactions?privacy=true
GET  /v1/acp/explorer/tx/{txid}?view=redacted|full
```

Migration: `060_privacy` (`view_pubkey_wire_hex`, `privacy_next_index`, `user_acp_privacy_addresses`).

## UX

- Web wallet: **New privacy address** under Deposit
- Explorer tx page: redacted by default; optional full reveal

## Next gates

1. Confidential amounts (pedersen / similar) — protocol hard-fork track  
2. Mobile receive rotation default-on  
3. Optional Tor / RPC privacy transport for light clients
