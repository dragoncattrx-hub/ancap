#!/usr/bin/env python3
"""Redistribute custodial hot back to genesis + project treasury slots."""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
import time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import User, UserAcpWallet
from app.services.acp_wallet import decode_wallet_secret, decrypt_wallet_secret_with_password

EMAIL = os.environ.get("OPERATOR_EMAIL", "dragon.cat.trx@gmail.com")
WALLET_PASSWORD = os.environ.get("WALLET_PASSWORD", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
RPC = "http://acp-node:8545/rpc"
WALLETD = os.environ.get("ACP_WALLETD_PATH", "walletd")
CUSTODIAL_HOT = "acp1qzfdkqxfgyw9ysk99qsd79yxdfe338yd85vrqnp9"
GENESIS = "acp1qzmlenphy56gv38j2x4yf4xe4qv4w89l3cpzmrdl"
PROJECT = "acp1qpw9nstpx5vtmqxdxmmud25dk0ae4s6a7cs7n902"
HOT_TARGET_ACP = os.environ.get("HOT_TARGET_ACP", "1049999")
GENESIS_ACP = os.environ.get("GENESIS_ACP", "207643979.999998")
PROJECT_ACP = os.environ.get("PROJECT_ACP", "1000005.99429121")


def walletd(args: list[str]) -> dict:
    r = subprocess.run([WALLETD, *args], capture_output=True, text=True, timeout=180)
    out = (r.stdout or "").strip()
    payload = json.loads(out) if out else {}
    if r.returncode != 0 or not payload.get("ok"):
        raise RuntimeError(payload.get("error") or r.stderr or "walletd failed")
    return payload["result"]


def transfer(ks: str, to: str, amount: str) -> dict:
    res = walletd(
        ["transfer", "--rpc", RPC, "--keystore-json", ks, "--to", to, "--amount-acp", amount]
    )
    if not res.get("accepted"):
        raise RuntimeError(f"transfer to {to} rejected: {res}")
    return res


async def main() -> int:
    if not WALLET_PASSWORD or not DATABASE_URL:
        print("WALLET_PASSWORD and DATABASE_URL required", file=sys.stderr)
        return 1

    engine = create_async_engine(DATABASE_URL)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as session:
        wallet, _ = (
            await session.execute(
                select(UserAcpWallet, User.email)
                .join(User, User.id == UserAcpWallet.user_id)
                .where(User.email.ilike(EMAIL))
            )
        ).one()
        secret = decrypt_wallet_secret_with_password(wallet, WALLET_PASSWORD)
        _, keystore_json = decode_wallet_secret(secret)

        print("Hot before:", walletd(["balance", "--rpc", RPC, "--address", CUSTODIAL_HOT]))
        for label, to, amt in (
            ("genesis", GENESIS, GENESIS_ACP),
            ("project", PROJECT, PROJECT_ACP),
        ):
            print(f"=== {label} -> {to}: {amt} ACP ===")
            print(json.dumps(transfer(keystore_json, to, amt)))
            time.sleep(5)

        time.sleep(25)
        print("Hot after:", walletd(["balance", "--rpc", RPC, "--address", CUSTODIAL_HOT]))
        print("Genesis:", walletd(["balance", "--rpc", RPC, "--address", GENESIS]))
        print("Project:", walletd(["balance", "--rpc", RPC, "--address", PROJECT]))
    await engine.dispose()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
