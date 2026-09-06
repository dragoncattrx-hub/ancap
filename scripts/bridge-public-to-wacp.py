#!/usr/bin/env python3
"""Bridge public liquidity bucket (25.2M ACP) to wACP on BSC.

Flow: public wallet -> bridge reserve (ACP deposit) -> BridgeGateway mint -> BSC address.
Preserves user ledger balances (only tokenomics public pool moves on-chain).
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from decimal import Decimal, ROUND_DOWN

from pathlib import Path

REMOTE = "/opt/ancap-migration/current"
RPC = "http://acp-node:8545/rpc"
PUBLIC = "acp1qqla8waukrudkleau9n6gzj9c58ufyfxaulvwumm"
PUBLIC_KS = "/run/secrets/public-liquidity.keystore.json"
HOT_KS = "/run/secrets/custodial-hot.keystore.json"
FEE_DUST_ACP = "0.000001"
BSC_TO = "0x396351dF6420e6089dC67F4CBdDc717f34fFB2e4"
TARGET_ACP = Decimal("25200000")
# wACP 18 decimals
TARGET_WACP_WEI = int((TARGET_ACP * Decimal(10) ** 18).to_integral_value(rounding=ROUND_DOWN))
TARGET_SMALLEST = int((TARGET_ACP * Decimal(10) ** 8).to_integral_value(rounding=ROUND_DOWN))
CAP_SINGLE = str(int(TARGET_WACP_WEI * 12 // 10))  # 20% headroom
CAP_DAY = CAP_SINGLE
MIN_BNB_WEI = 10_000_000_000_000_000  # 0.01 BNB minimum for setCaps + large mint


def ssh(cmd: str, timeout: int = 900) -> str:
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", cmd],
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "ssh failed").strip())
    return (r.stdout or "").strip()


def walletd(args: str) -> dict:
    out = ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api walletd {args}"
    )
    data = json.loads(out)
    if not data.get("ok"):
        raise RuntimeError(data.get("error") or out)
    return data["result"]


def tick(n: int = 4) -> None:
    for _ in range(n):
        ssh(
            f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
            "sh -lc 'curl -sf -X POST http://127.0.0.1:8000/v1/system/jobs/tick "
            "-H \"content-type: application/json\" -H \"X-Cron-Secret: $CRON_SECRET\" -d \"{}\"' >/dev/null"
        )
        time.sleep(8)


def ssh_stdin(remote_cmd: str, payload: str, timeout: int = 900) -> str:
    r = subprocess.run(
        ["ssh", "-o", "ConnectTimeout=20", "ancap-server", remote_cmd],
        input=payload,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "ssh failed").strip())
    return (r.stdout or "").strip()


def check_bsc_state() -> dict[str, int | str]:
    py = Path(__file__).with_name("_check_bridge_bsc_state.py").read_text(encoding="utf-8")
    out = ssh_stdin(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api python -",
        py,
    )
    lines = dict(
        line.split(" ", 1) for line in out.splitlines() if " " in line
    )
    return {
        "signer": str(lines.get("signer", "")),
        "bnb_wei": int(lines.get("bnb_wei", 0)),
        "max_single": int(lines.get("maxSingleMint", 0)),
        "cap_day": int(lines.get("mintCapPerDay", 0)),
    }


def ensure_public_fee_dust() -> None:
    """Public bucket often holds exactly 25.2M with no room for tx fee."""
    pub = walletd(f"balance --rpc {RPC} --address {PUBLIC}")
    units = int(pub.get("units") or 0)
    need_units = TARGET_SMALLEST + 100  # MIN_FEE_UNITS
    if units >= need_units:
        return
    print(f"=== hot -> public fee dust ({FEE_DUST_ACP} ACP) ===")
    res = walletd(
        f"transfer --rpc {RPC} --keystore-file {HOT_KS} "
        f"--to {PUBLIC} --amount-acp {FEE_DUST_ACP}"
    )
    print(json.dumps(res, indent=2))
    if not res.get("accepted"):
        raise RuntimeError("fee dust transfer not accepted")
    tick(4)


def raise_gateway_caps(state: dict[str, int | str]) -> None:
    if int(state["max_single"]) >= int(CAP_SINGLE) and int(state["cap_day"]) >= int(CAP_DAY):
        print("Gateway caps already sufficient")
        return
    if int(state["bnb_wei"]) < MIN_BNB_WEI:
        raise RuntimeError(
            f"Bridge signer {state['signer']} has only {int(state['bnb_wei'])} wei BNB; "
            f"send at least 0.01 BNB on BSC before raising caps and minting 25.2M wACP."
        )
    print("=== Raise BridgeGateway mint caps ===")
    py = f"""import os
