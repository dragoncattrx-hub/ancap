"""FSM orchestrator hooks for bridge rail progression."""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from eth_account import Account
from eth_utils import keccak, to_hex
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

from app.config import get_settings
from app.db.models import BridgeAuditEvent, BridgeOperation, BridgeStateTransition

GATEWAY_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"},
            {"internalType": "bytes32", "name": "depositRef", "type": "bytes32"},
        ],
        "name": "mintWrapped",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


def _acp_amount_decimal_str(acp_smallest: int) -> str:
    return format(Decimal(acp_smallest) / (Decimal(10) ** 8), "f")


def _hot_wallet_transfer(acp_address: str, acp_smallest: int) -> dict:
    from app.api.routers.wallet_acp import (
        _load_or_create_valid_hot_mnemonic,
        _require_acp_rpc_url,
        _run_walletd,
        _scan_chain_transactions,
    )

    mnemonic = _load_or_create_valid_hot_mnemonic()
    rpc_url = _require_acp_rpc_url()
    from_wallet = _run_walletd(["address", "--mnemonic", mnemonic])
    from_address = str(from_wallet.get("address") or "").strip()
    transfer = _run_walletd(
        [
            "transfer",
            "--rpc",
            rpc_url,
            "--mnemonic",
            mnemonic,
            "--to",
            acp_address,
            "--amount-acp",
            _acp_amount_decimal_str(acp_smallest),
        ],
        timeout_s=180,
    )
    txid = str(transfer.get("txid") or "").strip()
    if txid:
        return transfer
    if from_address:
        best_height, _out_index, tx_index = _scan_chain_transactions()
        if best_height > 0:
            candidates: list[tuple[int, str]] = []
            for candidate_txid, tx in tx_index.items():
                sent_units = sum(int(i.get("units") or 0) for i in tx.get("inputs") or [] if i.get("address") == from_address)
                received_units = sum(int(o.get("units") or 0) for o in tx.get("outputs") or [] if o.get("address") == from_address)
                if sent_units <= 0:
                    continue
                payout_units = abs(received_units - sent_units)
                if payout_units != int(acp_smallest):
                    continue
                if not any(str(o.get("address") or "") == acp_address for o in tx.get("outputs") or []):
                    continue
                candidates.append((int(tx.get("block_height") or 0), str(candidate_txid)))
            if candidates:
                candidates.sort(reverse=True)
                resolved = dict(transfer)
                resolved["txid"] = candidates[0][1]
                resolved["txid_source"] = "chain_scan_fallback"
                return resolved
    return transfer


async def append_transition(
    session: AsyncSession,
    op: BridgeOperation,
    to_status: str,
    *,
    metadata: dict | None = None,
) -> None:
    prev = op.status
    op.status = to_status
    op.version = (op.version or 0) + 1
    session.add(
        BridgeStateTransition(
            operation_id=op.id,
            from_status=prev,
            to_status=to_status,
            metadata_json=metadata or {},
        )
    )
    session.add(
        BridgeAuditEvent(
            operation_id=op.id,
            event_type="state_transition",
            payload_json={"from": prev, "to": to_status, **(metadata or {})},
        )
    )


def _make_deposit_ref_hex(op: BridgeOperation) -> str:
    seed = f"{op.id}:{op.acp_tx_hash or ''}:{int(op.acp_out_index or 0)}"
    return to_hex(keccak(text=seed))


def _build_web3(rpc_url: str) -> Web3:
    w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 30}))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return w3


