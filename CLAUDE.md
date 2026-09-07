# ANCAP — Claude Code Memory

## Project Identity

ANCAP is an ACP-first AI workflow platform. Users, crypto teams, creators, and AI agents buy, create, and sell paid AI workflows for ACP. Primary LLM is Teneta/Claude-compatible Anthropic API. Payments are ACP-first — Stripe/fiat is a later adapter.

Key identities:
- ACP = platform accounting unit (1:1 with itself)
- wACP = wrapped ACP on BSC
- ACP-crypto/ = Rust chain/wallet source of truth (sibling to this repo)
- ancap-mobile/ = React Native Expo wallet (sibling or submodule)
- `app/` = FastAPI backend
- `frontend-app/` = Next.js frontend

## Key Decisions (do not re-evaluate — resolved)

- **Pydantic schemas**: Always define request/response models in `app/schemas/*.py`, never locally inside router files. FastAPI evaluates Pydantic types at import time; locally-defined models cause `TypeError: Annotated[...] is not fully defined` at startup.
- **Org API key deletion**: Use a direct `delete(ApiKey).where().where()` with `result.rowcount` check — NOT `session.get()` or `scalar_one_or_none()`. Async SQLAlchemy sessions can return None from ORM reads in some transaction isolation cases.
- **agent_id nullable for org-owned keys**: `ApiKey.agent_id` is nullable. Org-owned keys have `agent_id=None`, `org_id=<uuid>`. Agent-owned keys have `org_id=None`, `agent_id=<uuid>`.
- **expo module imports**: Use static module-level imports, NOT `await import("expo-module")`. Dynamic imports cause TS1323 errors in expo modules.
- **Linking import in React Native**: Always `import { Linking } from "react-native"`, never from `expo-router`.
- **bscRpcUrl TypeScript chain**: When adding fields to the mobile config, update three places: `app/schemas/mobile_acp.py`, `app/api/routers/mobile_acp.py` (backend), AND `ancap-mobile/packages/acp-api-client/src/types.ts` AND run `npm run build` in that package. The SDK uses compiled `dist/` output, not source `.ts` files.
- **ACL line ending normalization**: CRLF auto-conversion happens on Windows git checkouts. The Kotlin and Swift FFI binding files (`acp_mobile_ffi.kt`, `acp_mobile_ffi.swift`) trigger this on every git operation. Discard whitespace-only changes with `git checkout -- <file>` before committing.

## Known Workarounds

- **Backend test runtime**: `pytest tests/ -q` takes ~6-8 min for the full suite (258+ tests). For faster feedback, run targeted subsets: `pytest tests/api/test_organizations.py tests/api/test_bridge_rail.py tests/api/test_workflow_store.py -q`.
- **Pycache stale bytecode**: After updating Python code, sometimes old error messages persist. Fix: `find . -path "*/__pycache__/*.pyc" -delete`.
- **FastAPI route verification**: To check if a route exists without starting the server: `python -c "from app.main import app; print([r.path for r in app.routes if 'keyword' in r.path])"`.
- **`/internal/frontend-build`**: This is a Next.js route in `frontend-app/src/app/internal/frontend-build/route.ts` — NOT a FastAPI route. It reads `.next/BUILD_ID` or `NEXT_PUBLIC_APP_BUILD_ID` env var.
- **Alembic migration run**: After pulling on any deploy target, always run `alembic upgrade head` before starting services. Recent migrations: 051 (mobile ACP indexer), 052 (bridge reserve snapshots), 053 (api_keys org_id), 054 (api_keys agent_id nullable), 057 (org NFC identity), 058 (securities + watch fleet + orbital edge), 059 (AETERNA DNA vault + intents + partners).

## Preferences

