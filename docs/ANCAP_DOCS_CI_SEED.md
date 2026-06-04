# ANCAP docs repo CI seed

Status: active prep for the future public `ancap-docs` repository.

Path in the public docs seed/export bundle: `docs/ANCAP_DOCS_CI_SEED.md`.

This file captures the first public-safe CI workflow shape for the future docs repo so default branch protection does not depend on guessed or undocumented status-check names.

## Goal

Ship the future public docs repo with a lightweight CI baseline that:
- validates the exported docs bundle structure;
- catches broken in-bundle relative Markdown links;
- validates the machine-readable bootstrap seeds still parse cleanly;
- creates a predictable default GitHub status-check context for branch protection.

## Recommended workflow

Workflow name:
- `Docs CI`

Workflow file in the exported public repo:
- `.github/workflows/docs-ci.yml`

Matching source-side/exported bootstrap template:
- `.github/bootstrap/ancap-docs-ci-workflow.yml`

Recommended first job:
- job id/name: `docs-bundle`
- expected status-check context: `Docs CI / docs-bundle`

## What the workflow should validate

At minimum, validate:
- required root docs/governance files exist (`README.md`, `MASTER_ROADMAP.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`);
- public trust/bootstrap docs still exist (`docs/STATUS_MATRIX.md`, `docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md`, `docs/ANCAP_DOCS_SPLIT.md`, `docs/ANCAP_DOCS_REPO_BOOTSTRAP.md`, and the label/Discussions/milestone/project-board/repo-settings/update-cadence/CI/Dependabot seed docs);
- contributor surfaces still exist (`.github/CODEOWNERS`, issue templates, PR template);
- machine-readable bootstrap seeds under `.github/bootstrap/` still parse;
- `.github/bootstrap/ancap-docs-ci-workflow.yml` stays structurally aligned with `.github/workflows/docs-ci.yml` so exported workflow logic cannot silently drift, while version-only GitHub Actions bumps may differ until the bootstrap template is refreshed;
- when the checked repo is the exported docs bundle, `.github/bootstrap/ancap-docs-dependabot.yml` stays byte-for-byte aligned with the exported public `.github/dependabot.yml` so the docs-repo Dependabot seed/template cannot silently drift either;
- relative Markdown links inside the exported repo resolve without depending on local monorepo paths.

## Branch-protection usage

Use this seed together with:
- `docs/ANCAP_DOCS_REPO_BOOTSTRAP.md`
- `docs/ANCAP_DOCS_REPO_SETTINGS_SEED.md`
- `docs/ANCAP_DOCS_DEPENDABOT_SEED.md`
- `.github/bootstrap/ancap-docs-repo-settings.json`
- `.github/bootstrap/ancap-docs-ci.json`
- `.github/bootstrap/ancap-docs-ci-workflow.yml`
- `.github/bootstrap/ancap-docs-dependabot.yml`
- `scripts/bootstrap_ancap_docs_repo.py`

Recommended apply path once the public repo exists:
1. if needed for the first launch, create the empty public repo via `python scripts/bootstrap_ancap_docs_repo.py --repo <owner>/ancap-docs --apply --create-repo`;
2. push the exported bundle including `.github/workflows/docs-ci.yml`;
3. let `Docs CI` run at least once so the workflow is visible in the public repo;
4. apply repo settings / labels / milestones via `python scripts/bootstrap_ancap_docs_repo.py --repo <owner>/ancap-docs --apply`;
5. apply the default branch-protection payload via `python scripts/bootstrap_ancap_docs_repo.py --repo <owner>/ancap-docs --apply --apply-branch-protection --status-check-context <context>`.

The workflow drift guard is intentionally context-aware: inside the source monorepo, `.github/dependabot.yml` keeps its broader multi-ecosystem config, but inside the exported docs bundle the shipped `.github/dependabot.yml` must match `.github/bootstrap/ancap-docs-dependabot.yml` byte-for-byte.

If the public repo later changes workflow/job names, update this file, `.github/bootstrap/ancap-docs-ci.json`, and `.github/bootstrap/ancap-docs-repo-settings.json` together so the default required-check context stays explicit.

## Definition of done for this prep slice

This seed is doing its job when the future public docs repo has a copy-ready CI workflow, the matching exported workflow template stays available next to the machine-readable CI metadata and remains structurally aligned with the shipped workflow even if a GitHub Actions version-only bump lands first in `.github/workflows/docs-ci.yml`, the docs-repo Dependabot template stays byte-for-byte aligned with the exported public `.github/dependabot.yml`, the default status-check context is documented instead of guessed, the workflow validates the full bootstrap seed surface instead of only a partial subset, and branch protection can be applied from checked-in seed data without launch-day JSON hand editing.
