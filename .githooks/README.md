# Git hooks

Tracked local git hooks for repo-side safety checks.

## Install

Run from the repo root:

```bash
python scripts/install_git_hooks.py
# or on Windows hosts that only expose the Python launcher:
py -3 scripts/install_git_hooks.py
```

What it does:
- sets local `core.hooksPath` to `.githooks`
- enables the tracked `pre-commit` and `pre-push` hooks
- refuses to overwrite an existing custom `core.hooksPath` unless you pass `--force`
- refuses to point git at `.githooks` unless both tracked hook files are present, so a partial/local-only hook directory does not get silently enabled
- if `core.hooksPath` already points at `.githooks`, it leaves the config alone and only restores executable bits on the tracked hook files
- `python scripts/install_git_hooks.py --check` verifies that `core.hooksPath` already points at the tracked hooks (and, on non-Windows hosts, that the tracked hook files are executable) without mutating local git config
- on Windows hosts that only expose the launcher, use `py -3 scripts/install_git_hooks.py --check` for the same non-mutating verification

## Current hooks

- `.githooks/pre-commit` — resolves `python` first, then falls back to `python3`, then `py -3`, and runs `scripts/check_secret_hygiene.py --staged` so token-shaped secrets already in the git index are blocked before commit even if the working tree copy was cleaned later.
- `.githooks/pre-push` — resolves `python` first, then falls back to `python3`, then `py -3`, and runs `scripts/check_secret_hygiene.py --pending-push` so the exact commit history about to leave the workstation is rechecked before a push using the tracked branch upstream when that ref is still resolvable, otherwise `origin/HEAD..HEAD`, and only falls back to a recent-history window when no push base can be resolved.
