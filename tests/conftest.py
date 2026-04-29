"""Pytest configuration and shared fixtures.

Uses sync TestClient so the ASGI app runs in one background thread with one event loop.
All tests share the same loop → no "Event loop is closed" or skips.
"""
import json
import os
import uuid
from typing import Any

import pytest
from sqlalchemy import create_engine, text
from starlette.testclient import TestClient

# Set before importing app (engine reads from env). Force async URL for app.
_test_db_url = os.environ.get("TEST_DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/ancap")
if "+asyncpg" not in _test_db_url:
    _test_db_url = _test_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
os.environ["DATABASE_URL"] = _test_db_url
# Disable daily agent registration limit in tests
os.environ["REGISTRATION_MAX_AGENTS_PER_DAY"] = "0"
# Disable tier-gating in tests so listings/orders/runs don't 403 because the
# test agent has no stake/trust/reputation. Production keeps this on by default.
os.environ.setdefault("PARTICIPATION_GATES_ENABLED", "false")
# Tests assert listing/run creation succeeds without first funding the seller's
# agent account. Zero out platform fees in the test environment; the few tests
# that explicitly cover fee accounting set their own values via monkeypatch.
os.environ.setdefault("LISTING_FEE_PERCENT", "0")
os.environ.setdefault("LISTING_FEE_AMOUNT", "0")
os.environ.setdefault("RUN_FEE_PERCENT", "0")
os.environ.setdefault("RUN_FEE_AMOUNT", "0")

from app.db.session import Base, get_db, async_session_maker
from app.main import app


def _sync_database_url():
    url = os.environ.get("DATABASE_URL", "")
    if "+asyncpg" in url:
        return url.replace("+asyncpg", "").replace("postgresql+asyncpg", "postgresql")
    return url


def _seed_base_vertical_if_missing(sync_engine):
    """Insert BaseVertical and its spec if not present (so tests work with create_all without Alembic)."""
    base_vertical_spec = {
        "allowed_actions": [
            {"name": "const", "args_schema": {"type": "object"}, "description": "Constant value"},
            {"name": "math_add", "args_schema": {"type": "object"}},
            {"name": "math_sub", "args_schema": {"type": "object"}},
            {"name": "math_mul", "args_schema": {"type": "object"}},
            {"name": "math_div", "args_schema": {"type": "object"}},
            {"name": "cmp", "args_schema": {"type": "object"}},
            {"name": "if", "args_schema": {"type": "object"}},
            {"name": "rand_uniform", "args_schema": {"type": "object"}},
            {"name": "portfolio_buy", "args_schema": {"type": "object"}},
            {"name": "portfolio_sell", "args_schema": {"type": "object"}},
        ],
        "required_resources": [],
        "metrics": [
            {"name": "pnl_amount", "value_schema": {"type": "number"}},
            {"name": "return_pct", "value_schema": {"type": "number"}},
            {"name": "max_drawdown_pct", "value_schema": {"type": "number"}},
            {"name": "steps_executed", "value_schema": {"type": "integer"}},
            {"name": "runtime_ms", "value_schema": {"type": "integer"}},
            {"name": "risk_breaches", "value_schema": {"type": "integer"}},
        ],
        "risk_spec": {"max_loss_pct": 0.1},
    }
    with sync_engine.connect() as conn:
        r = conn.execute(text("SELECT id FROM verticals WHERE name = 'BaseVertical' LIMIT 1"))
        if r.fetchone() is not None:
            return
        vertical_id = str(uuid.uuid4())
        spec_id = str(uuid.uuid4())
        conn.execute(
            text(
                "INSERT INTO verticals (id, name, status, owner_agent_id, created_at) "
                "VALUES (:id, 'BaseVertical', 'active', NULL, NOW())"
            ),
            {"id": vertical_id},
        )
        conn.execute(
            text(
                "INSERT INTO vertical_specs (id, vertical_id, spec_json, created_at) "
                "VALUES (:spec_id, :vertical_id, :spec::jsonb, NOW())"
            ),
            {"spec_id": spec_id, "vertical_id": vertical_id, "spec": json.dumps(base_vertical_spec)},
        )
        conn.commit()


def _run_migrations_or_create_all(sync_url: str):
    """Run Alembic migrations (preferred, seeds BaseVertical); fallback to create_all + seed."""
    try:
        import subprocess
        r = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            env={**os.environ, "DATABASE_URL": sync_url.replace("postgresql+asyncpg", "postgresql").replace("+asyncpg", "")},
            capture_output=True,
            text=True,
            timeout=30,
        )
        if r.returncode == 0:
            return
    except Exception:
        pass
    # Fallback: create_all + seed (e.g. when Alembic not runnable or DB fresh)
    sync_engine = create_engine(sync_url, pool_pre_ping=True)
    Base.metadata.create_all(sync_engine)
    _seed_base_vertical_if_missing(sync_engine)
    sync_engine.dispose()


