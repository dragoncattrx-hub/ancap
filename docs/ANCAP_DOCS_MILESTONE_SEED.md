# ANCAP docs repo milestone seed

Status: active prep for the future public `ancap-docs` repository.

This file captures the initial milestone model for the future public docs repo so roadmap work and public progress updates do not start from an empty milestone list.

## Goal

Seed the future docs repo with a small, public-safe milestone baseline that matches the roadmap/community model and can anchor release notes, changelog slices, and public progress tracking.

## Recommended initial milestones

### 1. `Docs repo bootstrap`
Use for:
- first public repo push
- governance file verification
- issue/PR template verification
- CODEOWNERS review-routing verification
- Discussions / labels / project-board setup

### 2. `Trust and audit docs baseline`
Use for:
- bridge risk documentation updates
- contract verification guidance
- testnet deployment instructions
- audit checklist maintenance
- security-policy / disclosure wording updates

### 3. `Roadmap and status sync`
Use for:
- `MASTER_ROADMAP.md` public-safe sync work
- `docs/STATUS_MATRIX.md` truth reconciliation
- changelog / release-note alignment
- transparency wording and source-of-truth cleanup

### 4. `Integration docs and examples`
Use for:
- public SDK/API documentation
- example links and walkthroughs
- wallet integration examples
- payment / Smart QR public documentation

## Application notes

- Keep the first milestone set intentionally small; the goal is predictable public tracking, not milestone sprawl.
- Prefer milestones that group user-visible progress, not internal operator chores.
- Do **not** create milestones for private infra, signer operations, or secret-handling work in this public repo.
- Use milestones together with labels: milestone = progress bucket, label = domain/type.

## Bootstrap usage

During the first `ancap-docs` repo setup:

1. Create the milestone set above in GitHub.
2. Map the first imported/public issues into the smallest correct milestone.
3. Keep the `Docs repo bootstrap` milestone open only until the first public repo setup, labels, Discussions, and project board are actually live.
4. Use milestone names consistently in release notes and monthly development updates, following `docs/ANCAP_DOCS_UPDATE_CADENCE_SEED.md`.

## Definition of done for this prep slice

This seed is doing its job when the future docs repo can open with a sane first milestone model, public progress can be grouped without improvisation, and contributor-facing updates do not depend on someone remembering the initial taxonomy from chat history.
