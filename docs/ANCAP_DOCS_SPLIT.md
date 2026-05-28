# ANCAP docs split plan (`ancap-docs`)

Status: active prep for the public docs repo split.

This document defines the first public-safe export bundle for the future `ancap-docs` repository so the repo can be created quickly once GitHub org/repo access is available.

## Goal

Create a clean, repeatable docs-only bundle that can seed a public `ancap-docs` repository without leaking private infrastructure, secrets, or operational internals.

## Seed bundle

The initial export should include:

- root governance/project files:
  - `README.md` (docs-repo landing page exported from `docs/ANCAP_DOCS_REPO_README.md`, not the monorepo operations README)
  - `LICENSE`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `CODE_OF_CONDUCT.md`
  - `.github/CODEOWNERS`
  - `.github/pull_request_template.md`
  - `.github/ISSUE_TEMPLATE/bug_report.md`
  - `.github/ISSUE_TEMPLATE/feature_request.md`
  - `.github/ISSUE_TEMPLATE/config.yml`
  - `MASTER_ROADMAP.md`
- public-facing status and open-source docs:
  - `docs/STATUS_MATRIX.md`
  - `docs/OPEN_SOURCE_GITHUB_TRANSPARENCY.md`
  - `docs/ANCAP_DOCS_REPO_BOOTSTRAP.md`
  - `docs/ANCAP_DOCS_LABEL_SEED.md`
  - `docs/ANCAP_DOCS_DISCUSSIONS_SEED.md`
  - `docs/VISION.md`
  - `docs/ARCHITECTURE_LAYERS.md`
  - `docs/PLAN_L0_TO_L3.md`
  - `docs/REPUTATION_2.md`
  - `docs/STAKING.md`
  - `docs/WHITEPAPER_PROJECT.md`
  - `docs/WHITEPAPER_ACP.md`
  - `docs/LEGAL_TERMS_TEMPLATE.md`
  - `docs/BRIDGE_RISK_DOCUMENTATION.md`
  - `docs/CONTRACT_VERIFICATION_GUIDE.md`
  - `docs/TESTNET_DEPLOYMENT_GUIDE.md`
  - `docs/AUDIT_CHECKLIST.md`
  - `docs/CHANGELOG_PUBLIC.md`

## Explicitly excluded

Do **not** export:

- `.env`, deploy secrets, API keys, mnemonics, private keys
- bridge signer private logic or hot-wallet operating procedures
- server credentials and internal infrastructure notes
- abuse-sensitive thresholds or internal anti-fraud/operator runbooks
- `Sicret/`, `infra/`, and private deployment material unless reviewed and sanitized separately

## Repeatable export

Use:

```bash
python scripts/export_ancap_docs.py --target <path-to-export-dir> --clean
```

The script copies the approved public-safe files, exports a docs-focused root `README.md` from `docs/ANCAP_DOCS_REPO_README.md`, includes the public-safe GitHub issue/PR templates needed for a contributor-ready docs repo, ships a baseline `.github/CODEOWNERS` seed so review routing does not need to be improvised on first push, ships `docs/ANCAP_DOCS_REPO_BOOTSTRAP.md` so the first public repo push has a documented creation/settings/labels/Discussions checklist, ships `docs/ANCAP_DOCS_LABEL_SEED.md` so the initial public label taxonomy is explicit and reusable, ships `docs/ANCAP_DOCS_DISCUSSIONS_SEED.md` so the initial Discussions categories/moderation lanes are explicit and reusable too, rewrites links that point outside the export bundle to the source monorepo on GitHub, validates that the standalone bundle has no broken relative Markdown links, and writes `EXPORT_MANIFEST.md` into the target bundle.

## Current blocker

The public GitHub org / repo creation step is still external. Current checks from this cron run show:

- `https://github.com/ANCAP` resolves to an existing unrelated GitHub user profile (`ancap`)
- `https://github.com/ancap-network` returns GitHub 404
- `gh api orgs/ANCAP` and `gh api orgs/ancap-network` both fail with `admin:org` scope requirement in the current auth context
- `gh repo view dragoncattrx-hub/ancap-docs` reports the repo does not currently exist

So the split can be prepared in-repo now, but the actual org/repo creation still needs the right GitHub account/scope and final ownership decision.

## Done definition for this prep slice

This prep slice is complete when:

1. the export set is documented,
2. the export command is scripted and repeatable,
3. tests lock the bundle contents, link-rewrite behavior, and safety boundaries,
4. the future repo can be created from the generated bundle without manual scavenging through the monorepo,
5. contributor-facing issue/PR templates are already present in the exported seed instead of needing a second manual copy step,
6. a baseline public-safe `.github/CODEOWNERS` file is exported so review routing starts from an explicit default instead of memory,
7. exported Markdown stays navigable as a standalone docs repo seed instead of shipping broken in-bundle relative links,
8. the bundle root opens with a docs-focused landing page instead of the full monorepo/operator README,
9. the future repo bootstrap steps (initial push, baseline settings, labels, Discussions enablement) are documented inside the exported bundle instead of living only in cron notes,
10. the initial public label taxonomy is exported as a reusable seed instead of being recreated ad hoc during repo setup,
11. the initial GitHub Discussions category model is exported as a reusable seed instead of being improvised at repo launch.
