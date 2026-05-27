# Open Source & GitHub Transparency

ANCAP is moving toward a GitHub-first model where public-safe components are easier to audit, integrate, review, and contribute to.

## Positioning

**ANCAP will be open-source where transparency increases trust, integration and adoption — while security-critical infrastructure, private keys, bridge signer operations, wallet hot-key logic and production secrets remain protected.**

## Goals

- increase trust in ACP / wACP
- make the project more publicly verifiable
- simplify developer integrations
- attract open-source contributors
- prepare better for audits, grants, listings, and partnerships

## Public-safe scope

### Documentation
- roadmap
- architecture docs
- tokenomics docs
- ACP / wACP explanation
- bridge concept docs
- wallet feature docs
- security model
- API overview
- QR Pay / Smart QR Pay specs

### Frontend
- public website
- wallet UI without secrets
- landing pages
- docs UI

### SDK / integrations
- TypeScript SDK
- API client
- examples
- payment QR parser
- wallet integration examples

### Contracts / protocol surfaces
- wACP contract source
- bridge-related public contracts
- verification scripts
- testnet deployment instructions
- conversion rules
- reserve/backing explanation
- receipt / payment intent models

## Private scope

Never publish:
- private keys
- seed phrases / mnemonics
- bridge signer internals
- admin wallets
- production `.env`
- real RPC/API credentials
- deploy tokens/secrets
- hot-wallet operational logic
- internal server credentials
- abuse-sensitive thresholds that materially help attackers

## Target repository structure

Public target repos:
- `ancap-docs`
- `ancap-web`
- `ancap-wallet`
- `ancap-sdk`
- `ancap-contracts`
- `ancap-examples`
- `ancap-core`

Private target repos:
- `ancap-infra`
- `ancap-bridge-operator`
- `ancap-admin`

## Licensing direction

Recommended default:
- Apache-2.0 for protocol/core/SDK/contracts
- MIT for frontend/examples when easier adoption matters
- CC BY 4.0 or Apache-2.0 for docs depending on repo split

Current repo default: Apache-2.0.

## GitHub baseline

Repository baseline should include:
- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- issue templates
- PR template
- CodeQL
- Dependabot
- secret scanning
- push protection
- branch protection

## Why this matters

GitHub should become public proof that ANCAP is a real technical project, not just a token or a landing page.

People should be able to inspect:
- active roadmap progress
- code changes
- releases
- protocol and contract documentation
- integration examples
- security posture
- audit readiness

## Current publishable surfaces already in repo

Examples:
- `examples/payment-integration/python_credit_topup.py`
- `examples/wallet-connection/python_wallet_login.py`

Public contract sources:
- `contracts/bridge-bsc/src/WACP.sol`
- `contracts/bridge-bsc/src/BridgeGateway.sol`

Supporting contract docs:
- `contracts/bridge-bsc/README.md`
- `docs/bridge-spec-v1.md`
- `docs/bridge-pilot-mainnet.md`
- `docs/BRIDGE_RISK_DOCUMENTATION.md`
- `docs/CONTRACT_VERIFICATION_GUIDE.md`
- `docs/TESTNET_DEPLOYMENT_GUIDE.md`
- `docs/AUDIT_CHECKLIST.md`
- `docs/CHANGELOG_PUBLIC.md`
