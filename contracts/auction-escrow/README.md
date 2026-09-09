# ANCAP Auction Escrow (BSC)

Operator-anchored escrow for FAUNA / TECH / Galaxy auction verticals.

## Deploy

```bash
export PRIVATE_KEY=0x...
export AUCTION_OPERATOR=0x...   # backend operator EOA
forge script script/Deploy.s.sol:DeployScript --rpc-url $BSC_RPC_URL --broadcast
```

## Backend env

```
AUCTION_ESCROW_DRIVER=mock|bsc
AUCTION_ESCROW_CONTRACT=0x...
AUCTION_ESCROW_OPERATOR_PRIVATE_KEY=0x...   # dedicated key — never reuse bridge hot wallet
AUCTION_ESCROW_BSC_RPC_URL=...
```

Mock driver is default: deterministic `0x` tx hashes for desk mode until BSC is wired.
