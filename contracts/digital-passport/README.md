# ANCAP Digital Passport (BSC Soulbound)

Non-transferable identity attestation contract for org-verified members.

## Build & test

```bash
cd contracts/digital-passport
forge install foundry-rs/forge-std --no-commit
forge test
```

## Deploy (BSC testnet/mainnet)

Environment:

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer EOA private key |
| `PASSPORT_MINTER` | Backend minter address (defaults to deployer) |
| `BSC_RPC_URL` | RPC endpoint |

```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url bsc_testnet --broadcast
```

Record deployed address as `DIGITAL_PASSPORT_CONTRACT` in backend `.env`.

## Backend integration

- `DIGITAL_PASSPORT_DRIVER=mock` — deterministic tx hash in DB (default dev)
- `DIGITAL_PASSPORT_DRIVER=bsc` — real mint/revoke via JSON-RPC + minter key
- `DIGITAL_PASSPORT_CONTRACT` — deployed contract address
- `DIGITAL_PASSPORT_MINTER_PRIVATE_KEY` — minter EOA (or reuse bridge key in dev)
