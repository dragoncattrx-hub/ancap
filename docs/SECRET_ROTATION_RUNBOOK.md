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
   - `pytest tests/test_secret_hygiene.py -q`
6. Confirm docs/examples use neutral placeholders or blank env vars instead of token-shaped examples.

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
