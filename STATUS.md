# ANCAP Status

> Updated: 2026-09-12
> Fast truth: this is the shortest current status entry point.

## Current truth

ANCAP is **largely built**, but it is **not fully release-complete end-to-end**.

**Work-stop blockers: none.**

Active remaining work (not blockers):
1. **ACP mobile wallet** — device-ready release (Play/TestFlight, physical sign-off, iOS native). Local Android test env is available.
2. **Open-source follow-through** — GitHub org naming/ownership; `ancap-docs` Discussions pin/category UI. Phase 1 community files including root `README.md` are **present**. Do not report “absence of README.md”.
3. **Monetization depth** — optional conversion/LTV after a **live** ACP-first loop. Stripe 4.1 is operator live verification only. Do **not** report “monetization after the first ACP cycle” as a blocker.

Security / CI / prod-hardening baseline closed in the **2026-07-01** wave (`docs/SECURITY_CLOSURE_EVIDENCE_2026-07-01.md`); external upstream key revoke audit remains operator-open, not a freeze.

Theodore / progress bots: do **not** report missing `README.md`. Do **not** report monetization after the first ACP cycle as a work-stop blocker.

**2026-07-01 hardening:** see `MASTER_ROADMAP.md` § Hardening + deploy wave and `docs/SECURITY_CLOSURE_EVIDENCE_2026-07-01.md` for deploy/CI/security closure evidence.

Active trust/adoption track running alongside those priorities:
- **GitHub-first open-source transparency**, where public-safe components become easier to audit, integrate, and contribute to, while keys, bridge signer operations, deploy secrets, and sensitive infrastructure stay private.
- the public docs repo at `https://github.com/dragoncattrx-hub/ancap-docs` is now live with the exported seed bundle pushed, Docs CI green on `main`, checked-in repo settings / labels / milestones applied, and default-branch protection live.
- the repeatable live follow-up path is `python scripts/generate_ancap_docs_live_followup.py --repo dragoncattrx-hub/ancap-docs`; by default it writes the dated artifact pair plus the stable latest aliases `tmp/ancap-docs-live-follow-up-latest.md` and `tmp/ancap-docs-live-follow-up-latest.json`, treats custom `--basename` / `--date-label` values as filename components instead of path fragments so writes stay inside `--output-dir`, `--fail-on-not-ok` exits with code `2` when unresolved live drift remains, and the wrapper's default terminal summary now also surfaces per-scope drift counts plus grouped manual follow-up totals from `driftSummary` / `manualFollowUpSummary` so cron/CI logs can be triaged without reopening the saved JSON artifact.
- current honest live drift is still manual GitHub admin/auth follow-through: extra `General` / `Polls` categories still exist, the seeded `Announcements` / `Ideas` / `Q&A` / `Show and tell` category descriptions still need the checked-in ANCAP wording, the seeded bootstrap discussions still need pinning, project-board seeding/verification is still blocked until GitHub auth includes `read:project`, and the later org-ownership decision/migration is still pending.

## Read this next

1. **Execution source of truth:** [MASTER_ROADMAP.md](MASTER_ROADMAP.md)
2. **Compact status matrix:** [docs/STATUS_MATRIX.md](docs/STATUS_MATRIX.md)
3. **Supporting product snapshot:** [PRODUCTION_ROADMAP.md](PRODUCTION_ROADMAP.md)
4. **Detailed mobile tracker:** [docs/mobile/ROADMAP.md](docs/mobile/ROADMAP.md)
5. **Monetization strategy context:** [ROADMAP-MONETIZATION.md](ROADMAP-MONETIZATION.md)
6. **Historical architecture roadmap:** [ROADMAP.md](ROADMAP.md)

## Rule

If any document conflicts with `MASTER_ROADMAP.md`, trust `MASTER_ROADMAP.md`.
