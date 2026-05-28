# ANCAP docs repo label seed

Status: active prep for the future public `ancap-docs` repository.

This file captures the initial GitHub label set for the public docs repo so the first maintainer setup does not have to reconstruct the roadmap/community taxonomy from memory.

## Goal

Seed the future docs repo with a small, contributor-friendly label baseline that matches the public roadmap/community model.

## Recommended labels

| Label | Purpose | Suggested color |
|---|---|---|
| `good first issue` | Small, approachable tasks for new contributors | `7057ff` |
| `help wanted` | Useful open work where external help is welcome | `008672` |
| `docs` | Documentation fixes, additions, and wording work | `0e8a16` |
| `security` | Security-policy, disclosure, and trust-surface work | `b60205` |
| `bridge` | Bridge docs, risk notes, and verification guidance | `d93f0b` |
| `wallet` | Wallet-facing public docs and UX guidance | `1d76db` |
| `sdk` | SDK/integration-facing documentation work | `5319e7` |
| `contracts` | Public contract docs, verification, and ABI/source guidance | `fbca04` |
| `frontend` | Public website/docs UI surfaces and content structure | `c5def5` |

## Application notes

- Keep the first label pass intentionally small; more labels can be added later when the public issue volume justifies them.
- Prefer descriptive issue titles over label sprawl.
- Do **not** create private-ops labels in this public repo for infrastructure, secrets, abuse controls, or signer operations.
- If GitHub Discussions is enabled, use labels for actionable issue routing and keep broader design conversations in Discussions.

## Bootstrap usage

During the first `ancap-docs` repo setup:

1. Create the labels above in GitHub.
2. Confirm the exported issue templates point to the matching public-safe areas.
3. Use `docs` + one domain label (`bridge`, `wallet`, `sdk`, `contracts`, `frontend`, `security`) when an issue spans both content work and a specific surface.
4. Reserve `good first issue` for tasks that are genuinely scoped, public-safe, and low-context.

## Definition of done for this prep slice

This seed is doing its job when the future repo can be opened to contributors with a sane initial label taxonomy and without inventing public workflow metadata ad hoc during repo creation.
