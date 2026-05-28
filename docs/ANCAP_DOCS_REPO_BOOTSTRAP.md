# ANCAP docs repo bootstrap checklist

Status: active prep for the future public `ancap-docs` repository.

This checklist turns the in-repo export bundle into a predictable first public repo setup once GitHub ownership/access is available.

## Goal

Create the public docs repo quickly without improvising repo settings, contributor surfaces, or security/trust baseline steps.

## Preconditions

Before creating the repo, confirm:

- the final owner/name decision is made (`ANCAP`, `ancap-network`, or another approved fallback);
- the current export bundle is generated with `python scripts/export_ancap_docs.py --target <path> --clean`;
- the generated bundle was spot-checked for public-safe scope (`EXPORT_MANIFEST.md`, root `README.md`, governance files, docs links);
- no private infra notes, secrets, or operator-only runbooks were added to the export set.

## Repo creation sequence

1. Create a new public GitHub repo for `ancap-docs` under the chosen owner.
2. Prefer creating it empty so the exported bundle can become the first real repo state without merge noise.
3. Copy the generated export bundle into a clean working directory.
4. Commit and push the exported files as the initial public-safe docs seed.
5. Verify that the root `README.md` is the docs-focused landing page, not the monorepo operations README.

## GitHub settings baseline

After the first push:

- set the repo description to a docs/trust/integration summary rather than an operator/internal description;
- add the project homepage (`https://ancap.cloud/`) if the public launch scope still points there;
- enable branch protection on the default branch;
- enable secret scanning and push protection if available for the owner/account plan;
- keep the repo docs-only unless a later approved split intentionally adds more public-safe assets.

## Community baseline

The exported seed already includes contributor-safe issue/PR templates and a baseline `.github/CODEOWNERS` file. After repo creation, also:

- review `.github/CODEOWNERS` and replace the single-maintainer fallback with org teams or additional maintainers once the final GitHub owner/team structure exists;
- enable GitHub Discussions for ideas and technical questions using `docs/ANCAP_DOCS_DISCUSSIONS_SEED.md` as the initial category/pinning/moderation baseline;
- seed the baseline labels from `docs/ANCAP_DOCS_LABEL_SEED.md` so the first public issue taxonomy matches the roadmap/community model:
  - `good first issue`
  - `help wanted`
  - `security`
  - `wallet`
  - `bridge`
  - `docs`
  - `sdk`
  - `contracts`
  - `frontend`
- verify that issue forms/templates render without asking contributors for secrets or private infrastructure details.

## Post-push verification

Before calling the repo bootstrap complete, verify:

- the root `README.md` renders correctly on GitHub;
- the exported docs bundle has no broken relative links;
- source-monorepo fallback links open correctly for files intentionally kept outside `ancap-docs`;
- `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, and `CODE_OF_CONDUCT.md` are visible at repo root;
- issue templates, PR template, baseline CODEOWNERS routing, and Discussions are live;
- the repo still contains only public-safe material.

## Definition of done for the bootstrap guide

This guide is doing its job when repo creation no longer depends on memory or ad-hoc setup choices: the initial push order, baseline settings, labels, and community surfaces are all documented in one public-safe place.
