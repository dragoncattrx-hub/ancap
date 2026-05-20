# ANCAP Monetization-First Roadmap

## Thesis

ANCAP should stop presenting itself mainly as an abstract AI/Web3 showcase and move toward a product that directly sells useful AI-driven crypto workflows, machine-readable proofs, and agent-to-agent paid execution.

Core formula:

**AI task -> crypto payment -> verified result -> receipt/proof -> repeat run / subscription / marketplace fee**

This keeps ANCAP in the safer zone of selling software and AI services for crypto teams and agents, instead of drifting into promises of investment returns or regulated financial products.

---

## Primary Goal

Launch the first revenue loop without GPU dependence:

1. User selects a workflow.
2. User sees price in ACP equivalent and can pay in ACP / wACP.
3. ANCAP executes a structured workflow.
4. User receives preview or full result.
5. ANCAP stores receipt, cost, status, and proof.
6. User can repeat the run, subscribe, or buy a package.

---

## Product Positioning Shift

### Move away from
- generic "AI-native capital allocation" landing language
- vague ecosystem/vision-first messaging
- marketplace abstraction before monetization exists
- low-conversion crypto ideology without concrete paid actions

### Move toward
- paid AI workflows for crypto projects
- treasury / payout / proof tooling
- listing and launch support
- agent wallet + spend controls
- paid API / MCP tooling for other agents
- proof center as trust layer

---

## Revenue Lines

### 1) Paid Workflow Runs
Examples:
- Token Listing Pack
- Crypto Launch Campaign Builder
- Telegram Growth Kit
- Airdrop / Bounty Builder
- Token Risk / Trust Report

Model:
- pay-per-run
- repeat-run discount
- subscription bundles
- enterprise packages

### 2) Campaign / Service Packages
Examples:
- 14-day launch campaign
- listing readiness package
- KOL outreach pack
- bounty campaign management

Model:
- setup fee
- campaign fee
- verification fee
- payout fee

### 3) Paid API / MCP / x402-style Agent Access
Examples:
- token risk check
- wallet risk score
- listing readiness
- campaign score
- bridge proof
- reserve status

Model:
- pay-per-call
- monthly pro plan
- enterprise limits
- marketplace/provider fee

### 4) Treasury / Payout B2B
Examples:
- payout review
- duplicate detection
- suspicious wallet detection
- approval logs
- monthly statements

Model:
- monthly plan
- per-payout fee
- premium audit logs
- custom policies

---

## MVP Scope (2-4 weeks)

## Week 1 - Money Rails + Paid Runs Foundation

### Frontend pages
- `/ai/workflows`
- `/ai/run/[template]`
- `/billing`
- `/wallet/credits`
- `/dashboard/runs`

### Backend capabilities
- workflow template registry
- create run endpoint
- cost calculation
- balance lock / reservation
- execute workflow run
- save result
- save receipt
- refund on failed run

### Data model
Create or extend entities for:
- `workflows`
- `workflow_runs`
- `run_costs`
- `credits_ledger`
- `payment_intents`
- `receipts`
- `audit_events`

### Deliverable
A signed-in user can buy and run a priced workflow and see status, result preview, and receipt.

---

## Week 2 - First 5 Sellable Workflows

### First workflow products
1. Token Listing Pack
2. Crypto Campaign Builder
3. Telegram Growth Kit
4. Airdrop / Bounty Builder
5. Token Risk Report

### Each workflow must include
- landing copy
- input form
- price
- estimated completion time
- output preview
- full result unlock
- receipt
- repeat run button

### Deliverable
ANCAP has at least 5 concrete monetizable workflow templates on the site.

---

## Week 3 - Earn / Bounty / Referral Loop

### Frontend pages
- `/earn`
- `/campaigns`
- `/referrals`
- `/partners`

### Capabilities
- proof upload / proof links
- reward pools
- payout queue
- manual approval
- suspicious user flags
- referral tracking

### Monetization
- campaign setup fee
- reward pool fee
- payout fee
- verification fee
- featured placement

### Deliverable
ANCAP can attract traffic through bounty/referral loops while taking campaign and verification fees.

---

## Week 4 - Agent / API Monetization

### Frontend pages
- `/developers`
- `/developers/pricing`
- `/developers/mcp`
- `/developers/receipts`

### Capabilities
- API keys
- paid endpoints
- MCP tool descriptions
- machine-readable receipts
- webhook callbacks
- x402-compatible architecture prep

### First paid API set
- `/token-risk-report`
- `/listing-readiness`
- `/bridge-proof`
- `/campaign-score`
- `/wallet-risk`
- `/market-report`

### Deliverable
Other agents and external systems can pay ANCAP for machine-readable checks and reports.

---

## Top Priority Features (P0 -> P2)

## P0
- Paid AI Workflow Store
- Billing / Credits / ACP / wACP support
- Run history + result + cost
- Token Listing Pack Generator
- Crypto Campaign Builder
- AI Bounty Builder
- Referral cabinet
- Treasury payout approvals
- Audit receipts
- Admin margin dashboard

## P1
- MCP server for ANCAP tools
- paid API endpoints
- agent wallet limits
- curated agent marketplace
- partner / KOL CRM
- proof of reserve page
- campaign payout verification
- provider dashboard

## P2
- enterprise workspace
- private workflows
- dedicated internal deployments

---

## Recommended First Product

## ANCAP AI Crypto Launch Suite

Initial bundle:
- Token Listing Pack
- Campaign Builder
- Telegram Growth Kit
- Bounty Builder
- KOL Outreach Pack
- Token Risk Report
- Proof / Receipt Center
- Referral / Partner Cabinet
- Treasury Payouts

Why this first:
- clear buyer profile: crypto teams
- immediate perceived value
- no GPU dependency required
- can be delivered with templates, rules, APIs, and proof artifacts
- naturally monetizes via runs, packages, and B2B tools

---

## Compliance / Positioning Constraints

Avoid for now:
- promises of yield or investment returns
- staking/yield products without legal basis
- trading signals framed as guaranteed profit
- open permissionless marketplace full of junk
- launchpad securities behavior
- casino / gambling mechanics
- pump tooling

Safer early positioning:
- software tools for crypto teams
- AI workflow execution
- marketing / launch / compliance-draft / listing support
- treasury / payout review / proof / reconciliation
- agent payments and spend controls

---

## Immediate Build Order Inside Current Repo

### Phase A - Landing and navigation shift
- update homepage copy toward paid workflows and proof-based execution
- add direct CTA to workflow catalog
- add monetization roadmap doc to repo

### Phase B - Frontend workflow store shell
- add `/ai/workflows`
- add workflow cards for the first 5 products
- add pricing and proof messaging

### Phase C - Backend monetization shell
- add workflow templates API
- add create-run API
- add run receipt response shape
- connect to existing runs / tasks / listings / referrals / wallet primitives where possible

### Phase D - Billing and execution primitives
- reserve credits
- record pricing and receipts
- add run status timeline

---

## Working Principle

Do not build another vague crypto front page.
Build revenue loops first, then deepen the protocol and agent economy behind them.

If a feature does not clearly support one of these loops, it is probably not first-priority:
- pay-per-run
- campaign/service package
- agent API payment
- treasury/payout fee

---

## Current Session Execution Plan

1. Write this roadmap into the repo.
2. Reposition the homepage toward paid AI workflows and proof-backed results.
3. Add a first workflow catalog page in the frontend.
4. Then wire the page into navigation and CTA flow.
5. After that, move to backend workflow-template endpoints.
