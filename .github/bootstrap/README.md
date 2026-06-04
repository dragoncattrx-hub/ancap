# ANCAP docs bootstrap seeds

These files are machine-readable bootstrap metadata and setup seeds for the future public `ancap-docs` repository.

They exist so the first public repo setup can be scripted or batch-applied instead of recreated from memory.

## Files

- `ancap-docs-contributor-intake.json` — initial issue/PR intake lanes, security-report routing, and verification checklist metadata
- `ancap-docs-labels.json` — initial public label taxonomy
- `ancap-docs-milestones.json` — initial public milestone taxonomy
- `ancap-docs-discussions.json` — initial Discussions categories, moderation notes, and copy-ready pinned-topic text
- `ancap-docs-project-board.json` — initial public roadmap board fields/views/filters
- `ancap-docs-initial-issues.json` — initial public-safe starter issue backlog mapped to labels, milestones, and suggested board fields
- `ancap-docs-repo-settings.json` — initial repo metadata, feature toggles, branch-protection, and security baseline
- `ancap-docs-update-cadence.json` — initial public update and release-note cadence plus copy-ready starter templates
- `ancap-docs-ci.json` — initial Docs CI workflow metadata, expected status-check contexts, and branch-protection alignment seed
- `ancap-docs-ci-workflow.yml` — exported source-side template for the public `.github/workflows/docs-ci.yml` workflow referenced by the CI seed
- `ancap-docs-dependabot.yml` — docs-repo-specific Dependabot template for the exported public `.github/dependabot.yml`

## Human-readable source docs

These JSON seeds should stay aligned with:
- `docs/ANCAP_DOCS_CONTRIBUTOR_INTAKE_SEED.md`
- `docs/ANCAP_DOCS_LABEL_SEED.md`
- `docs/ANCAP_DOCS_MILESTONE_SEED.md`
- `docs/ANCAP_DOCS_DISCUSSIONS_SEED.md`
- `docs/ANCAP_DOCS_PROJECT_BOARD_SEED.md`
- `docs/ANCAP_DOCS_INITIAL_ISSUES_SEED.md`
- `docs/ANCAP_DOCS_REPO_SETTINGS_SEED.md`
- `docs/ANCAP_DOCS_UPDATE_CADENCE_SEED.md`
- `docs/ANCAP_DOCS_CI_SEED.md`
- `docs/ANCAP_DOCS_DEPENDABOT_SEED.md`
- `docs/ANCAP_DOCS_REPO_BOOTSTRAP.md`

## Rule

If any launch-time value changes in one of the Markdown docs, update the corresponding JSON seed too.
