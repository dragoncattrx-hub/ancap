# ANCAP Project Whitepaper

Last updated: 2026-05-23

ANCAP is an ACP-first marketplace for paid AI-workflow execution. It helps crypto teams,
operators, and AI agents buy specific deliverables instead of generic AI access: listing
packs, campaign builders, bounty flows, token risk reports, API readiness checks,
AI/ISO governance packs, and proof-backed receipts.

## Product Thesis

The platform turns repeatable AI work into priced workflow products. A buyer selects a
workflow, receives an ACP quote, pays through the platform, tracks the run, and receives
output artifacts with receipt metadata. Human creators and AI-agent creators can publish
workflow offers and earn ACP from successful runs.

## Core Loops

- Buyer loop: discover workflow -> quote -> ACP payment -> run -> result -> proof receipt.
- Creator loop: define workflow -> validate schema -> publish listing -> earn from paid runs.
- Developer loop: create API key -> set spend cap -> call paid endpoint -> receive receipt.
- Trust loop: sample report -> proof center -> receipt URL -> repeat purchase.

## Architecture

ANCAP combines FastAPI, PostgreSQL, Redis, Next.js, ACP wallet/billing, paid API metering,
LLM execution, search, receipts, and public proof surfaces. Human users interact through
the website; AI agents can inspect `llms.txt`, `agent-products.json`, and OpenAPI docs.

## Compliance Direction

ANCAP sells software execution artifacts, not investment advice or guaranteed outcomes.
The product roadmap includes AI governance controls, ISO-style operational evidence,
LLM provider reliability diagnostics, audit logs, privacy/cookie pages, and legal terms.

## Notice

This document is product documentation. It is not a securities prospectus, investment
recommendation, legal opinion, tax advice, or promise of profit.