from eth_account import Account
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from app.config import get_settings

max_single = int("{CAP_SINGLE}")
cap_per_day = int("{CAP_DAY}")
s = get_settings()
w3 = Web3(Web3.HTTPProvider(s.bridge_bsc_rpc_url, request_kwargs={{"timeout": 30}}))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
acct = Account.from_key(s.bridge_bsc_private_key)
abi = [
    {{"inputs":[{{"name":"maxSingle","type":"uint256"}},{{"name":"perDay","type":"uint256"}}],"name":"setCaps","outputs":[],"stateMutability":"nonpayable","type":"function"}},
    {{"inputs":[],"name":"maxSingleMint","outputs":[{{"type":"uint256"}}],"stateMutability":"view","type":"function"}},
    {{"inputs":[],"name":"mintCapPerDay","outputs":[{{"type":"uint256"}}],"stateMutability":"view","type":"function"}},
    {{"inputs":[],"name":"owner","outputs":[{{"type":"address"}}],"stateMutability":"view","type":"function"}},
]
gw = w3.eth.contract(address=Web3.to_checksum_address(s.bridge_gateway_contract), abi=abi)
owner = gw.functions.owner().call()
print("owner", owner, "signer", acct.address)
if owner.lower() != acct.address.lower():
    raise SystemExit("signer is not gateway owner")
print("before maxSingle", gw.functions.maxSingleMint().call())
print("before perDay", gw.functions.mintCapPerDay().call())
if gw.functions.maxSingleMint().call() >= max_single and gw.functions.mintCapPerDay().call() >= cap_per_day:
    print("caps already sufficient")
