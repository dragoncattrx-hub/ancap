# wACP V3 deployment checklist (human-signed txs)

1. [ ] `python scripts/check_wacp_reserve_before_mint.py`
2. [ ] `python scripts/wacp/compute_mint_envelope.py` — Gate A pass
3. [ ] Approval YAML filled (`deploy/wacp-v3-stage-a.approval.yaml`)
4. [ ] Mint wACP → treasury (not pool); record tx hash
5. [ ] Post-mint reserve proof + `totalSupply` verify
6. [ ] `python scripts/wacp/v3_onchain_read.py --pool $WACP_V3_POOL` (or pre-create pool params)
7. [ ] `python scripts/wacp/v3_deploy_calculator.py ...` — Gates B/C
8. [ ] `bash scripts/wacp/v3_preflight.sh`
9. [ ] Approve USDT + wACP spend; mint V3 NFT position
10. [ ] Record position id via `POST /v1/internal/wacp-liquidity/stages/.../positions`
11. [ ] `python scripts/wacp/quote_smoke.py` — $100 / $250 / $500 quotes
12. [ ] Publish V2 + V3 URLs on `/docs/wacp/pancakeswap` and `/markets`
