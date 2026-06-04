# Release Process

> Last verified: 2026-05-28

This document describes the release workflow for the ANCAP backend and frontend.

---

## Versioning

ANCAP follows **semver** for the application stack:
- `X.Y.Z` — public API / feature releases
- Commits to `master` auto-increment the patch version for hotfixes

The `version.txt` file (if present) reflects the currently deployed build.

---

## Pre-release Checklist

Complete **all** items before cutting a release branch:

```bash
# 1. Tests green on master
git checkout master && git pull
python -m pytest tests/ -q --tb=short

# 2. Secret hygiene gates pass before release
# The scanner covers tracked/staged/untracked/history scopes and now catches
# OpenAI project/service-account prefixes plus Anthropic/GitHub/Stripe/provider patterns.
python scripts/check_secret_hygiene.py --staged
python scripts/check_secret_hygiene.py --history-range HEAD~20..HEAD
# Optional clone-safe local variant when HEAD~20 may not exist:
python scripts/check_secret_hygiene.py --recent-history 20
# Optional exact local pre-push variant for the commits about to leave this workstation
# (uses the tracked upstream while that ref is still resolvable, otherwise falls back to
# origin/HEAD..HEAD or a recent-history window when no push base can be resolved):
python scripts/check_secret_hygiene.py --pending-push
# Windows launcher-only equivalents for the direct scanner commands above:
py -3 scripts/check_secret_hygiene.py --staged
py -3 scripts/check_secret_hygiene.py --history-range HEAD~20..HEAD
py -3 scripts/check_secret_hygiene.py --recent-history 20
py -3 scripts/check_secret_hygiene.py --pending-push
python scripts/check_secret_hygiene.py --format json --output tmp/secret-hygiene-report.json
# Optional when you want the same evidence shape as the scheduled/manual/tagged-release GitHub recent-history sweep:
python scripts/check_secret_hygiene.py --recent-history 20 --format json --output tmp/secret-hygiene-history-report.json
# Windows launcher-only JSON artifact equivalents:
py -3 scripts/check_secret_hygiene.py --format json --output tmp/secret-hygiene-report.json
py -3 scripts/check_secret_hygiene.py --history-range HEAD~20..HEAD --format json --output tmp/secret-hygiene-history-report.json
py -3 scripts/check_secret_hygiene.py --recent-history 20 --format json --output tmp/secret-hygiene-history-report.json
# Optional markdown handoff artifact for operator-side revoke/cleanup notes:
python scripts/render_secret_rotation_evidence.py --tracked-report tmp/secret-hygiene-report.json --history-report tmp/secret-hygiene-history-report.json --output tmp/secret-rotation-evidence.md
# Windows launcher-only equivalent:
py -3 scripts/render_secret_rotation_evidence.py --tracked-report tmp/secret-hygiene-report.json --history-report tmp/secret-hygiene-history-report.json --output tmp/secret-rotation-evidence.md
# Tagged-release CI now uploads the tracked/history JSON artifacts plus this markdown worksheet
# before the final explicit secret-hygiene gate step, so a failing release-time scan still keeps
# the evidence bundle for operator follow-through. The tagged-release workflow now drives that
# tracked/history/markdown bundle through `python scripts/generate_secret_hygiene_evidence.py --recent-history 20`
# so GitHub release artifacts stay on the same contract as the local one-shot handoff path.
# If the second artifact comes from a local --pending-push JSON instead of a history sweep,
# you can pass it via the equivalent alias below:
python scripts/render_secret_rotation_evidence.py --tracked-report tmp/secret-hygiene-report.json --secondary-report tmp/secret-hygiene-pending-push-report.json --output tmp/secret-rotation-evidence.md
# Windows launcher-only equivalent:
py -3 scripts/render_secret_rotation_evidence.py --tracked-report tmp/secret-hygiene-report.json --secondary-report tmp/secret-hygiene-pending-push-report.json --output tmp/secret-rotation-evidence.md
# Optional one-shot local bundle when you want the primary + secondary JSON artifacts plus the markdown worksheet together:
python scripts/generate_secret_hygiene_evidence.py
# Windows launcher-only equivalent:
py -3 scripts/generate_secret_hygiene_evidence.py
# Use the same recent-history bundle contract as tagged-release CI when you want an exact local mirror of the release artifact set:
python scripts/generate_secret_hygiene_evidence.py --recent-history 20
# Windows launcher-only equivalent:
py -3 scripts/generate_secret_hygiene_evidence.py --recent-history 20
# Add --include-untracked when local temp/export artifact coverage matters too:
python scripts/generate_secret_hygiene_evidence.py --include-untracked
# Windows launcher-only equivalent:
py -3 scripts/generate_secret_hygiene_evidence.py --include-untracked
# Add --staged-primary when the main evidence artifact should reflect the staged index
# instead of the working tree (for example release/pre-commit follow-through after a local cleanup):
python scripts/generate_secret_hygiene_evidence.py --staged-primary
# Windows launcher-only equivalent:
py -3 scripts/generate_secret_hygiene_evidence.py --staged-primary
# The one-shot generator now also refuses reused primary/secondary/output paths up front,
# so a local evidence bundle cannot accidentally overwrite one artifact with another.
# Optional local bootstrap so git reruns the staged scan before commit and the exact pending-push sweep before push:
python scripts/install_git_hooks.py --dry-run
# Windows launcher-only equivalent:
py -3 scripts/install_git_hooks.py --dry-run
# Optional non-mutating verification that the local repo is already wired to the tracked hooks:
python scripts/install_git_hooks.py --check
# Windows launcher-only equivalent:
py -3 scripts/install_git_hooks.py --check
pytest tests/test_secret_hygiene.py tests/test_release_security_workflows.py -q
git status --short

# 3. Alembic migrations are at head
alembic upgrade head
# If new migrations exist, ensure they are backwards-compatible
alembic downgrade --sql -1 | psql $DATABASE_URL  # dry-run downgrade

# 4. Frontend builds
cd frontend-app && npm run build && cd ..

# 5. Docker build succeeds
docker build -t ancap:release-check .

# 6. Bandit scan — zero HIGH severity findings
bandit -r app/ -f txt 2>&1 | tee bandit-report.txt
# Review bandit-report.txt before proceeding

# 7. Refresh dependency locks when runtime deps changed
# npm: npm install --package-lock-only && npm audit
# pip: regenerate requirements.txt from a Linux-compatible Python 3.11 environment
#      (matching the runtime image) so Windows-only wheels are not locked in:
#      docker run --rm -v "$PWD:/work" -w /work python:3.11-slim \
#        bash -lc "python -m pip install --no-cache-dir pip-tools && python -m piptools compile --generate-hashes --output-file requirements.txt requirements.in"
```

