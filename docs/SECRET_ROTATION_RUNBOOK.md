# Secret Rotation Runbook

Purpose: operator checklist for any suspected or confirmed exposure of API keys, webhook secrets, deploy tokens, or other production credentials.

Use this runbook when:
- a secret appears in git history, repo files, docs, logs, screenshots, or chat
- GitHub secret scanning or push protection reports a hit
- a provider reports suspicious activity on a credential
- a device/session with deploy or dashboard access may be compromised

## Immediate containment

1. **Treat the exposed value as compromised.** Do not keep using it while “just cleaning docs first”.
2. **Revoke or rotate at the upstream provider first** (for example LLM provider, Stripe, Cloudflare, GitHub, RPC vendor, webhook source).
3. **Replace the live value only in env / CI / secret manager locations**. Never paste the new secret into issues, PRs, docs, or test fixtures.
4. **Invalidate related sessions/tokens** if the provider supports it.
5. **Audit what the credential could access** and reduce scope if it had broader access than necessary.

## Repo-side cleanup

1. Remove the exposed value from tracked files and examples.
2. If the leak only exists in an unmerged local branch, clean it before merge.
3. If the leak was already pushed/shared, still assume compromise even if the commit is later removed.
4. Re-run the Priority 0.1 repo scan from `MASTER_ROADMAP.md`.
5. Run:
   - `python scripts/check_secret_hygiene.py`
   - `python scripts/check_secret_hygiene.py --staged`
   - `python scripts/check_secret_hygiene.py --include-untracked`
   - `python scripts/check_secret_hygiene.py --history-range HEAD~20..HEAD`
   - `python scripts/check_secret_hygiene.py --format json --output tmp/secret-hygiene-report.json`
   - `pytest tests/test_secret_hygiene.py tests/test_release_security_workflows.py -q`
