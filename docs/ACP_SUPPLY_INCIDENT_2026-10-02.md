# ACP supply incident — 2026-10-02

## Verified pre-recovery state

A full replay of active-chain heights 1–33,962 found:

- canonical genesis output: **210,000,000 ACP**;
- synthetic validator outputs: **56,537.05258127 ACP**;
- three accepted double-spend transactions created **622,130,939.999991 ACP**;
- fees removed **0.00002000 ACP**;
- actual unspent supply: **832,187,477.05255227 ACP**;
- excess over the 210M hard cap: **622,187,477.05255227 ACP**.

The previous wallet figure `2,538,291,192.32 ACP` was not the real chain
supply. It combined stale UTXO-index state across chain resets. The exact
pre-recovery replay is stored in
[`audits/ACP_SUPPLY_AUDIT_2026-10-02.json`](audits/ACP_SUPPLY_AUDIT_2026-10-02.json).

The first invalid transaction was accepted at height 10. Two more were
accepted at heights 32,871 and 32,874. In each case the input referenced an
already-spent outpoint; the old node trusted the amount repeated inside the
new input instead of resolving an unspent output.

## Root causes

1. Block and mempool validation checked signatures and arithmetic declared by
   the transaction, but did not require referenced outputs to exist and remain
   unspent.
2. Input ownership was not compared with the previous output recipient.
3. Automatic zero-prevout validator payments were added on top of a full 210M
   genesis, despite the validator allocation already being part of genesis.
4. The API UTXO-index watermark stored only a height, so a regenesis could
   retain stale outputs from the previous chain.
5. One index parser treated string and integer amount fields as different
   denominations. ACP RPC amounts are now accepted only as integer base units.

## Recovery invariant

- Exactly **210,000,000 ACP** (`21,000,000,000,000,000` units) may be issued.
- Genesis contains exactly four ordered allocations: Creator 69.3M,
  Validator Reserve 105M, Public & Liquidity 25.2M, Ecosystem 10.5M.
- Validator rewards are ordinary signed spends from the genesis reserve, not
  new issuance.
- Every regular input must exist, be unspent, match the referenced amount, and
  be controlled by the transaction signer. AddressV0 commits to the view
  public key, so the current spend authority is the matching view secret.
  Changing that commitment would remint every published address and is
  deferred past this recovery.
- Duplicate inputs and mempool conflicts are rejected.
- Fees reduce UTXO supply; no post-genesis transaction may increase it.
- The node persists supply counters atomically and exposes
  `gettxoutsetinfo`; withdrawals fail closed unless the 210M invariant passes.
- Bridge proof reads ERC-20 `totalSupply()` from BSC, rounds the 18-decimal
  liability up to ACP's 8-decimal units, and requires a 999 ACP fee buffer.
- The old v2 RocksDB is archived before controlled regenesis v3.

## Live recovery (2026-10-02)

Production `gettxoutsetinfo` after regenesis v3:

- genesis hash `78be2f72e8cf3bb41b0baa6fead9b40eb58be2f57e6a21a026d08ae8e8f6d8ce`
- height 12
- issued 210,000,000 ACP
- UTXO supply 209,999,999.999989 ACP
- burned fees 0.000011 ACP
- `supply_invariant_ok=true`

The recovery preserves non-operator end-user outputs listed in
[`audits/ACP_REGENESIS_V3_MIGRATION_2026-10-02.json`](audits/ACP_REGENESIS_V3_MIGRATION_2026-10-02.json).
Inflated change outputs and obsolete v2 operator allocations are excluded.