---

## Cutting a Release

```bash
VERSION=v1.X.Y
git checkout -b release/${VERSION}
# ... apply version bumps, update CHANGELOG ...

# Tag
git tag -a ${VERSION} -m "Release ${VERSION}"
git push origin release/${VERSION} --tags
```

---

## Deployment

Before any staging or production deploy using `docker-compose.prod.yml`, ensure a real absolute `DATABASE_URL` (not insecure local bundled-db default credentials; if it targets the bundled compose `postgres` service — whether via authority host `@postgres:...` or socket/query host `?host=postgres` — it must include the real DB password and must not use a placeholder-like password), a real non-default `POSTGRES_PASSWORD` for that bundled compose postgres service, plus real random `SECRET_KEY`, `CURSOR_SECRET`, and `CRON_SECRET` values (not placeholder-like strings) are set in the host shell or repo-root `.env`; when using the bundled compose postgres service, `DATABASE_URL` and `POSTGRES_PASSWORD` must stay in sync. Use `docs/PRODUCTION_SECRET_BASELINE.md` as the operator-side provisioning/evidence checklist for that follow-through. On the current host/runtime this baseline is already satisfied and healthy-verified, but every future staging/production deploy must re-check it explicitly. The production stack is expected to fail fast if any of them are missing or inconsistent, and `docker compose -f docker-compose.prod.yml config --quiet` should now fail immediately when one is unset without printing resolved secrets. The PowerShell/Linux deploy helpers also run that quiet config validation before any build/start step and keep live proxy/frontend verification enabled by default; `-SkipPostDeployChecks` / `--skip-post-deploy-checks` exists only for controlled staged-test contexts, not for the real release deploy path.

1. **Staging**: merge release branch → `staging`, deploy `docker-compose.prod.yml`
2. **Smoke test**:
   ```bash
   curl -sf https://staging.ancap.cloud/v1/system/health
   curl -sf https://staging.ancap.cloud/v1/system/ready
   ```
3. **Production**: promote staging → production via the same compose stack

---

## Hotfix Procedure

```bash
git checkout master
git pull
git checkout -b hotfix/<description>
# ... apply minimal fix ...
python -m pytest tests/ -q
git tag -a v1.X.Y+1 -m "Hotfix: <description>"
git push origin hotfix/<description> --tags
git checkout master && git merge --no-ff hotfix/<description>
```

---

## Rollback

```bash
# Roll back the database migration
alembic downgrade -1

# Re-deploy previous image
docker pull ancap/app:<previous-tag>
docker compose -f docker-compose.prod.yml up -d --no-deps api
```

---

## Release Artifacts

| Artifact | Location |
|---|---|
| Release notes | `docs/RELEASE_<VERSION>.md` |
| Migration diff | `alembic/versions/` |
| Docker image | GHCR `ghcr.io/ancap-cloud/api:<tag>` |
| Helm chart | `k8s/` (if applicable) |
