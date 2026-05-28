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

## `ancap-docs` split prep

The future public docs repo now has an in-repo seed plan and repeatable export path:

- split plan: `docs/ANCAP_DOCS_SPLIT.md`
- repo bootstrap guide: `docs/ANCAP_DOCS_REPO_BOOTSTRAP.md`
- export script: `scripts/export_ancap_docs.py`
- standalone-bundle hardening: exported Markdown now rewrites out-of-bundle links to the source monorepo on GitHub, fails export if broken relative links remain inside the bundle, uses a docs-focused root `README.md` generated from `docs/ANCAP_DOCS_REPO_README.md` instead of the monorepo operations landing page, carries the public-safe GitHub issue/PR templates needed for a contributor-ready docs repo seed, and now also ships the bootstrap checklist for the first public repo push / settings / labels / Discussions setup
- CI guard: Backend CI now reruns the export/public-trust regression slice whenever the docs-split bundle inputs or guard tests change, so the future `ancap-docs` seed cannot silently drift

That prep exists so the public `ancap-docs` repository can be created quickly once GitHub org/repo ownership and account scope are available, without shipping a docs seed full of dead local links.
