"""Tests for ACP address history bindings + indexer watchlist."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import anyio
from sqlalchemy import create_engine, select as sync_select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session

from app.db.models import (
    MobileAddressIndexerState,
    User,
    UserAcpAddressBinding,
    UserAcpPrivacyAddress,
    UserAcpWallet,
)
from app.jobs.mobile_acp_indexer_tick import build_address_watchlist, mobile_acp_indexer_tick
from app.services import acp_wallet as acp_wallet_svc
from app.services.acp_tokenomics import CUSTODIAL_HOT_ADDRESS


def _async_db_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    if "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _sync_db_url() -> str:
    url = os.environ.get("DATABASE_URL", "")
    return url.replace("+asyncpg", "").replace("postgresql+asyncpg", "postgresql")


def test_create_wallet_upserts_deposit_binding(client, monkeypatch):
    """Wallet create writes an active deposit binding for the minted address."""
    email = f"bind_create_{uuid.uuid4().hex[:10]}@test.com"
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "Bind Create"},
        headers={"Authorization": ""},
    )
    assert res.status_code == 201, res.text

    sync_engine = create_engine(_sync_db_url(), pool_pre_ping=True)
    try:
        with Session(sync_engine) as session:
            user = session.execute(sync_select(User).where(User.email == email)).scalar_one()
            wallet = session.get(UserAcpWallet, user.id)
            assert wallet is not None
            assert wallet.address != CUSTODIAL_HOT_ADDRESS
            binding = session.execute(
                sync_select(UserAcpAddressBinding).where(
                    UserAcpAddressBinding.user_id == user.id,
                    UserAcpAddressBinding.address == wallet.address,
                )
            ).scalar_one_or_none()
            assert binding is not None
            assert binding.kind == "deposit"
            assert binding.unbound_at is None
    finally:
        sync_engine.dispose()


def test_personalize_unbinds_previous_and_binds_new(client, monkeypatch):
    """Personalize off hot mints a new deposit binding; hot is not bound."""
    from app.api.routers import wallet_acp as wallet_acp_router

    monkeypatch.setattr(
        wallet_acp_router,
        "_load_balance_result",
        lambda address, interactive=True: {
            "address": address,
            "units": "0",
            "acp": "0",
            "utxo_count": 0,
        },
    )

    email = f"bind_pers_{uuid.uuid4().hex[:10]}@test.com"
    password = "password123"
    res = client.post(
        "/v1/auth/users",
        json={"email": email, "password": password, "display_name": "Bind Pers"},
        headers={"Authorization": ""},
    )
    assert res.status_code == 201, res.text
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sync_engine = create_engine(_sync_db_url(), pool_pre_ping=True)
    try:
        with Session(sync_engine) as session:
            # Free unique hot slot if prior tests left a wallet on it.
            for stuck in session.execute(
                sync_select(UserAcpWallet).where(UserAcpWallet.address == CUSTODIAL_HOT_ADDRESS)
            ).scalars().all():
                stuck.address = f"acp1freed{uuid.uuid4().hex[:30]}"
            user = session.execute(sync_select(User).where(User.email == email)).scalar_one()
            wallet = session.get(UserAcpWallet, user.id)
            assert wallet is not None
            # Force hot binding like legacy accounts, then personalize.
            wallet.address = CUSTODIAL_HOT_ADDRESS
            session.commit()
            user_id = user.id
    finally:
        sync_engine.dispose()

    fixed = client.post(
        "/v1/wallet/acp/personalize",
        json={"wallet_password": password},
        headers=headers,
    )
    assert fixed.status_code == 200, fixed.text
    new_addr = fixed.json()["address"]
    assert new_addr != CUSTODIAL_HOT_ADDRESS

    sync_engine = create_engine(_sync_db_url(), pool_pre_ping=True)
    try:
        with Session(sync_engine) as session:
            rows = session.execute(
                sync_select(UserAcpAddressBinding).where(UserAcpAddressBinding.user_id == user_id)
            ).scalars().all()
            addrs = {r.address: r for r in rows}
            assert CUSTODIAL_HOT_ADDRESS not in addrs
            assert new_addr in addrs
            assert addrs[new_addr].kind == "deposit"
            assert addrs[new_addr].unbound_at is None
    finally:
        sync_engine.dispose()


def test_upsert_and_unbind_address_binding_unit():
    """Direct service helpers: upsert, re-activate, unbind → previous_deposit."""

    async def _run():
        engine = create_async_engine(_async_db_url(), pool_pre_ping=True)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with SessionLocal() as session:
                user = User(
                    id=str(uuid.uuid4()),
                    email=f"bind_unit_{uuid.uuid4().hex[:8]}@test.com",
                    password_hash="x",
                    display_name="Unit",
                    created_at=datetime.now(timezone.utc),
                )
                session.add(user)
                await session.flush()
                addr_a = f"acp1{uuid.uuid4().hex[:38]}"
                addr_b = f"acp1{uuid.uuid4().hex[:38]}"

                row = await acp_wallet_svc.upsert_address_binding(
                    session, user.id, addr_a, acp_wallet_svc.BINDING_KIND_DEPOSIT
                )
                assert row is not None
                assert row.unbound_at is None

                # Skip custodial hot
                hot = await acp_wallet_svc.upsert_address_binding(
                    session, user.id, CUSTODIAL_HOT_ADDRESS, acp_wallet_svc.BINDING_KIND_DEPOSIT
                )
                assert hot is None

                await acp_wallet_svc.unbind_address_binding(
                    session, user.id, addr_a, mark_previous_deposit=True
                )
                await session.refresh(row)
                assert row.unbound_at is not None
                assert row.kind == acp_wallet_svc.BINDING_KIND_PREVIOUS_DEPOSIT

                # Reactivate via upsert
                again = await acp_wallet_svc.upsert_address_binding(
                    session, user.id, addr_a, acp_wallet_svc.BINDING_KIND_DEPOSIT
                )
                assert again is not None
                assert again.unbound_at is None
                assert again.kind == "deposit"

                await acp_wallet_svc.upsert_address_binding(
                    session, user.id, addr_b, acp_wallet_svc.BINDING_KIND_PRIVACY
                )
                await session.commit()
                return user.id, addr_a, addr_b
        finally:
            await engine.dispose()

    anyio.run(_run)


def test_build_address_watchlist_includes_wallet_privacy_and_bindings():
    """Watchlist unions wallet + privacy + historical binding addresses."""

    async def _run():
        engine = create_async_engine(_async_db_url(), pool_pre_ping=True)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
        try:
            async with SessionLocal() as session:
                user = User(
                    id=str(uuid.uuid4()),
                    email=f"watch_{uuid.uuid4().hex[:8]}@test.com",
                    password_hash="x",
                    display_name="Watch",
                    created_at=datetime.now(timezone.utc),
                )
                session.add(user)
                await session.flush()

                deposit = f"acp1dep{uuid.uuid4().hex[:32]}"
                privacy = f"acp1priv{uuid.uuid4().hex[:31]}"
                historical = f"acp1hist{uuid.uuid4().hex[:31]}"

                wallet = UserAcpWallet(
                    user_id=user.id,
                    address=deposit,
                    encrypted_mnemonic="e",
                    salt_b64="s",
                    nonce_b64="n",
                    secret_box_version=1,
                    derivation_path=acp_wallet_svc.DEFAULT_DERIVATION_PATH,
                    privacy_next_index=2,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )
                session.add(wallet)
                session.add(
                    UserAcpPrivacyAddress(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        address=privacy,
                        sub_index=1,
                        created_at=datetime.now(timezone.utc),
                    )
                )
                session.add(
                    UserAcpAddressBinding(
                        id=str(uuid.uuid4()),
                        user_id=user.id,
                        address=historical,
                        kind=acp_wallet_svc.BINDING_KIND_PREVIOUS_DEPOSIT,
                        bound_at=datetime.now(timezone.utc),
                        unbound_at=datetime.now(timezone.utc),
                    )
                )
                await session.commit()

                watch = await build_address_watchlist(session)
                assert deposit in watch
                assert privacy in watch
                assert historical in watch
                return watch
        finally:
            await engine.dispose()

    watch = anyio.run(_run)
    assert len(watch) >= 3


def test_indexer_tick_persists_watchlist_even_when_chain_scan_fails(monkeypatch):
    """Indexer refreshes state.indexed_addresses from DB sources before scanning."""
    from sqlalchemy import select

    async def _run():
        engine = create_async_engine(_async_db_url(), pool_pre_ping=True)
        SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

        from app.api.routers import wallet_acp as wa

        def _boom(interactive=False):
            raise RuntimeError("chain unavailable")

        monkeypatch.setattr(wa, "_scan_chain_transactions", _boom)

        try:
            async with SessionLocal() as session:
                user = User(
                    id=str(uuid.uuid4()),
                    email=f"idx_{uuid.uuid4().hex[:8]}@test.com",
                    password_hash="x",
                    display_name="Idx",
                    created_at=datetime.now(timezone.utc),
                )
                session.add(user)
                await session.flush()
                addr = f"acp1idx{uuid.uuid4().hex[:32]}"
                session.add(
                    UserAcpWallet(
                        user_id=user.id,
                        address=addr,
                        encrypted_mnemonic="e",
                        salt_b64="s",
                        nonce_b64="n",
                        secret_box_version=1,
                        derivation_path=acp_wallet_svc.DEFAULT_DERIVATION_PATH,
                        created_at=datetime.now(timezone.utc),
                        updated_at=datetime.now(timezone.utc),
                    )
                )
                await session.flush()

                result = await mobile_acp_indexer_tick(session)
                assert result.get("error")
                assert result.get("addresses_watched", 0) >= 1

                state_row = (
                    await session.execute(
                        select(MobileAddressIndexerState).where(MobileAddressIndexerState.id == 1)
                    )
                ).scalar_one_or_none()
                assert state_row is not None
                assert addr in (state_row.indexed_addresses or [])
                await session.commit()
                return addr
        finally:
            await engine.dispose()

    anyio.run(_run)


def test_acp_history_rescan_requires_platform_admin(client, monkeypatch):
    monkeypatch.setenv("PLATFORM_ADMIN_USER_IDS", "")
    monkeypatch.setenv("PLATFORM_ADMIN_EMAILS", "")
    from app.config import get_settings

    get_settings.cache_clear()
    try:
        r = client.post(
            "/v1/platform-admin/acp-history/rescan",
            json={"reset_watermark": False},
            headers={"Authorization": ""},
        )
        assert r.status_code in (401, 503)
    finally:
        get_settings.cache_clear()
