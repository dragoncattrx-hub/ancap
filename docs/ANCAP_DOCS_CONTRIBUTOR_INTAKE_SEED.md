# ANCAP docs repo contributor intake seed

Status: active prep for the future public `ancap-docs` repository.

This seed captures the first contributor-facing issue / PR intake lanes for the future public docs repo so launch-day community workflow does not depend on memory or ad-hoc template edits.

## Goal

Ship the future public docs repo with a small, public-safe intake baseline that:
- keeps bug reports, feature requests, and PR review expectations predictable;
- routes security disclosures away from public issue threads;
- keeps contributor prompts aligned with the public label/domain taxonomy.

## Included contributor surfaces

### Issue templates

Keep these files in the first public push:
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/config.yml`

Recommended baseline:
- **Bug report**
  - default label: `bug`
  - asks for summary, repro steps, expected vs actual behavior, environment, and evidence
  - explicitly warns contributors not to include secrets, private keys, mnemonics, tokens, or production credentials
- **Feature request**
  - default label: `enhancement`
  - asks for summary, problem, proposed solution, and affected scope
  - scope options stay aligned with the public docs repo surfaces: `docs`, `frontend`, `backend`, `mobile`, `sdk`, `contracts`, `security`
- **Issue config / contact link**
  - allows blank issues when needed
  - routes security reports to the private GitHub security reporting surface instead of public Issues

### Pull request template

Keep `.github/pull_request_template.md` in the first public push.

Recommended baseline checklist:
- tests / typecheck / build run locally when relevant
- docs updated if needed
- no secrets or sensitive infra details added
- roadmap/status docs updated if execution truth changed

## Why this matters

The public docs repo should not launch with contributor workflow metadata scattered across templates only. This seed gives maintainers one human-readable place to verify that:
- issue labels and scope prompts still match the public docs taxonomy;
- security disclosures are routed out of public threads;
- PR review expectations still reflect ANCAP's public-safe rules.

## Bootstrap usage

During the first `ancap-docs` repo setup:
1. keep the exported issue templates and PR template in the initial public push;
2. treat this file as the human-readable source of truth for those contributor-intake lanes;
3. keep `.github/bootstrap/ancap-docs-contributor-intake.json` aligned with this file when the templates change;
4. if new public contributor lanes are added later, update the templates, this seed, and the bootstrap JSON together.

## Definition of done for this prep slice

This seed is doing its job when the future docs repo starts with explicit, public-safe issue/PR intake defaults, security-report routing is not improvised in public, and the contributor workflow can be reviewed without diffing template files by hand.