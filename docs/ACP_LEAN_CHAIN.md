# ANCAP — ACP Lean Chain (v1.4)

> Status: shipped in protocol/node | 2026-09-07  
> Goal: keep **ACP** competitive on the three axes markets and forums debate hardest: **security**, **speed**, **energy**.

## Market read (2026)

| Theme | What leaders are doing | ACP Lean response |
|-------|------------------------|-------------------|
| Security | Post-quantum roadmaps (Lean Ethereum / hash-based aggregates), multi-client diversity | **Hybrid Ed25519 + Dilithium2** signing already default |
| Speed | Solana ~1k+ real TPS; ETH L1 zkEVM / parallel exec; L2 blobs | **5s target**, **fee-packed** blocks up to **512 txs / 2 MB**, design hint ~**100 TPS** |
| Energy | ETH Merge cut ~99.9% vs PoW; Cambridge ranks PoS intensity | **No PoW** — ultra-light assembler; idle **heartbeat ~60s** only |

ACP is not trying to out-hash Bitcoin or out-Sealevel Solana overnight. It optimizes for **AI workflow settlement**: quantum-aware keys, low ops energy, predictable packed throughput.

## Node changes (v1.4)

- Multi-tx **fee-prioritized packing** (`acp-node` miner)
- Default `ACP_MINER_INTERVAL_SECS=5` (matches `TARGET_BLOCK_TIME_SEC`)
- Throttled **heartbeat** emission blocks when idle (`ACP_MINER_HEARTBEAT_*`)
- `getnetworkinfo` exposes lean profile fields
- Platform: `GET /v1/acp/explorer/efficiency` + lean block on explorer/ACP landing

## Env (prod compose)

```
ACP_MINER_INTERVAL_SECS=5
ACP_MINER_HEARTBEAT_ENABLED=true
ACP_MINER_HEARTBEAT_EVERY_N=12
ACP_MINER_MAX_TXS_PER_BLOCK=512
```

## Non-goals (honest)

- Full BFT PoS validator set (constants exist; consensus still assembler/miner)
- zkVM block proofs (track for later — mirrors ETH L1-zkEVM direction)
- Claiming Solana-class sustained TPS without load evidence

## Next gates

1. Measure live pack fill + derived TPS on explorer
2. PoS localnet (stake / epoch / slash against existing params)
3. Optional STARK/zk attestation path for AI run receipts
