# ACP — ANCAP Chain Protocol

Cryptocurrency and network protocol for the **ANCAP** (AI-Native Capital Allocation Platform) platform. The **ACP** token is used as:

- execution gas and commissions for run/listing
- stake for reputation and governance
- collateral for insurance pools and slashing

## Repository structure

| Package | Destination |
|-------|------------|
| **acp-crypto** | Cryptography: BIP39 mnemonic, bech32 `acp1...` addresses, transactions, blocks, protocol parameters (supply, emission, commissions). |
| **acp-node** | Node: RocksDB, mempool, JSON-RPC, miner. Run: `cargo run -p acp-node` or through the config `acp-node.toml`. |
| **acp-wallet** | CLI wallet and examples: generation of genesis wallets, sending genesis block, ACP transfers. |
| **acp-docs** | Protocol specifications and guides. |
| **acp-chain** | Add. chain tools. |
| **acp-exchange-kit** | Integrations for exchanges/wallets. |

## Quick start

1. **Build** (from ACP-crypto root):

   ```bash
   cargo build --release
   ```

2. **Node config** - copy `acp-node/acp-node.toml.example` V `acp-node.toml` (or `/etc/acp/acp-node.toml`), if necessary, set `data_dir`, `rpc.listen`, `peer_rpc_urls`.

3. **Environment Variables** (optional):

   - `ACP_DATA_DIR` — node data directory (default `/var/lib/acp-node`)
   - `ACP_RPC_LISTEN` - address: RPC port (default `127.0.0.1:8545`)
   - `ACP_CHAIN_ID` — network ID (default 1001)
   - `ACP_RPC_URL` - for wallet examples: RPC node URL (default `http://127.0.0.1:8545/rpc`)
   - `ACP_ECOSYSTEM_MNEMONIC` - Ecosystem wallet mnemonic (for translation examples)

4. **Genesis** (first launch):

   ```bash
   cargo run -p acp-wallet --example genesis_wallets   # create genesis-addresses.json
   cargo run -p acp-wallet --example build_and_submit_genesis # node must be running, database is empty
   ```

5. **Example of transferring 500 ACP** from Ecosystem to a test address:

   ```bash
   cargo run -p acp-wallet --example transfer_500_acp
   ```

## Protocol options (acp-crypto)

- **Token:** ACP, 1 ACP = 10^8 units, addresses `acp1...` (bech32).
- **Chain ID:** mainnet `acp-mainnet-1`, testnet `acp-testnet-1` (string); default numeric is 1001.
- **Genesis:** base supply 210M ACP; Creator/Validator Reserve/Public/Ecosystem distribution (see `protocol_params.rs`).
- **Commission:** minimum 100 units (0.000001 ACP) per transaction.

## Integration with ANCAP

In the main ANCAP project (Python/FastAPI), the **Chain anchors** (L3) layer can anchor hashes of artifacts and events (stake, slash, settlement) to the ACP network - through a separate service or RPC calls to the acp-node. The ACP token is planned to be used for stake, fee and governance in ANCAP v2.
