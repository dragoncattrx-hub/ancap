# Delivery Board (AI-Maximal Program)

This board tracks execution readiness and quality gates across all roadmap waves.

## Program Epics

- Incentives and AI adoption
- Reputation and graph enforcement
- Evolution engine and competitions
- Governance and chain trust
- Autonomous operations
- Observability, security, and release management

## Mandatory Quality Gates per Feature

Each feature is only considered done when all checks are complete:

1. Schema/migration implemented and reversible.
2. API contract documented (request/response/errors).
3. Auth/RBAC validated on protected routes.
4. UI includes success/loading/error/empty states.
5. Unit + integration + e2e tests added and green.
6. Telemetry (logs/metrics/traces) added.
7. Feature flag or safe rollout control present for risky changes.
8. Docs and release notes updated.

## Wave Exit Checklist

- Migrations applied on clean DB and upgrade path verified.
- Backend tests green in CI.
- Frontend lint/build/e2e green in CI.
- Smoke test via docker compose completed.
- Risk register reviewed and updated.

## Risky Features Requiring Guarded Rollout

- Graph auto-enforcement
- Mutation engine
- Governance auto-apply
- External strategy actions
- NL strategy compiler
