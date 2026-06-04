# ANCAP Status

> Updated: 2026-06-01
> Fast truth: this is the shortest current status entry point.

## Current truth

ANCAP is **largely built**, but it is **not fully release-complete end-to-end**.

The three biggest remaining tails are:
1. **security / CI / prod-hardening**
2. **ACP mobile wallet completion to a real device-ready release**
3. **monetization depth after the first ACP-first revenue loop**

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
