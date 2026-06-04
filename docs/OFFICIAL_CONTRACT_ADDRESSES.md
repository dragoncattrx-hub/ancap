# Official contract-address and verification index

Status: public-safe reference for the currently documented ACP / wACP / bridge identities.

Use this page as the fast index for the official public contract surfaces, explorer links, and verification pointers.
For deployment-story context, see [bridge-pilot-mainnet.md](./bridge-pilot-mainnet.md).
For source/build verification, see [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md).
For operational trust boundaries and bridge risk posture, see [BRIDGE_RISK_DOCUMENTATION.md](./BRIDGE_RISK_DOCUMENTATION.md).

## Critical warning

Treat any token, contract, pool, or social post that does **not** match the addresses on this page as untrusted until verified.

Especially important:
- native **ACP** is **not** an ERC-20/BEP-20 contract;
- the official wrapped BSC asset is **`wACP`**, not an arbitrary token using similar branding;
- verify the full address, not only the symbol, name, or logo;
- cross-check contract source and runtime status before treating a surface as official.

## Official identities

### Native ACP

ACP is the native ANCAP chain asset.
It does **not** have an EVM contract address on the ANCAP chain.

Current public identity surfaces:
- mainnet chain id: `acp-mainnet-1`
- testnet chain id: `acp-testnet-1`
- default numeric chain id in the current ACP docs/tooling: `1001`
- native address format: `acp1...`
- ACP chain landing/status surface: <https://ancap.cloud/acp>
- ACP transaction-view pattern used by the bridge docs/UI: `https://ancap.cloud/acp/tx/<txid>`

Reference docs:
- [ACP crypto-asset whitepaper](./WHITEPAPER_ACP.md)
- [ACP crypto README](../ACP-crypto/README.md)

### BSC mainnet — wrapped ACP contract

Official wrapped token:
- contract: `WACP`
- network: `BSC mainnet`
- address: `0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402`
- explorer: <https://bscscan.com/address/0x349797E2f1A4FD722Af2dB181ab1C4ED7606F402>
- source: [contracts/bridge-bsc/src/WACP.sol](../contracts/bridge-bsc/src/WACP.sol)

### BSC mainnet — bridge gateway contract

Official bridge gateway:
- contract: `BridgeGateway`
- network: `BSC mainnet`
- address: `0x57c24FF77B23a82328cb88914D4FD4EEBd93321b`
- explorer: <https://bscscan.com/address/0x57c24FF77B23a82328cb88914D4FD4EEBd93321b>
- source: [contracts/bridge-bsc/src/BridgeGateway.sol](../contracts/bridge-bsc/src/BridgeGateway.sol)

## Related public trust surfaces

Use these together with the addresses above:
- bridge pilot deployment story: [bridge-pilot-mainnet.md](./bridge-pilot-mainnet.md)
- build/source verification process: [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md)
- bridge risk/trust model: [BRIDGE_RISK_DOCUMENTATION.md](./BRIDGE_RISK_DOCUMENTATION.md)
- testnet validation path: [TESTNET_DEPLOYMENT_GUIDE.md](./TESTNET_DEPLOYMENT_GUIDE.md)
- bridge UI/status surface: <https://ancap.cloud/bridge/acp-bsc>
- bridge status API: <https://ancap.cloud/api/v1/bridge/status>
- reserve summary API: <https://ancap.cloud/api/v1/bridge/reserve-summary>
- reserve proof API: <https://ancap.cloud/api/v1/wacp/reserve-proof>

## Fast verification flow

1. Confirm the address matches this page exactly.
2. Confirm the same address appears in [bridge-pilot-mainnet.md](./bridge-pilot-mainnet.md).
3. Open the explorer link and compare the verified source/interface with the repo source.
4. Follow [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md) to rebuild/test from source.
5. Check runtime truth via bridge status and reserve surfaces.
6. If anything disagrees, treat the surface as suspect until the public docs are reconciled.

## Fake-contract / scam checks

Red flags:
- a token claims to be "ACP" on BSC instead of the wrapped asset name `wACP`;
- a contract uses a similar symbol/logo but a different address;
- a listing links only to chat posts, screenshots, or marketing pages instead of this repo and explorer pages;
- the source code cannot be tied back to the public repo and documented deployment story;
- runtime status or reserve docs do not line up with the contract being promoted.

## Maintenance rule

If the official public contract surfaces change, update all of the following together:
- this page;
- [bridge-pilot-mainnet.md](./bridge-pilot-mainnet.md);
- [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md);
- [CHANGELOG_PUBLIC.md](./CHANGELOG_PUBLIC.md) when the change is externally meaningful.
