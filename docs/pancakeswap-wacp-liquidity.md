# PancakeSwap wACP liquidity

## Purpose

This document covers the DEX side after the ACP -> BSC rail is already working.
It is not about bringing the bridge to life from zero anymore.
As of 2026-05-04, the bridge pilot already completed one real successful ACP -> BSC mint.

## Current bridge context

### Live contracts
- `WACP`: `0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402`
- `BridgeGateway`: `0x57c24FF77B23a82328cb88914D4FD4EEBd93321b`

### Current runtime
- bridge enabled
- not paused
- `dry_run=false`
- `BRIDGE_ACP_CONFIRMATIONS=3`

### Proven pilot result
- one real `1 ACP -> 1 wACP` pilot completed successfully
- recipient wallet received `1 wACP`
- reconciliation stayed clean

## What liquidity step means now

The bridge can already mint `wACP`.
Liquidity is the next market-access layer, not a blocker for the mint rail itself.

## Preconditions before seeding liquidity

1. Bridge runtime is healthy.
2. `wACP` exists on BSC mainnet.
3. Operator wallet has enough:
   - `BNB` for gas
   - `wACP`
   - paired token, usually `USDT` on BSC
4. Token contract addresses are verified and documented.
5. Team is ready to publish pair address and risk notes.

## Suggested first pair

Default practical choice:
- `wACP / USDT`

Reason:
- easier price communication
- easier user mental model
- better for first pilot liquidity than exotic pairing

## Before opening PancakeSwap

Prepare these links and values:
- wACP token contract
- official BSC USDT contract
- target initial price model
- initial liquidity amounts
- bridge UI URL: `/bridge/acp-bsc`
- BscScan links for `wACP` and bridge txs

## Suggested operator flow

### 1. Make sure minted inventory exists
Before adding LP, verify you actually hold `wACP` in the operator wallet.
At minimum verify:
- `balanceOf(operator_wallet) > 0`

### 2. Decide initial price carefully
Do not improvise price from vibes.
Decide explicitly:
- how many USDT per 1 wACP
- how much depth to provide
- acceptable initial slippage

### 3. Open PancakeSwap
On <https://pancakeswap.finance/>:
1. connect the BSC wallet
2. open **Liquidity**
3. choose **Add Liquidity** or V3 equivalent
4. import custom token `wACP` by contract address
5. select official `USDT` on BSC
6. enter liquidity amounts
7. approve tokens if prompted
8. confirm supply transaction

### 4. Save public references
After pool creation, save and publish:
- wACP token page
- pair/pool page
- bridge page
- short explanation of bridge pause/caps risks

## Post-liquidity checks

1. Small swap test:
   - `wACP -> USDT`
   - `USDT -> wACP`
2. Confirm routing works.
3. Confirm displayed token metadata is correct.
4. Confirm slippage is not absurd.
5. Confirm pool link is stable and shareable.

## What users should be told

At minimum publish:
- how to get `wACP`
- official contract address
- official pair address
- where to verify txs
- bridge can be paused by operator
- liquidity is limited during pilot phase
- smart contract and bridge risks exist

## Operational risks

- low liquidity means price moves hard
- LP can be imbalanced quickly
- user confusion is likely if contract/pair links are not clearly published
- bridge pause, caps, or reconciliation issues must be communicated quickly

## Recommendation

Do not seed large liquidity immediately.
First do:
1. one more small controlled bridge pilot
2. confirm repeatability
3. then add conservative initial liquidity

## Not covered here

This doc does not define:
- exact treasury policy
- market-making strategy
- reverse bridge direction (`BSC -> ACP`)