6. If this is happening in CI/release automation, upload `tmp/secret-hygiene-report.json` as the evidence artifact instead of relying on ad-hoc shell redirection or pasted logs. Retain `tmp/secret-hygiene-history-report.json` too whenever the GitHub workflow/release path runs a history sweep: push and pull_request events now scan the exact pushed/PR commit delta when GitHub provides those SHAs *and that rev-range actually resolves in the checked-out clone*, otherwise they fall back to the clone-safe `--recent-history 20` path. In practice this means the workflow still stays green on shallow/small clones because unresolved supplied SHAs drop onto that same clone-safe `--recent-history 20` sweep instead of hard-failing. scheduled sweeps now use that same clone-safe `--recent-history 20` path, manual runs use that same clone-safe recent-history sweep when `history_range` is left blank, and tagged releases now use that same clone-safe `--recent-history 20` artifact path as release evidence instead of forcing `HEAD~20..HEAD` in the release workflow. The manual `Secret Hygiene` workflow path therefore no longer needs a default `HEAD~20..HEAD` input just to stay green in shallow/small clones, and both the scheduled/manual workflow plus tagged-release path now also render and retain `tmp/secret-rotation-evidence.md` as the derived markdown handoff artifact (`secret-rotation-evidence`) so operator closure notes can start from the same redacted evidence bundle instead of rebuilding it locally. Tagged releases now also upload those JSON/markdown artifacts before the final explicit secret-hygiene gate step, so failed release-time scans still leave behind the evidence bundle instead of hiding it behind an early job exit. The tagged-release path now invokes `python scripts/generate_secret_hygiene_evidence.py --recent-history 20` for that bundle so the release workflow shares the same artifact-generation contract as the local/operator one-shot handoff path instead of duplicating three separate inline commands.
7. Confirm docs/examples use neutral placeholders or blank env vars instead of token-shaped examples; the repo scanner now also treats OpenAI project/service-account prefixes (for example `sk-` + `proj-` and `sk-` + `svcacct-`) and Anthropic prefixes (for example `sk-` + `ant-`) as token-shaped secret patterns alongside the older provider/GitHub/Stripe patterns.
8. If you need to hand off scan evidence, prefer the JSON report written via `--output` instead of pasting raw terminal logs into chat/tickets; when the workflow/release artifact already exists, prefer the retained `secret-rotation-evidence` markdown worksheet for human follow-through.
9. `python scripts/render_secret_rotation_evidence.py --tracked-report tmp/secret-hygiene-report.json --history-report tmp/secret-hygiene-history-report.json --output tmp/secret-rotation-evidence.md` turns those retained JSON artifacts into a copy-safe markdown incident worksheet with redacted findings plus the remaining operator closure fields, so revoke/cleanup handoff does not depend on ad-hoc note taking. If your second artifact is a local `--pending-push` JSON report instead of a history sweep, you can pass it via `--secondary-report` (alias of `--history-report`). It now also refuses mismatched inputs (for example two tracked-files reports, a tracked artifact paired with a history/pending-push artifact from a different repo root, a tracked artifact paired with a secondary artifact from a different scanned `HEAD` commit, or reusing the same file path for both an input artifact and the markdown output) instead of silently producing a misleading handoff bundle, and the retained JSON/markdown artifacts now include repo-HEAD provenance (`head_ref`, `head_commit`, dirty/clean working-tree state) so the handoff packet can be tied back to the exact scanned checkout.
10. `python scripts/generate_secret_hygiene_evidence.py` now wraps the primary scan, the secondary history/pending-push scan, and the markdown worksheet render into one repeatable command; by default it generates `tmp/secret-hygiene-report.json`, `tmp/secret-hygiene-history-report.json`, and `tmp/secret-rotation-evidence.md`, while `--pending-push` switches the secondary artifact to `tmp/secret-hygiene-pending-push-report.json`. Add `--include-untracked` when you want that one-shot bundle to include local non-ignored temp/export artifact coverage in the primary JSON artifact too instead of only tracked files, or `--staged-primary` when the main evidence artifact should reflect the current git index instead of the working tree (for example release/pre-commit handoff after you cleaned a local file but have not restaged yet). It now also refuses reused primary/secondary/output file paths up front so the one-shot bundle cannot overwrite one artifact with another.
11. On Windows hosts that only expose the Python launcher, the same scanner / renderer / one-shot bundle commands can be run as `py -3 scripts/check_secret_hygiene.py ...`, `py -3 scripts/render_secret_rotation_evidence.py ...`, and `py -3 scripts/generate_secret_hygiene_evidence.py ...` with the same arguments.
12. Finding previews are redacted in scanner output on purpose so a detection does not copy a live secret value into CI logs or shared artifacts.
13. Use `--staged` before commit when you want to catch a token-shaped secret that is already in the git index even if you later cleaned the working tree copy before remembering to restage.
14. Use `--history-range <rev-range>` (for example `HEAD~20..HEAD`) after cleanup/rotation when you want to verify that recent committed history no longer hides token-shaped secrets anywhere in the committed tree state for each commit in that window, including unchanged files that ordinary diff-only history checks would miss. If the supplied rev-range does not resolve in the current clone/worktree, the scanner now fails with a direct CLI validation error instead of a Python traceback. Use `--recent-history <count>` (for example `--recent-history 20`) when you want the same recent-window sweep without assuming `HEAD~20` exists in a small or shallow local clone.
15. Use `--pending-push` when you want the scanner to check the exact commit history about to leave the workstation: it prefers the tracked branch upstream while that ref is still resolvable, falls back to `origin/HEAD..HEAD` when no branch upstream is configured or the tracked upstream ref is stale/missing locally, and only falls back to a recent-history window when no push base can be resolved at all.
16. Install the tracked local git hooks with `python scripts/install_git_hooks.py` (or `py -3 scripts/install_git_hooks.py` on Windows hosts that only expose the launcher) — or inspect `.githooks/pre-commit` and `.githooks/pre-push` directly — when you want git to run the staged-index scan before each commit and the exact pending-push sweep before each push without depending on shell memory; the tracked pre-push hook now uses `--pending-push` for that tighter local path. Those tracked hooks resolve `python` first, then `python3`, then `py -3`, so the same bootstrap still works on Linux/macOS hosts that only expose `python3` and on Windows workstations that rely on the Python launcher instead of a bare `python` shim. The installer refuses to overwrite an existing custom `core.hooksPath` unless you pass `--force`, refuses to enable `.githooks` if either tracked hook file is missing, and if `core.hooksPath` already points at `.githooks` it only restores executable bits on those tracked files instead of rewriting local config. Use `python scripts/install_git_hooks.py --check` (or `py -3 scripts/install_git_hooks.py --check` on that same Windows launcher-only setup) when you want a non-mutating verification that the local repo is already wired to those tracked hooks (and, on non-Windows hosts, that the tracked hook files are executable).
17. If the default tracked-files scan hits a tracked path that is currently missing from the working tree, it now falls back to the git index for that path so local deletions do not crash the scan or hide still-tracked leaks.
18. If `--include-untracked` fires on temp/export artifacts (for example a local docs bundle copying `MASTER_ROADMAP.md` remediation notes), either delete those artifacts after use or keep them ignored so the local untracked scan can stay signal-heavy.

## GitHub / platform follow-through

1. Verify GitHub secret scanning and push protection remain enabled.
2. Check whether any GitHub alert needs dismissal only **after** rotation + cleanup are complete.
3. If the secret touched production access, review deployment history, audit logs, webhook deliveries, and any provider-side usage logs available.
4. If the credential had admin/dashboard scope, review user/session/access lists and remove anything unexpected.

## Evidence to capture

Record the following without storing the secret value itself:
- secret class/type
- where it was exposed
- first known exposure time (or earliest possible window)
- revoke/rotate completion time
- where the replacement value is now stored
- affected environments (dev/staging/prod)
- follow-up alerts or access reviews performed

## Done definition

Only treat the incident as closed when all of the following are true:
- old credential is revoked/invalid
- replacement credential is stored in env / CI / secret manager only
- tracked repo files are clean
- `tests/test_secret_hygiene.py` passes
- roadmap/status docs reflect any remaining external blockers
- any required provider-side or dashboard-side access cleanup is complete

## Notes

- Do not rely on history rewrite alone as remediation.
- Do not post rotated values into Telegram, GitHub comments, or docs.
- When in doubt, prefer narrower-scope replacement credentials over broad all-access tokens.