- **Commit style**: Small, atomic commits as I go. Message format: `type(scope): description` (e.g., `fix(orgs): resolve delete 404 with direct DELETE statement`).
- **Working tree**: Keep clean before stopping a session. `git status --short` should return nothing.
- **Roadmap discipline**: When fixing something, check the roadmap files immediately after — correct the status markers. Stale docs are the enemy of reliable execution.
- **Test before push**: Always run the targeted test subset for the area being changed before pushing.
- **Docs vs code**: If a route is documented in the smoke targets but doesn't exist in code — implement it or remove it from docs. Don't let docs drift from code.

## Recurring Mistakes to Avoid

- **Do NOT commit `.pyc` files or `__pycache__/`** — they are in `.gitignore` but can slip through with `git add .`.
- **Do NOT use `session.commit()` before making additional changes in the same session handler** — if you need to modify a row you just created in the same request, `flush()` after each modification. `commit()` ends the transaction boundary.
- **Do NOT assume Projects persist conversation history** — Projects only persist custom instructions. This session started with no memory of previous sessions. Read `CLAUDE.md`, `MASTER_ROADMAP.md`, and `PRODUCTION_ROADMAP.md` at session start.
- **Do NOT import Pydantic models from router files into other routers** — always import from `app.schemas.*`.
- **Do NOT run the full test suite during active development** — it takes 6-8 min. Use targeted tests. Run the full suite only before pushing or when auditing.

## Architecture Decisions Worth Preserving

- `app/db/models.py` — single source of truth for all SQLAlchemy models. Add new models here, not inline.
- `app/services/` — business logic layer. Routers call services; services handle DB operations.
- `app/schemas/` — one file per domain (e.g., `keys.py`, `mobile_acp.py`, `bridge_rail.py`).
- Bridge reconciliation runs via `POST /v1/system/jobs/tick`. Snapshots are persisted to `bridge_reserve_snapshots`. Alerts checked via `GET /v1/bridge/admin/alerts`.
- Mobile ACP indexer ticks via `POST /v1/system/jobs/tick` (same job scheduler).
- LLM execution with reliability: `app/services/llm.py` handles retry/backoff, degraded fallback, and usage event recording. Provider health surfaced in `/system/health/full`.

## Current Phase

Phase 6 — ACP Mobile Wallet MVP (in progress). Active items:
- `[ ]` PIN + biometrics (`expo-local-authentication`)
- `[ ]` SecureVault wiring (walletd fallback until native FFI ready)
- `[ ]` i18n EN/RU/UK/DE (`i18next`)
- `[ ]` MASVS L1 checklist
- `[ ]` React Flow strategy canvas (Phase 7, after builder API stable)

Blocked (needs Android native build):
- Create wallet via native FFI → run `build-android-native.ps1`
- Send + sign via native FFI

Phase 7 CI: Playwright smoke in CI (needs separate job with backend service).

Planned capital track (not blocking Phase 6): Securities intake R9 — promissory notes, shares, securities register/pledge (`docs/SECURITIES_INTAKE_ROADMAP.md`). Foundation: S0 done, S1 API/tables in `058_r9_r10_r11`.

Planned workplace wearables track (not blocking Phase 6): Apple Watch HR fleet R10 / mobile Phase 5.6 — 3 watches per employee, band rotation for charging, heart-rate sync (`docs/mobile/APPLE_WATCH_EMPLOYEE_FLEET.md`). Foundation: W0 done, W1 inventory/rotation/HR ingest API in migration `058`.

Planned orbital infra track (not blocking Phase 6): SpaceX encrypted satellite servers R11 — sealed ANCAP edge payloads via SpaceX; phases X0–X5 (docs/SPACEX_SATELLITE_ENCRYPTED_SERVERS_ROADMAP.md). Foundation: control-plane registry + `FF_ORBITAL_EDGE` (migration `058`).

Planned longevity track (not blocking Phase 6): AETERNA R12 — DNA vault, Sequencing.com-style import, ACP-paid genomic/longevity consult workflows, licensed partners (`docs/AETERNA_LONGEVITY_MARKETPLACE_ROADMAP.md`). Foundation: A0 done, A1 API/tables in `059_aeterna` + `FF_AETERNA`.
