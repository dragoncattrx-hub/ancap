# ANCAP docs repo project board seed

Status: active prep for the future public `ancap-docs` repository.

This file captures the first public roadmap-board shape for the future docs repo so maintainers do not have to improvise columns, views, or field usage during launch.

## Goal

Start the public docs repo with a lightweight board that makes roadmap progress visible without turning a docs repo into a private ops tracker.

## Recommended board

Name:
- `ANCAP Docs Roadmap`

Scope:
- public-safe docs work only
- roadmap/status/trust/integration tasks suitable for GitHub Issues
- no private infra, signer, secret-handling, or operator-only tasks

## Suggested fields

### Status
Recommended options:
- `Inbox`
- `Ready`
- `In progress`
- `Review`
- `Done`

### Area
Recommended options:
- `docs`
- `security`
- `bridge`
- `wallet`
- `sdk`
- `contracts`
- `frontend`

### Milestone
Use the seeded milestones from `docs/ANCAP_DOCS_MILESTONE_SEED.md`.

### Priority
Keep it simple:
- `P1`
- `P2`
- `P3`

## Suggested views

### 1. `Board`
Main day-to-day view grouped by `Status`.

### 2. `By milestone`
Table or board grouped by `Milestone` so public progress maps cleanly onto release notes and monthly updates from `docs/ANCAP_DOCS_UPDATE_CADENCE_SEED.md`.

### 3. `Good first issues`
Filtered view for:
- label `good first issue`
- status not `Done`

### 4. `Trust / audit docs`
Filtered view for:
- area `security` or `bridge`
- status not `Done`

## Bootstrap usage

During the first `ancap-docs` repo setup:

1. Create the board after labels, milestones, and Discussions are enabled.
2. Add the suggested fields above.
3. Import or create the first public issues and place them into the correct milestone.
4. Keep the board public-facing and contributor-readable.
5. Do not mirror private operator execution work into this board.

## Definition of done for this prep slice

This seed is doing its job when the future docs repo can expose a sane first public roadmap board, contributors can understand how issues move, and maintainers do not need to invent the initial board model from scratch at repo launch.
