# Contributing to ANCAP

ANCAP is moving toward a GitHub-first open-source model for public-safe components.

## Before you contribute

Read first:
- `README.md`
- `STATUS.md`
- `MASTER_ROADMAP.md`
- `docs/STATUS_MATRIX.md`
- `SECURITY.md`

## Core rules

- Truth over hype: do not mark something done unless it is actually verified.
- Fix until it works: if a test/build/deploy fails, investigate the real cause.
- Do not commit secrets, keys, mnemonics, `.env`, or production credentials.
- Keep changes scoped. Avoid unrelated drive-by rewrites in the same PR.
- If a change affects roadmap/status truth, update `MASTER_ROADMAP.md` first.

## Development flow

1. Fork or branch from the default branch.
2. Make a focused change.
3. Run the relevant checks locally.
4. Update docs/tests with the code change.
5. Open a pull request with a clear summary and verification notes.

## Verification expectations

Examples:
- Backend: targeted `pytest` or full suite when needed.
- Frontend: targeted Playwright / build / typecheck when UI changes.
- Mobile: typecheck/build/test slice relevant to the touched area.
- Deploy changes: include exact verification evidence, not assumptions.
- Runtime dependency changes: update `requirements.in`, regenerate `requirements.txt` from a Linux-compatible Python 3.11 environment (for example the repo Docker/Python base image) with `python -m piptools compile --generate-hashes --output-file requirements.txt requirements.in`, and keep packaging metadata aligned via `pyproject.toml`.

## Pull request checklist

- [ ] Change is scoped and explained
- [ ] Tests/build/typecheck relevant to the change were run
- [ ] Docs updated if behavior/positioning changed
- [ ] No secrets or sensitive infra details were added
- [ ] Roadmap/status docs updated if execution truth changed

## What should not be contributed publicly

Do not open public PRs containing:
- private keys
- seed phrases
- bridge signer internals
- hot-wallet operational logic
- production `.env` values
- deploy tokens
- server credentials
- abuse-sensitive anti-fraud internals

## Discussions / issues

Use GitHub Issues for bugs and feature requests. Use Discussions for broader design questions once enabled.
