# Release Process

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

# 2. No secrets in the working tree
git diff HEAD --staged -- . | grep -i "secret\|password\|key" || true
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

# 7. Pin dependency versions (if not using lock files)
# npm: npm install --package-lock-only && npm audit
# pip:  pip-compile requirements.in --generate-hashes
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

Before any staging or production deploy using `docker-compose.prod.yml`, ensure a real absolute `DATABASE_URL` (not the local `postgres:postgres` default; if it targets the bundled compose `postgres` service — whether via authority host `@postgres:...` or socket/query host `?host=postgres` — it must include the real DB password and must not use a placeholder-like password), a real non-default `POSTGRES_PASSWORD` for that bundled compose postgres service, plus real random `SECRET_KEY`, `CURSOR_SECRET`, and `CRON_SECRET` values (not placeholder-like strings) are set in the host shell or repo-root `.env`; when using the bundled compose postgres service, `DATABASE_URL` and `POSTGRES_PASSWORD` must stay in sync. The production stack is expected to fail fast if any of them are missing or inconsistent, and `docker compose -f docker-compose.prod.yml config --quiet` should now fail immediately when one is unset without printing resolved secrets. The PowerShell/Linux deploy helpers also run that quiet config validation before any build/start step and keep live proxy/frontend verification enabled by default; `-SkipPostDeployChecks` / `--skip-post-deploy-checks` exists only for controlled staged-test contexts, not for the real release deploy path.

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
