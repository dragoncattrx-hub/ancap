# ANCAP docs repo update cadence seed

Status: active prep for the future public `ancap-docs` repository.

This file captures the initial public update and release-note cadence for the future docs repo so progress communication does not start as an improvised afterthought.

## Goal

Keep the future public docs repo visibly alive with a small, repeatable communication rhythm tied to roadmap truth, changelog updates, and release-note hygiene.

## Recommended cadence

### 1. Monthly development update
Publish one concise public update each month in GitHub Discussions `Announcements` or an equivalent public surface if Discussions is unavailable.

Include:
- what shipped since the last update;
- what is currently in progress;
- honest blockers or external dependencies;
- what is next on the roadmap;
- links to `MASTER_ROADMAP.md`, `docs/STATUS_MATRIX.md`, and `docs/CHANGELOG_PUBLIC.md`.

Suggested starter template:

```md
# Monthly development update — <month year>

## Headline
<one sentence about what moved>

## Shipped
- <2-5 bullets>

## In progress
- <1-3 bullets>

## Blockers / external dependencies
- <only real blockers>

## Next up
- <next roadmap focus>

## Links
- Roadmap: `MASTER_ROADMAP.md`
- Status matrix: `docs/STATUS_MATRIX.md`
- Public changelog: `docs/CHANGELOG_PUBLIC.md`
- Relevant docs: <link only what changed>
```

### 2. Release notes for tagged or milestone-level updates
Publish release notes whenever a public tag, docs-baseline milestone, or major trust/integration slice ships.

Keep them short and structured:
- scope of the release;
- user-visible docs/trust changes;
- compatibility or verification notes if relevant;
- links to deeper docs/changelog entries.

Suggested starter template:

```md
# Release notes — <tag or milestone>

## Headline
<one sentence about the shipped slice>

## Scope
- <what this release covers>

## User-visible docs / trust changes
- <2-5 bullets>

## Compatibility / verification notes
- <only if relevant>

## Links
- Public changelog: `docs/CHANGELOG_PUBLIC.md`
- Roadmap: `MASTER_ROADMAP.md`
- Status matrix: `docs/STATUS_MATRIX.md`
- Deep links: <specific docs>
```

### 3. Trust-surface change notice
When public trust boundaries materially change, publish a short note that points people to the updated source docs.

Typical triggers:
- security-policy wording changes;
- bridge-risk model changes;
- contract verification guidance changes;
- public/private scope boundary changes for future repo splits.

Suggested starter template:

```md
# Trust-surface update — <date or short label>

## What changed
- <brief change summary>

## Why it matters
- <why contributors/users should care>

## Updated docs
- <direct links to changed docs>
```

## Suggested structure

Use this lightweight format for monthly updates and release notes:

1. **Headline** — one sentence about what moved
2. **Shipped** — 2-5 bullets
3. **In progress** — 1-3 bullets
4. **Blockers / external dependencies** — only if real
5. **Next up** — next honest roadmap focus
6. **Links** — roadmap, status matrix, changelog, relevant docs

## Application notes

- Prefer one clear public update over many noisy fragments.
- Keep public updates aligned with `MASTER_ROADMAP.md`; do not claim whole-project completion when only a slice shipped.
- Name milestones consistently between release notes, changelog entries, and roadmap/status updates.
- Do **not** include secrets, private infra details, signer operations, or operator-only incident handling in public update posts.

## Bootstrap usage

During the first `ancap-docs` repo setup:

1. Enable or confirm the `Announcements` Discussions category if GitHub Discussions is available.
2. Use this seed for the first monthly development update post.
3. Reuse the same structure for the first tagged release note or milestone-summary post.
4. Use the starter templates in this file or `.github/bootstrap/ancap-docs-update-cadence.json` so launch-time posts do not have to be drafted from memory.
5. Keep `docs/CHANGELOG_PUBLIC.md` and public update posts in sync when a user-visible docs/trust slice ships.

## Definition of done for this prep slice

This seed is doing its job when the future docs repo has a predictable public communication rhythm, release-note structure does not depend on memory, and maintainers have copy-ready starter templates instead of improvising every first post from scratch.