class _AuthedTestClient(TestClient):
    """TestClient that injects a default Bearer token unless a test passes its own.

    Most legacy tests were written before `/v1/ledger/*`, `/v1/api-keys`, etc.
    became authenticated. Rather than touch ~140 test bodies, we attach a token
    for the session's default user automatically. To opt out (e.g. when a test
    explicitly checks for 401), pass `headers={"Authorization": ""}` or use the
    `client_unauth` fixture.
    """

    default_token: str | None = None

    def request(self, method: str, url: str, **kwargs: Any):  # type: ignore[override]
        if self.default_token:
            headers = dict(kwargs.get("headers") or {})
            # Use `in` rather than `.get(...) or ...` so empty-string opt-outs
            # are not confused with "header not provided".
            has_auth = "Authorization" in headers or "authorization" in headers
            if not has_auth:
                headers["Authorization"] = f"Bearer {self.default_token}"
            else:
                value = headers.get("Authorization")
                if value is None:
                    value = headers.get("authorization")
                if value == "":
                    # Caller wants an unauthenticated request; strip the header
                    # entirely so the server replies 401 (not 422 on a bad token).
                    headers.pop("Authorization", None)
                    headers.pop("authorization", None)
            kwargs["headers"] = headers
        return super().request(method, url, **kwargs)


def _bootstrap_default_user(c: TestClient) -> str:
    """Create a single throwaway user for the session and return its access token."""
    email = unique_email()
    password = "password123"
    r = c.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "default_test_user"},
        headers={"Authorization": ""},
    )
    assert r.status_code in (200, 201, 400), r.text
    login = c.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
        headers={"Authorization": ""},
    )
    assert login.status_code == 200, login.text
    return str(login.json().get("access_token") or "")


@pytest.fixture(scope="session")
def client():
    """Sync HTTP client. Creates tables once via sync engine; app runs in one thread/loop.

    Auto-attaches a Bearer token for the session's default user. Tests that need
    an unauthenticated request can pass `headers={"Authorization": ""}` or use
    the `client_unauth` fixture below.
    """
    sync_url = _sync_database_url()
    try:
        _run_migrations_or_create_all(sync_url)
    except Exception as e:
        pytest.skip(f"Database not available (start PostgreSQL): {e}")

    async def override_get_db():
        async with async_session_maker() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db
    with _AuthedTestClient(app=app, base_url="http://test") as c:
        c.default_token = _bootstrap_default_user(c)
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def client_unauth(client):
    """Sibling client that does not auto-attach the default user's token.

    Use only for tests that intentionally check 401 / unauth behavior.
    """

    class _BareClient(TestClient):
        pass

    bare = _BareClient(app=app, base_url="http://test")
    yield bare
    bare.close()


def get_base_vertical_id_from_db():
    """Return BaseVertical id by querying DB directly (same DB as app)."""
    sync_url = _sync_database_url()
    try:
        engine = create_engine(sync_url, pool_pre_ping=True)
        with engine.connect() as conn:
            r = conn.execute(text("SELECT id FROM verticals WHERE name = 'BaseVertical' LIMIT 1"))
            row = r.fetchone()
        engine.dispose()
        return str(row[0]) if row else None
    except Exception:
        return None


@pytest.fixture(scope="session")
def base_vertical_id(client):
    """Session-scoped BaseVertical id for tests that need it."""
    vid = get_base_vertical_id_from_db()
    if not vid:
        pytest.fail("BaseVertical not found (run: alembic upgrade head, or seed failed)")
    return vid


def unique_email():
    return f"test_{uuid.uuid4().hex[:12]}@test.com"


def unique_name(prefix="test"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def _reset_ledger_invariant_halted():
    """Reset ledger_invariant_halted flag so tests don't see 503 from previous runs/tick."""
    from sqlalchemy import create_engine, text
    sync_url = _sync_database_url()
    engine = create_engine(sync_url, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(
            text(
                "INSERT INTO job_watermarks (key, value, updated_at) "
                "VALUES ('ledger_invariant_halted', 'false', NOW()) "
                "ON CONFLICT (key) DO UPDATE SET value = 'false', updated_at = NOW()"
            )
        )
        conn.commit()
    engine.dispose()


@pytest.fixture(autouse=True)
def reset_ledger_invariant_before_test():
    """Ensure ledger is not blocked at the start of each test (ROADMAP §3 block is opt-in per test)."""
    _reset_ledger_invariant_halted()
    yield
