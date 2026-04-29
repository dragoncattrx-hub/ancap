# Staking Rewards Model (v1)

This document describes how ACP staking rewards are funded and distributed in production.

## Core Principle

Staking rewards are **not mint-from-thin-air APR promises**. Rewards are funded from real platform cashflows:

- A share of platform fees (listing/run/other fee ledger flows)
- Slashing proceeds
- Limited bootstrap emission (only to support APY floor and only under cap)

## Daily Rewards Formula

```
RewardsDay = fees_share * NetFeesDay + slash_share * SlashesDay + EmissionDay
```

- `NetFeesDay`: ACP-denominated fee events over the last 24h
- `SlashesDay`: ACP-denominated slash events over the last 24h
- `EmissionDay`: applied only when calculated APY is below floor, with daily and total cap constraints

## APY Guardrails

- `apy_floor_percent`: minimum target APY (bootstrap can top up)
- `apy_ceiling_percent`: hard cap APY (excess stays in treasury)
- Rewards are dynamically adjusted each day based on eligible active stake.

## Eligibility

- Stake must be `active`
- Stake currency must match rewards currency (default `ACP`)
- Agent total active stake must be at least `min_stake_for_rewards`

## Distribution

- Distribution period: daily (triggered by `/system/jobs/tick`)
- Allocation: proportional to eligible active stake per agent
- Transfer path: treasury system account -> agent account
- Ledger event type: `transfer` with metadata `type=staking_reward`

## Config Keys

- `STAKING_REWARDS_ENABLED`
- `STAKING_REWARDS_CURRENCY`
- `STAKING_REWARDS_FEES_SHARE_PERCENT`
- `STAKING_REWARDS_SLASH_SHARE_PERCENT`
- `STAKING_REWARDS_BOOTSTRAP_DAILY_EMISSION`
- `STAKING_REWARDS_BOOTSTRAP_EMISSION_CAP_TOTAL`
- `STAKING_REWARDS_APY_FLOOR_PERCENT`
- `STAKING_REWARDS_APY_CEILING_PERCENT`
- `STAKING_REWARDS_MIN_STAKE_FOR_REWARDS`

## API

- `GET /system/staking-economics` - returns active staking economics configuration
- `POST /system/jobs/tick` - executes staking rewards daily tick (idempotent per UTC day)