else:
    tx = gw.functions.setCaps(max_single, cap_per_day).build_transaction({{
        "from": acct.address,
        "nonce": w3.eth.get_transaction_count(acct.address, "pending"),
        "chainId": int(w3.eth.chain_id),
        "gas": 150000,
    }})
    gas_estimate = w3.eth.estimate_gas(tx)
    tx["gas"] = int(gas_estimate * 12 // 10)
    priority = w3.to_wei(1, "gwei")
    tx.pop("gasPrice", None)
    try:
        base_fee = w3.eth.get_block("latest").get("baseFeePerGas")
    except Exception:
        base_fee = None
    if base_fee is not None:
        tx["maxPriorityFeePerGas"] = priority
        tx["maxFeePerGas"] = int(base_fee) * 2 + priority
    else:
        tx["maxPriorityFeePerGas"] = priority
        tx["maxFeePerGas"] = int(w3.eth.gas_price) + priority
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print("setCaps tx", tx_hash.hex())
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    print("setCaps status", receipt.status)
print("after maxSingle", gw.functions.maxSingleMint().call())
print("after perDay", gw.functions.mintCapPerDay().call())
"""
    out = ssh_stdin(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api python -",
        py,
    )
    print(out)


def complete_bridge_operation(txid: str, reserve: str) -> None:
    print("=== Create bridge operation + mint wACP ===")
    orchestrate = f"""
import asyncio
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation
from app.services.bridge_acp_watcher import reserve_deposit_units_for_tx
from app.services.bridge_bsc_watcher import tick_bsc_checkpoint
from app.services.bridge_orchestrator import append_transition, tick_orchestrator

TXID = {json.dumps(txid)}
RESERVE = {json.dumps(reserve)}
BSC_TO = {json.dumps(BSC_TO)}
TARGET_SMALLEST = {TARGET_SMALLEST}
TARGET_WACP_WEI = {TARGET_WACP_WEI}

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    Session = async_sessionmaker(engine, expire_on_commit=False)
    rpc = settings.acp_rpc_url.strip()
    deposit = await reserve_deposit_units_for_tx(rpc, RESERVE, TXID)
    received = int(deposit["received_units"])
    confirmations = int(deposit["confirmations"])
    print("deposit", deposit)
    if received <= 0:
        raise SystemExit("no reserve deposit in tx")
    if received != TARGET_SMALLEST:
        print(f"WARN: received {{received}} != target {{TARGET_SMALLEST}}; using received")
    amount_smallest = received
    amount_wacp = int(amount_smallest) * 10**10
    async with Session() as session:
        dup = await session.scalar(
            select(BridgeOperation.id).where(BridgeOperation.acp_tx_hash == TXID)
        )
        if dup:
            op = await session.get(BridgeOperation, dup)
            print("existing op", op.id, op.status)
        else:
            op = BridgeOperation(
                id=uuid4(),
                user_id=None,
                direction="acp_to_bsc",
                status="PENDING_DEPOSIT",
                user_bsc_address=BSC_TO.lower(),
                user_acp_address=PUBLIC,
                amount_acp_smallest=amount_smallest,
                amount_wacp_wei=amount_wacp,
                remainder_wacp_wei=0,
            )
            session.add(op)
            await session.flush()
            session.add(
                BridgeAuditEvent(
                    operation_id=op.id,
                    event_type="intent_created",
                    payload_json={{"direction": "acp_to_bsc", "operator": "bridge-public-to-wacp.py"}},
                )
            )
            print("created op", op.id)
        if op.status == "PENDING_DEPOSIT":
            op.acp_tx_hash = TXID
            op.acp_out_index = 0
            session.add(
                BridgeAuditEvent(
                    operation_id=op.id,
                    event_type="admin_forward_bind_deposit",
                    payload_json={{"acp_tx_hash": TXID, "received_units": received, "operator": True}},
                )
            )
            await append_transition(
                session,
                op,
                "CONFIRMED_ON_ACP",
                metadata={{"admin": True, "txid": TXID, "confirmations": confirmations}},
            )
            await session.commit()
            print("bound deposit -> CONFIRMED_ON_ACP")
        op_id = op.id
    for attempt in range(12):
        async with Session() as session:
            op = await session.get(BridgeOperation, op_id)
            print(f"tick {{attempt+1}} status={{op.status}} mint={{op.bsc_tx_hash_mint}}")
            orch = await tick_orchestrator(session)
            bsc = await tick_bsc_checkpoint(session)
            await session.commit()
            print("orch", orch)
            print("bsc", bsc)
            op = await session.get(BridgeOperation, op_id)
            if op.status == "COMPLETED":
                print("COMPLETED", op.bsc_tx_hash_mint)
                return
        await asyncio.sleep(15)
    raise SystemExit("bridge did not complete in time")

asyncio.run(main())
"""
    # Fix PUBLIC reference in orchestrate - use PUBLIC constant
    orchestrate = orchestrate.replace("user_acp_address=PUBLIC", f"user_acp_address={json.dumps(PUBLIC)}")
    out = ssh_stdin(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api python -",
        orchestrate,
        timeout=900,
    )
    print(out)


def main() -> int:
    state = check_bsc_state()
    print(
        f"BSC signer {state['signer']}: {int(state['bnb_wei'])} wei BNB; "
        f"caps maxSingle={state['max_single']} perDay={state['cap_day']}"
    )

    settings_reserve = ssh(
        f"cd {REMOTE} && docker compose -f docker-compose.prod.yml exec -T api "
        "python -c \"from app.config import get_settings; print(get_settings().bridge_reserve_acp_address)\""
    ).strip()
    print(f"Bridge reserve: {settings_reserve}")
    print(f"BSC mint target: {BSC_TO}")

    pub = walletd(f"balance --rpc {RPC} --address {PUBLIC}")
    print(f"Public before: {pub['acp']} ACP ({pub['utxo_count']} UTXOs)")

    raise_gateway_caps(state)
    ensure_public_fee_dust()

    print(f"=== Transfer {TARGET_ACP} ACP public -> reserve ===")
    transfer = walletd(
        f"transfer --rpc {RPC} --keystore-file {PUBLIC_KS} "
        f"--to {settings_reserve} --amount-acp {TARGET_ACP}"
    )
    print(json.dumps(transfer, indent=2))
    if not transfer.get("accepted"):
        raise RuntimeError("transfer not accepted")
    txid = str(transfer.get("txid") or "").strip()
    if not txid:
        tick(6)
        # scan not implemented here; walletd should return txid after mining
        raise RuntimeError("no txid from transfer; mine more blocks and retry bind manually")
    tick(4)

    complete_bridge_operation(txid, settings_reserve)

    pub_after = walletd(f"balance --rpc {RPC} --address {PUBLIC}")
    reserve_after = walletd(f"balance --rpc {RPC} --address {settings_reserve}")
    print(f"Public after: {pub_after['acp']} ACP")
    print(f"Reserve after: {reserve_after['acp']} ACP")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
