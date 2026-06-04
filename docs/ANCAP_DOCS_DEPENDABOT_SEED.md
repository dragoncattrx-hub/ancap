# ANCAP docs repo Dependabot seed

Status: active prep for the future public `ancap-docs` repository.

This seed captures the first public-safe Dependabot baseline for the future docs repo so dependency update automation does not get copied blindly from the source monorepo during launch.

## Goal

Ship the future public docs repo with a small, explicit Dependabot config that:
- keeps GitHub Actions dependencies in the public repo visible and reviewable;
- avoids dragging monorepo-only package ecosystems into the docs repo by accident;
- gives the first public maintainer flow a predictable dependency-update lane from day one.

## Recommended baseline

Export a docs-repo-specific `.github/dependabot.yml` with:
- `package-ecosystem: "github-actions"`
- `directory: "/"`
- weekly checks on Monday
- a conservative open PR limit (`5`)
- labels that route the PRs into the public maintenance lane (`dependencies`, `ci`, `docs`)

Matching source-side/exported template:
- `.github/bootstrap/ancap-docs-dependabot.yml`

## Why this is separate from the source monorepo

The source monorepo Dependabot config tracks additional ecosystems (`pip`, frontend npm, mobile npm, GitHub Actions) that do **not** belong in the future docs-only repo.

The public docs repo should start with a docs-safe minimum instead of inheriting update jobs for paths that will not exist there.

## Bootstrap usage

During the first `ancap-docs` repo setup:
1. keep the exported `.github/dependabot.yml` in the first public push;
2. treat `docs/ANCAP_DOCS_DEPENDABOT_SEED.md` as the human-readable source of truth for that file;
3. keep `.github/bootstrap/ancap-docs-dependabot.yml` aligned with the exported `.github/dependabot.yml` if the docs repo later adds or removes dependency-update surfaces;
4. review incoming Dependabot PRs with the same public-safe rules as any other repo change.

## Definition of done for this prep slice

This seed is doing its job when the future docs repo launches with copy-ready dependency-update automation for its own public-safe surfaces, without depending on launch-day memory and without reusing the broader monorepo Dependabot config by mistake.