async def tick_orchestrator(session: AsyncSession) -> dict:
    settings = get_settings()
    if not settings.bridge_rail_enabled:
        return {"skipped": True}

    progressed = 0
    progressed_acp_to_bsc = 0
    progressed_bsc_to_acp = 0
    dry_run = settings.bridge_dry_run

    if dry_run:
        mint_ops = (
            await session.execute(
                select(BridgeOperation)
                .where(
                    BridgeOperation.direction == "acp_to_bsc",
                    BridgeOperation.status == "CONFIRMED_ON_ACP",
                )
                .order_by(BridgeOperation.created_at.asc())
            )
        ).scalars().all()

        for op in mint_ops:
            session.add(
                BridgeAuditEvent(
                    operation_id=op.id,
                    event_type="dry_run_mint_simulated",
                    payload_json={
                        "note": "Dry-run mode: BSC mint not submitted; operation advanced for pilot workflow.",
                        "wacp_contract": settings.bridge_wacp_contract,
                        "gateway_contract": settings.bridge_gateway_contract,
                        "amount_wacp_wei": int(op.amount_wacp_wei or 0),
                    },
                )
            )
            await append_transition(
                session,
                op,
                "MINT_REQUESTED",
                metadata={
                    "dry_run": True,
                    "note": "Simulated ACP->BSC mint request in dry-run mode",
                },
            )
            progressed += 1
            progressed_acp_to_bsc += 1

        reverse_ops = (
            await session.execute(
                select(BridgeOperation)
                .where(
                    BridgeOperation.direction == "bsc_to_acp",
                    BridgeOperation.status == "BURN_CONFIRMED",
                    BridgeOperation.acp_tx_hash.is_(None),
                )
                .order_by(BridgeOperation.created_at.asc())
            )
        ).scalars().all()
        for op in reverse_ops:
            fake_txid = f"dryrun-{op.id}"
            op.acp_tx_hash = fake_txid
            op.acp_out_index = 0
            session.add(
                BridgeAuditEvent(
                    operation_id=op.id,
                    event_type="dry_run_acp_payout_simulated",
                    payload_json={
                        "txid": fake_txid,
                        "to": op.user_acp_address,
                        "amount_acp_smallest": int(op.amount_acp_smallest or 0),
                    },
                )
            )
            await append_transition(session, op, "ACP_PAYOUT_SENT", metadata={"dry_run": True, "txid": fake_txid})
            progressed += 1
            progressed_bsc_to_acp += 1

        await session.flush()
        return {
            "ok": True,
            "dry_run": True,
            "progressed": progressed,
            "progressed_acp_to_bsc": progressed_acp_to_bsc,
            "progressed_bsc_to_acp": progressed_bsc_to_acp,
        }

    reverse_ops = (
        await session.execute(
            select(BridgeOperation)
            .where(
                BridgeOperation.direction == "bsc_to_acp",
                BridgeOperation.status == "BURN_CONFIRMED",
                BridgeOperation.acp_tx_hash.is_(None),
            )
            .order_by(BridgeOperation.created_at.asc())
        )
    ).scalars().all()
    for op in reverse_ops:
        transfer = _hot_wallet_transfer(str(op.user_acp_address), int(op.amount_acp_smallest or 0))
        txid = str(transfer.get("txid") or "").strip()
        if not txid:
            raise RuntimeError(f"walletd transfer returned no txid: {transfer}")
        op.acp_tx_hash = txid
        op.acp_out_index = 0
        op.updated_at = datetime.now(timezone.utc)
        session.add(
            BridgeAuditEvent(
                operation_id=op.id,
                event_type="acp_payout_submitted",
                payload_json={
                    "txid": txid,
                    "to": op.user_acp_address,
                    "amount_acp_smallest": int(op.amount_acp_smallest or 0),
                    "amount_acp": _acp_amount_decimal_str(int(op.amount_acp_smallest or 0)),
                    "txid_source": transfer.get("txid_source"),
                },
            )
        )
        await append_transition(session, op, "ACP_PAYOUT_SENT", metadata={"txid": txid, "txid_source": transfer.get("txid_source")})
        progressed += 1
        progressed_bsc_to_acp += 1

    rpc = (settings.bridge_bsc_rpc_url or "").strip()
    gateway_addr = (settings.bridge_gateway_contract or "").strip()
    private_key = (settings.bridge_bsc_private_key or "").strip()
    if not rpc or not gateway_addr or not private_key:
        await session.flush()
        return {
            "ok": False,
            "dry_run": False,
            "progressed": progressed,
            "progressed_acp_to_bsc": progressed_acp_to_bsc,
            "progressed_bsc_to_acp": progressed_bsc_to_acp,
            "error": "missing_bsc_mint_config",
        }

    w3 = _build_web3(rpc)
    acct = Account.from_key(private_key)
    gateway = w3.eth.contract(address=Web3.to_checksum_address(gateway_addr), abi=GATEWAY_ABI)

    ops = (
        await session.execute(
            select(BridgeOperation)
            .where(
                BridgeOperation.direction == "acp_to_bsc",
                BridgeOperation.status == "MINT_REQUESTED",
                BridgeOperation.bsc_tx_hash_mint.is_(None),
            )
            .order_by(BridgeOperation.created_at.asc())
        )
    ).scalars().all()

    for op in ops:
        deposit_ref_hex = op.deposit_ref_hex or _make_deposit_ref_hex(op)
        op.deposit_ref_hex = deposit_ref_hex
        tx = gateway.functions.mintWrapped(
            Web3.to_checksum_address(op.user_bsc_address),
            int(op.amount_wacp_wei),
            bytes.fromhex(deposit_ref_hex[2:]),
        ).build_transaction(
            {
                "from": acct.address,
                "nonce": w3.eth.get_transaction_count(acct.address, "pending"),
                "chainId": int(w3.eth.chain_id),
            }
        )
        gas_estimate = w3.eth.estimate_gas(tx)
        tx["gas"] = int(gas_estimate * 12 // 10)
        try:
            latest_block = w3.eth.get_block("latest")
            base_fee = latest_block.get("baseFeePerGas")
        except Exception:
            base_fee = None
        priority = w3.to_wei(1, "gwei")
        if base_fee is not None:
            tx["maxPriorityFeePerGas"] = priority
            tx["maxFeePerGas"] = int(base_fee) * 2 + priority
            tx.pop("gasPrice", None)
        else:
            tx["gasPrice"] = w3.eth.gas_price
        signed = acct.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hash_hex = tx_hash.hex()
        op.bsc_tx_hash_mint = tx_hash_hex
        session.add(
            BridgeAuditEvent(
                operation_id=op.id,
                event_type="bsc_mint_submitted",
                payload_json={
                    "tx_hash": tx_hash_hex,
                    "deposit_ref_hex": deposit_ref_hex,
                    "amount_wacp_wei": int(op.amount_wacp_wei),
                    "to": op.user_bsc_address,
                },
            )
        )
        progressed += 1
        progressed_acp_to_bsc += 1

    await session.flush()
    return {
        "ok": True,
        "dry_run": False,
        "progressed": progressed,
        "progressed_acp_to_bsc": progressed_acp_to_bsc,
        "progressed_bsc_to_acp": progressed_bsc_to_acp,
    }
