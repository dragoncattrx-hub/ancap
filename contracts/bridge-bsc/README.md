# wACP + BridgeGateway (BSC)

Custodial clearing rail: operator mints wACP after native ACP deposit proof; users call `requestRelease` to burn wACP and signal ACP payout (off-chain orchestrator).

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) **or** Docker image `ghcr.io/foundry-rs/foundry:latest`.

## Setup

```bash
cd contracts/bridge-bsc
forge install foundry-rs/forge-std@v1.9.4
```

## Test

```bash
forge test -vvv
```

Docker (no local Foundry): mount the **git repo root** so `forge install` works; from repo root:

```bash
docker run --rm -v "$(pwd):/repo" -w /repo/contracts/bridge-bsc ghcr.io/foundry-rs/foundry:latest /bin/bash -lc "git config --global --add safe.directory /repo && forge install foundry-rs/forge-std@v1.9.4 && forge test -vvv"
```

## Deploy (BSC testnet example)

Set `PRIVATE_KEY` and RPC; then use Foundry script (add `script/Deploy.s.sol` when ready) or `forge create`.

See [docs/bridge-spec-v1.md](../../docs/bridge-spec-v1.md) for invariants and operations.

## Release tags (repo convention)

- `bridge-v1.0.0-testnet` — artifact set verified on BSC testnet
- `bridge-v1.0.0-mainnet` — production addresses + migrations
