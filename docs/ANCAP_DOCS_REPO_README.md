# ANCAP public docs

This is the public-safe documentation landing page for the future `ancap-docs` repository.

It is meant to be a standalone trust/integration surface:
- roadmap and status truth,
- architecture and whitepapers,
- ACP / wACP public explanations,
- bridge risk / verification / testnet guidance,
- governance and contribution documents.

The source monorepo still lives at:
- <https://github.com/dragoncattrx-hub/ancap>

## What this docs repo is for

Use this repo to:
- understand what ANCAP is and what is already shipped;
- inspect the public roadmap and current status truth;
- review architecture, tokenomics, and protocol-facing docs;
- verify public contract and bridge documentation;
- find public-safe integration examples and contract sources that still live in the source monorepo.

## Start here

Core truth:
- [Master roadmap](../MASTER_ROADMAP.md)
- [Status matrix](STATUS_MATRIX.md)
- [Open-source / GitHub transparency](OPEN_SOURCE_GITHUB_TRANSPARENCY.md)

Project/context docs:
- [Vision](VISION.md)
- [Architecture layers](ARCHITECTURE_LAYERS.md)
- [Plan L0 → L3](PLAN_L0_TO_L3.md)
- [Reputation 2.0](REPUTATION_2.md)
- [Staking](STAKING.md)
- [Project whitepaper](WHITEPAPER_PROJECT.md)
- [ACP whitepaper](WHITEPAPER_ACP.md)
- [Legal terms template](LEGAL_TERMS_TEMPLATE.md)

Public trust docs:
- [Bridge risk documentation](BRIDGE_RISK_DOCUMENTATION.md)
- [Contract verification guide](CONTRACT_VERIFICATION_GUIDE.md)
- [Testnet deployment guide](TESTNET_DEPLOYMENT_GUIDE.md)
- [Audit checklist](AUDIT_CHECKLIST.md)
- [Public changelog](CHANGELOG_PUBLIC.md)

## Public code and example surfaces

Those code surfaces currently live in the source monorepo and are linked directly from this docs bundle:
- [Examples index](../examples/README.md)
- [Stripe credit top-up example](../examples/payment-integration/python_credit_topup.py)
- [Wallet connection example](../examples/wallet-connection/python_wallet_login.py)
- [Bridge contract docs](../contracts/bridge-bsc/README.md)
- [wACP contract source](../contracts/bridge-bsc/src/WACP.sol)
- [Bridge gateway contract source](../contracts/bridge-bsc/src/BridgeGateway.sol)

## What is intentionally not in this docs repo

Never publish here:
- private keys, mnemonics, webhook secrets, deploy tokens, or production `.env` data;
- bridge signer internals or hot-wallet operating procedures;
- private infrastructure/admin repos;
- abuse-sensitive thresholds or operator-only anti-fraud internals.

See also:
- [Security policy](../SECURITY.md)
- [Contributing](../CONTRIBUTING.md)
- [Code of conduct](../CODE_OF_CONDUCT.md)
- [Current monorepo status page](../STATUS.md)

## Why this split exists

The goal is simple: make ANCAP easier to audit, understand, and integrate without exposing the sensitive operator surface.

This landing page is generated into the export bundle by `scripts/export_ancap_docs.py`, so the future `ancap-docs` repo starts with a docs-focused front page instead of the full monorepo operations README.
