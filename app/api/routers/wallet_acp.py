import json
import os
import subprocess
import re
import time
from datetime import datetime, timezone
from pathlib import Path
import shutil
from decimal import Decimal, InvalidOperation
from uuid import uuid4

import httpx
from fastapi import APIRouter, Header, HTTPException, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.api.deps import require_auth
from app.db.models import Agent, Stake, StakeStatusEnum, Account, LedgerEvent, AcpSwapOrder
from app.db.session import get_db
from app.services.acp_wallet import get_wallet_for_user
from app.services.acp_wallet import decrypt_mnemonic
from app.services.acp_wallet import decode_wallet_secret
from app.services.acp_tokenomics import fetch_custodial_hot_breakdown
from app.schemas import (
    AcpBalanceResponse,
    AcpDepositAddressResponse,
    AcpTokenomicsBucket,
    AcpWithdrawRequest,
    AcpWithdrawResponse,
    AcpTransactionPublic,
    AcpTransactionDetailsPublic,
    AcpTransactionIoPublic,
    AcpSwapQuoteRequest,
    AcpSwapQuoteResponse,
    AcpSwapOrderCreateRequest,
    AcpSwapOrderConfirmRequest,
    AcpSwapOrderPublic,
    AcpSwapCompleteResponse,
    AcpSwapCompleteRequest,
)


router = APIRouter(prefix="/wallet/acp", tags=["Wallet (ACP)"])

_CHAIN_SCAN_CACHE_TTL_S = 15.0
_chain_scan_cache: dict[str, object] = {
    "expires_at": 0.0,
    "data": None,
}

_CHAIN_BALANCE_CACHE_TTL_S = 15.0
_chain_balance_cache: dict[str, tuple[float, dict]] = {}


def _walletd_cmd() -> list[str]:
    """
    Uses a dedicated helper binary implemented in ACP-crypto/acp-wallet/src/bin/walletd.rs.
    For production set ACP_WALLETD_PATH to the compiled binary path.
    """
    p = os.getenv("ACP_WALLETD_PATH", "").strip()
    if p:
        return [p]
    # Fallback to PATH lookup to simplify container deployments where walletd is mounted into /usr/local/bin.
    if shutil.which("walletd"):
        return ["walletd"]
    raise HTTPException(
        status_code=503,
        detail="ACP wallet helper is not configured (set ACP_WALLETD_PATH or make 'walletd' available in PATH)",
    )


def _run_walletd(args: list[str], timeout_s: int = 90) -> dict:
    try:
        r = subprocess.run(
            _walletd_cmd() + args,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout_s,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="ACP wallet helper timed out")

    out = (r.stdout or "").strip()
    try:
        payload = json.loads(out) if out else {}
    except Exception:
        raise HTTPException(status_code=502, detail=f"ACP wallet helper returned non-JSON output: {out[:200]}")

    if r.returncode != 0 or not payload.get("ok"):
        err = payload.get("error") or (r.stderr or "").strip() or "unknown"
        raise HTTPException(status_code=502, detail=f"ACP wallet helper failed: {err}")
    return payload["result"]


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _require_non_empty(value: str, field_name: str) -> str:
    out = (value or "").strip()
    if not out:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    return out


_ACP_ADDRESS_RE = re.compile(r"^acp1[a-z0-9]{20,100}$")
# Grouping helpers for pasted amounts (withdraw / fees / quotes).
_US_GROUPED_DECIMAL_RE = re.compile(r"^-?\d{1,3}(,\d{3})+(\.\d*)?$")
_EU_GROUPED_DECIMAL_RE = re.compile(r"^-?\d{1,3}(\.\d{3})+(,\d+)?$")


def _normalize_user_decimal_string(raw: object) -> str:
    """
    Strip wrappers and grouping so Decimal() accepts common user input:
    1,000,000 · 1.234.567,89 · 12,34 · trailing 'ACP' / NBSP.
    """
    if raw is None:
        return ""
    s = str(raw).strip()
    if not s:
        return ""
    for ch in ("\u00a0", "\u202f", "\u2009", "\u2007", " "):
        s = s.replace(ch, "")
    s = s.replace("\u2212", "-").replace("−", "-").replace("＋", "+")
    s = re.sub(r"(?i)(?:acp|токен)\s*$", "", s).strip()
    if not s:
        return ""

    if _US_GROUPED_DECIMAL_RE.fullmatch(s):
        return s.replace(",", "")
    if _EU_GROUPED_DECIMAL_RE.fullmatch(s):
        if "," in s:
            body, frac = s.rsplit(",", 1)
            return body.replace(".", "") + "." + frac
        return s.replace(".", "")

    if "," in s and "." not in s:
        parts = s.split(",")
        if len(parts) == 2:
            left, right = parts
            ld = left.lstrip("-")
            if ld.isdigit() and right.isdigit():
                if len(right) <= 2:
                    return f"{left}.{right}"
                if len(right) == 3 and len(ld) <= 3:
                    return f"{left}{right}"
                return f"{left}.{right}"
        return s.replace(",", "")

    return s


def _parse_positive_decimal(value: object, field_name: str) -> Decimal:
    normalized = _normalize_user_decimal_string(value)
    if not normalized:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    try:
        d = Decimal(normalized)
    except (InvalidOperation, ValueError):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    if d <= 0:
        raise HTTPException(status_code=400, detail=f"{field_name} must be > 0")
    return d


def _validate_acp_address(value: str, field_name: str) -> str:
    out = _require_non_empty(value, field_name)
    if not _ACP_ADDRESS_RE.fullmatch(out):
        raise HTTPException(
            status_code=400,
            detail=(
                f"{field_name} is invalid; expected ACP bech32-like address "
                "starting with 'acp1' and containing lowercase letters/digits"
            ),
        )
    return out


def _require_acp_rpc_url() -> str:
    settings = get_settings()
    rpc = (settings.acp_rpc_url or "").strip()
    if not rpc:
        raise HTTPException(status_code=503, detail="ACP RPC URL is not configured")
    return rpc


def _swap_rate() -> Decimal:
    settings = get_settings()
    return _parse_positive_decimal(settings.usdt_trc20_to_acp_rate, "USDT/ACP rate")


def _decimal_to_api_str(value: Decimal, scale: str = "0.00000001") -> str:
    """
    Render Decimal as plain string (no scientific notation) with trailing zeros trimmed.
    """
    q = value.quantize(Decimal(scale))
    s = format(q, "f").rstrip("0").rstrip(".")
    return s or "0"


def _units_to_acp_str(units: int) -> str:
    return _decimal_to_api_str(Decimal(units) / Decimal(100_000_000))


def _acp_timestamp(ts: int) -> str:
    return datetime.fromtimestamp(ts, timezone.utc).isoformat().replace("+00:00", "Z")


def _json_chain_amount_to_int(value: object) -> int:
    """Parse RPC getblock vout/vin amounts without silent float precision loss."""
    if value is None:
        return 0
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return 0
        try:
            return int(Decimal(s))
        except (InvalidOperation, ValueError):
            return 0
    if isinstance(value, float):
        try:
            return int(Decimal(str(value)))
        except (InvalidOperation, ValueError):
            return 0
    try:
        return int(Decimal(str(value)))
    except (InvalidOperation, ValueError):
        return 0


def _parse_decimal_or_zero(value: str | int | float | Decimal | None) -> Decimal:
    try:
        if value is None:
            return Decimal(0)
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return Decimal(0)


async def _in_work_breakdown_for_user(
    session: AsyncSession, user_id: str
) -> tuple[Decimal, Decimal, Decimal]:
    """
    Return (total_in_work, staked_acp, ledger_positive_net_acp).

    `staked_acp` counts active ACP stakes on user-owned agents.
    `ledger_positive_net_acp` sums max(net, 0) per user + those agents’ ledger accounts
    (fluid balances still on-platform). Together they cap what we allow to withdraw on-chain
    so the same ACP is not spent twice.
    """
    try:
        owner_user_id = user_id.strip()
    except Exception:
        return (Decimal(0), Decimal(0), Decimal(0))
    if not owner_user_id:
        return (Decimal(0), Decimal(0), Decimal(0))
    stake_q = (
        select(func.coalesce(func.sum(Stake.amount_value), 0))
        .select_from(Stake)
        .join(Agent, Agent.id == Stake.agent_id)
        .where(
            Agent.owner_user_id == owner_user_id,
            Stake.status == StakeStatusEnum.active,
            Stake.amount_currency == "ACP",
        )
    )
    stake_result = await session.execute(stake_q)
    staked_acp = _parse_decimal_or_zero(stake_result.scalar())

    agent_ids = (
        await session.execute(select(Agent.id).where(Agent.owner_user_id == owner_user_id))
    ).scalars().all()
    owner_filters = [(Account.owner_type == "user", Account.owner_id == owner_user_id)]
    if agent_ids:
        owner_filters.append((Account.owner_type == "agent", Account.owner_id.in_(agent_ids)))

    account_ids = []
    for owner_type_cond, owner_id_cond in owner_filters:
        rows = (
            await session.execute(
                select(Account.id).where(owner_type_cond, owner_id_cond)
            )
        ).scalars().all()
        account_ids.extend(rows)

    # Stable unique ordering; avoids double-counting if a bug ever duplicates ids.
    account_ids = list(dict.fromkeys(account_ids))

    if not account_ids:
        return (staked_acp, staked_acp, Decimal(0))

    credits_rows = (
        await session.execute(
            select(LedgerEvent.dst_account_id, func.coalesce(func.sum(LedgerEvent.amount_value), 0))
            .where(
                LedgerEvent.amount_currency == "ACP",
                LedgerEvent.dst_account_id.in_(account_ids),
            )
            .group_by(LedgerEvent.dst_account_id)
        )
    ).all()
    debits_rows = (
        await session.execute(
            select(LedgerEvent.src_account_id, func.coalesce(func.sum(LedgerEvent.amount_value), 0))
            .where(
                LedgerEvent.amount_currency == "ACP",
                LedgerEvent.src_account_id.in_(account_ids),
            )
            .group_by(LedgerEvent.src_account_id)
        )
    ).all()

    credits = {str(k): _parse_decimal_or_zero(v) for k, v in credits_rows}
    debits = {str(k): _parse_decimal_or_zero(v) for k, v in debits_rows}
    ledger_reserved_acp = Decimal(0)
    for acc_id in account_ids:
        key = str(acc_id)
        bal = credits.get(key, Decimal(0)) - debits.get(key, Decimal(0))
        if bal > 0:
            ledger_reserved_acp += bal

    total = staked_acp + ledger_reserved_acp
    return (total, staked_acp, ledger_reserved_acp)


async def _in_work_acp_for_user(session: AsyncSession, user_id: str) -> Decimal:
    total, _, _ = await _in_work_breakdown_for_user(session, user_id)
    return total


def _format_balance_note(real_acp: Decimal, in_work_acp: Decimal, available_acp: Decimal) -> str:
    return (
        f"Real account balance: {_decimal_to_api_str(real_acp)} ACP; "
        f"in work: {_decimal_to_api_str(in_work_acp)} ACP; "
        f"available for withdraw: {_decimal_to_api_str(available_acp)} ACP."
    )


def _format_operator_hot_balance_note(
    tokenomics_total_acp: Decimal,
    platform_credits_acp: Decimal,
    available_acp: Decimal,
) -> str:
    return (
        f"Operator hot on-chain total: {_decimal_to_api_str(tokenomics_total_acp)} ACP "
        f"(operator pool). Platform credits: {_decimal_to_api_str(platform_credits_acp)} ACP; "
        f"available for withdraw: {_decimal_to_api_str(available_acp)} ACP."
    )


def _units_from_acp(acp: Decimal) -> str:
    return str(int((acp * Decimal(100_000_000)).to_integral_value()))


def _custodial_balance_view(
    on_chain_acp: Decimal,
    staked_acp: Decimal,
    ledger_acp: Decimal,
) -> tuple[Decimal, Decimal, Decimal]:
    """Map mixed custodial hot UTXOs to ledger-backed user entitlement."""
    entitlement = staked_acp + ledger_acp
    if entitlement <= 0:
        available = on_chain_acp - staked_acp
        if available < 0:
            available = Decimal(0)
        return on_chain_acp, staked_acp + ledger_acp, available
    display_acp = min(on_chain_acp, entitlement)
    available = min(ledger_acp, max(on_chain_acp - staked_acp, Decimal(0)))
    if available < 0:
        available = Decimal(0)
    return display_acp, entitlement, available


def _creator_vesting_monthly_unlock_acp() -> Decimal:
    # 69,300,000 ACP over 72 months after a 12-month cliff.
    return Decimal("962500")


# `acp_crypto::protocol_params::{GENESIS_ACP_CREATOR, UNITS_PER_ACP}`.
_GENESIS_ACP_CREATOR_AMOUNT_ACP: int = 69_300_000
_UNITS_PER_ACP: int = 100_000_000
_GENESIS_CREATOR_OUTPUT_UNITS: int = _GENESIS_ACP_CREATOR_AMOUNT_ACP * _UNITS_PER_ACP


def _creator_vesting_snapshot(address: str, now_ts: int | None = None) -> tuple[Decimal, Decimal] | None:
    """
    Return (unlocked_acp, locked_acp) for the canonical creator genesis vout, otherwise None.

    The node applies vesting only to genesis tx vout 0. UI must not treat every
    genesis payee as the vested creator (e.g. a 1,000,000 ACP dev allocation on vout 0).
    We only return fields when vout 0 is exactly 69,300,000 ACP to the queried address.
    """
    rpc_url = _require_acp_rpc_url()
    bh = _rpc_call(rpc_url, "getblockhash", {"height": 1})
    block = _rpc_call(rpc_url, "getblock", {"blockhash": bh, "verbose": 2}) or {}
    txs = block.get("tx") or []
    if not txs:
        return None
    genesis_tx = txs[0] or {}
    outputs = genesis_tx.get("vout") or []
    if not outputs:
        return None
    vout0 = outputs[0] or {}
    if str(vout0.get("recipient_address") or "").strip() != (address or "").strip():
        return None
    try:
        creator_total_units = _json_chain_amount_to_int(vout0.get("amount"))
    except (TypeError, ValueError):
        return None
    if creator_total_units != _GENESIS_CREATOR_OUTPUT_UNITS:
        return None

    creator_total_acp = Decimal(creator_total_units) / Decimal(100_000_000)
    genesis_time = int(block.get("time") or 0)
    now = int(now_ts or datetime.now(timezone.utc).timestamp())

    if now <= genesis_time:
        return (Decimal(0), creator_total_acp)

    elapsed = now - genesis_time
    seconds_per_month = 30 * 24 * 60 * 60
    cliff_months = 12
    linear_months = 72

    if elapsed <= cliff_months * seconds_per_month:
        unlocked = Decimal(0)
    else:
        months_after_cliff = min((elapsed - cliff_months * seconds_per_month) // seconds_per_month, linear_months)
        unlocked = _creator_vesting_monthly_unlock_acp() * Decimal(months_after_cliff)
        if unlocked > creator_total_acp:
            unlocked = creator_total_acp
    locked = creator_total_acp - unlocked
    if locked < 0:
        locked = Decimal(0)
    return (unlocked, locked)


async def _decorate_balance_for_user(
    session: AsyncSession,
    user_id: str,
    raw: dict,
    *,
    include_in_work: bool,
) -> AcpBalanceResponse:
    on_chain_acp = _parse_decimal_or_zero(raw.get("acp"))
    if include_in_work:
        in_work_acp, in_staked, in_ledger = await _in_work_breakdown_for_user(session, user_id)
        real_acp, in_work_acp, available_acp = _custodial_balance_view(
            on_chain_acp, in_staked, in_ledger
        )
    else:
        in_work_acp = in_staked = in_ledger = Decimal(0)
        real_acp = on_chain_acp
        available_acp = on_chain_acp
    in_work_staked_s = _decimal_to_api_str(in_staked) if include_in_work else None
    in_work_ledger_s = _decimal_to_api_str(in_ledger) if include_in_work else None
    vested_unlocked_acp: str | None = None
    vested_locked_acp: str | None = None
    target_address = str(raw.get("address") or "").strip()
    if target_address:
        try:
            vest = _creator_vesting_snapshot(target_address)
        except HTTPException:
            vest = None
        if vest is not None:
            vested_unlocked_acp = _decimal_to_api_str(vest[0])
            vested_locked_acp = _decimal_to_api_str(vest[1])
    on_chain_s = (
        _decimal_to_api_str(on_chain_acp)
        if include_in_work and on_chain_acp != real_acp
        else None
    )
    display_acp = real_acp
    display_units = _units_from_acp(real_acp)
    display_utxo_count = int(raw.get("utxo_count") or 0)
    tokenomics_buckets: list[AcpTokenomicsBucket] | None = None
    view_mode: str | None = None
    platform_credits_s: str | None = None
    balance_note = _format_balance_note(real_acp, in_work_acp, available_acp)

    if include_in_work and target_address:
        try:
            hot_breakdown = await fetch_custodial_hot_breakdown(target_address)
        except Exception:
            hot_breakdown = None
        if hot_breakdown is not None:
            display_acp = hot_breakdown.total_acp
            display_units = _units_from_acp(hot_breakdown.total_acp)
            display_utxo_count = hot_breakdown.total_utxo_count
            tokenomics_buckets = [
                AcpTokenomicsBucket(
                    key=b.key,
                    label=b.label,
                    acp=_decimal_to_api_str(b.acp),
                    utxo_count=b.utxo_count,
                )
                for b in hot_breakdown.buckets
            ]
            view_mode = "operator_hot"
            platform_credits_s = _decimal_to_api_str(real_acp)
            on_chain_s = None
            balance_note = _format_operator_hot_balance_note(
                hot_breakdown.total_acp, real_acp, available_acp
            )

    return AcpBalanceResponse(
        address=str(raw.get("address") or ""),
        units=display_units,
        acp=_decimal_to_api_str(display_acp),
        utxo_count=display_utxo_count,
        on_chain_acp=on_chain_s,
        in_work_acp=_decimal_to_api_str(in_work_acp),
        in_work_staked_acp=in_work_staked_s,
        in_work_ledger_acp=in_work_ledger_s,
        available_acp=_decimal_to_api_str(available_acp),
        platform_credits_acp=platform_credits_s,
        tokenomics_buckets=tokenomics_buckets,
        view_mode=view_mode,
        vested_unlocked_acp=vested_unlocked_acp,
        vested_locked_acp=vested_locked_acp,
        balance_note=balance_note,
    )


def _rpc_call(rpc_url: str, method: str, params: list | dict | None = None):
    from app.services.acp_rpc import acp_rpc_headers

    body = {"jsonrpc": "2.0", "id": "wallet-acp-history", "method": method, "params": params or []}
    try:
        r = httpx.post(rpc_url, json=body, headers=acp_rpc_headers(), timeout=30.0)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"ACP RPC request failed: {exc}")
    try:
        payload = r.json()
    except Exception:
        raise HTTPException(status_code=502, detail=f"ACP RPC returned non-JSON response: {(r.text or '')[:160]}")
    if r.status_code != 200:
        detail = payload.get("error") if isinstance(payload, dict) else None
        raise HTTPException(status_code=502, detail=f"ACP RPC status {r.status_code}: {detail or 'unknown'}")
    if payload.get("error"):
        raise HTTPException(status_code=502, detail=f"ACP RPC error: {payload['error']}")
    return payload.get("result")


def _rpc_balance_for_address(address: str) -> dict:
    target = (address or "").strip()
    if not target:
        raise HTTPException(status_code=400, detail="address is required")

    now = time.monotonic()
    cached = _chain_balance_cache.get(target)
    if cached is not None:
        expires_at, payload = cached
        if now < expires_at:
            return dict(payload)

    rpc_url = _require_acp_rpc_url()
    best_height = int(_rpc_call(rpc_url, "getblockcount", []) or 0)
    if best_height <= 0:
        payload = {"address": target, "units": "0", "acp": "0", "utxo_count": 0}
        _chain_balance_cache[target] = (now + _CHAIN_BALANCE_CACHE_TTL_S, payload)
        return dict(payload)

    unspent: dict[str, int] = {}
    spent: set[str] = set()

    for height in range(1, best_height + 1):
        block_hash = _rpc_call(rpc_url, "getblockhash", {"height": height})
        block = _rpc_call(rpc_url, "getblock", {"blockhash": block_hash, "verbose": 2}) or {}
        txs = block.get("tx") or []

        for tx in txs:
            txid = str(tx.get("txid") or "")
            if not txid:
                continue

            for vin in tx.get("vin") or []:
                prev_txid = vin.get("prev_txid")
                prev_vout = vin.get("vout")
                if prev_txid is None or prev_vout is None:
                    continue
                key = f"{prev_txid}:{int(prev_vout)}"
                spent.add(key)
                unspent.pop(key, None)

            for idx, vout in enumerate(tx.get("vout") or []):
                out_addr = str(vout.get("recipient_address") or "")
                if out_addr != target:
                    continue
                key = f"{txid}:{idx}"
                if key in spent:
                    continue
                unspent[key] = _json_chain_amount_to_int(vout.get("amount"))

    units = sum(unspent.values())
    payload = {
        "address": target,
        "units": str(units),
        "acp": _units_to_acp_str(units),
        "utxo_count": len(unspent),
    }
    _chain_balance_cache[target] = (time.monotonic() + _CHAIN_BALANCE_CACHE_TTL_S, payload)
    return dict(payload)


def _load_balance_result(address: str) -> dict:
    target = (address or "").strip()
    if not target:
        raise HTTPException(status_code=400, detail="address is required")
    rpc_url = _require_acp_rpc_url()
    try:
        return _run_walletd(["balance", "--rpc", rpc_url, "--address", target], timeout_s=180)
    except HTTPException as exc:
        if exc.status_code not in (502, 503, 504):
            raise
        return _rpc_balance_for_address(target)


def _to_public_order(order: dict) -> AcpSwapOrderPublic:
    return AcpSwapOrderPublic(**order)


def _swap_row_to_dict(row: AcpSwapOrder) -> dict:
    return {
        "id": str(row.id),
        "user_id": str(row.user_id),
        "status": str(row.status),
        "usdt_trc20_amount": _decimal_to_api_str(_parse_decimal_or_zero(row.usdt_trc20_amount)),
        "rate_acp_per_usdt": _decimal_to_api_str(_parse_decimal_or_zero(row.rate_acp_per_usdt)),
        "estimated_acp_amount": _decimal_to_api_str(_parse_decimal_or_zero(row.estimated_acp_amount)),
        "payout_acp_address": str(row.payout_acp_address),
        "deposit_trc20_address": str(row.deposit_trc20_address),
        "deposit_reference": str(row.deposit_reference),
        "tron_txid": row.tron_txid,
        "payout_txid": row.payout_txid,
        "note": row.note,
        "created_at": (row.created_at or datetime.now(timezone.utc)).isoformat().replace("+00:00", "Z"),
        "updated_at": (row.updated_at or datetime.now(timezone.utc)).isoformat().replace("+00:00", "Z"),
    }


async def _get_user_wallet_signer(session: AsyncSession, user_id: str, wallet_password: str) -> dict[str, str]:
    wallet = await get_wallet_for_user(session, user_id)
    if wallet is None:
        raise HTTPException(
            status_code=409,
            detail="ACP wallet is not initialized for this account. Please sign in again.",
        )
    try:
        secret = decrypt_mnemonic(
            encrypted_mnemonic=wallet.encrypted_mnemonic,
            salt_b64=wallet.salt_b64,
            nonce_b64=wallet.nonce_b64,
            password=wallet_password,
        )
        mnemonic, keystore_json = decode_wallet_secret(secret)
        if keystore_json:
            return {"keystore_json": keystore_json, "mnemonic": mnemonic}
        return {"mnemonic": mnemonic}
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid wallet password")


def _hot_mnemonic_path() -> Path:
    p = os.getenv("ACP_HOT_MNEMONIC_FILE", "/run/secrets/acp_hot_mnemonic.txt")
    return Path(p)


def _hot_keystore_path() -> Path:
    p = os.getenv("ACP_HOT_KEYSTORE_FILE", "/run/secrets/acp_hot_keystore.json")
    return Path(p)


def _normalize_mnemonic_text(raw: str) -> str:
    return " ".join([w for w in str(raw or "").split() if w.strip()])


def _load_or_create_hot_mnemonic() -> str:
    env = os.getenv("ACP_HOT_MNEMONIC", "").strip()
    if env:
        return _normalize_mnemonic_text(env)
    p = _hot_mnemonic_path()
    if p.exists():
        txt = p.read_text(encoding="utf-8").strip()
        words = [w for w in txt.split() if w.strip()]
        if len(words) in (12, 15, 18, 21, 24):
            return " ".join(words)
        # Corrupt/partial file: regenerate to keep wallet usable.
        try:
            p.rename(p.with_suffix(p.suffix + ".bad"))
        except Exception:
            pass
    p.parent.mkdir(parents=True, exist_ok=True)
    created = _run_walletd(["new"])
    mnemonic = _normalize_mnemonic_text(str(created["mnemonic"]))
    p.write_text(mnemonic + "\n", encoding="utf-8")
    return mnemonic


def _load_or_create_valid_hot_mnemonic() -> str:
    """
    Ensure mnemonic is not only structurally valid, but also accepted by walletd.
    If corrupted (e.g. bad checksum), rotate broken file and regenerate.
    """
    mnemonic = _load_or_create_hot_mnemonic()
    try:
        _run_walletd(["address", "--mnemonic", mnemonic])
        return mnemonic
    except HTTPException as exc:
        if "mnemonic" not in str(exc.detail).lower():
            raise
        p = _hot_mnemonic_path()
        if p.exists():
            try:
                p.rename(p.with_suffix(p.suffix + ".bad"))
            except Exception:
                pass
        created = _run_walletd(["new"])
        new_mnemonic = _normalize_mnemonic_text(str(created["mnemonic"]))
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(new_mnemonic + "\n", encoding="utf-8")
        _run_walletd(["address", "--mnemonic", new_mnemonic])
        return new_mnemonic


def _load_existing_valid_hot_mnemonic() -> str:
    """
    Strict bridge/operator loader for mnemonic-based signers.
    Never creates or rotates signer material implicitly.
    Operator secrets must fail closed, not mutate themselves.
    """
    env = os.getenv("ACP_HOT_MNEMONIC", "").strip()
    if env:
        mnemonic = _normalize_mnemonic_text(env)
        if len(mnemonic.split()) not in (12, 15, 18, 21, 24):
            raise HTTPException(status_code=500, detail="ACP_HOT_MNEMONIC is malformed")
        _run_walletd(["address", "--mnemonic", mnemonic])
        return mnemonic

    p = _hot_mnemonic_path()
    if not p.exists():
        raise HTTPException(status_code=500, detail=f"ACP hot mnemonic file is missing: {p}")

    txt = p.read_text(encoding="utf-8").strip()
    words = [w for w in txt.split() if w.strip()]
    if len(words) not in (12, 15, 18, 21, 24):
        raise HTTPException(status_code=500, detail=f"ACP hot mnemonic file is malformed: {p}")

    mnemonic = " ".join(words)
    _run_walletd(["address", "--mnemonic", mnemonic])
    return mnemonic


def _load_existing_valid_hot_signer() -> tuple[list[str], str]:
    """
    Strict bridge/operator signer loader.
    Prefers keystore because ACP hybrid identities include PQC material that is not
    reproducible from mnemonic alone. Falls back to mnemonic only when no keystore is configured.
    Returns (walletd_signer_args, derived_address).
    """
    env_keystore = os.getenv("ACP_HOT_KEYSTORE_JSON", "").strip()
    if env_keystore:
        derived = _run_walletd(["address", "--keystore-json", env_keystore])
        address = str(derived.get("address") or "").strip()
        if not address:
            raise HTTPException(status_code=500, detail="ACP hot keystore env did not derive an address")
        return (["--keystore-json", env_keystore], address)

    keystore_file = os.getenv("ACP_HOT_KEYSTORE_FILE", "").strip()
    if keystore_file:
        p = Path(keystore_file)
        if not p.exists():
            raise HTTPException(status_code=500, detail=f"ACP hot keystore file is missing: {p}")
        keystore_json = p.read_text(encoding="utf-8").strip()
        if not keystore_json:
            raise HTTPException(status_code=500, detail=f"ACP hot keystore file is empty: {p}")
        derived = _run_walletd(["address", "--keystore-json", keystore_json])
        address = str(derived.get("address") or "").strip()
        if not address:
            raise HTTPException(status_code=500, detail=f"ACP hot keystore file did not derive an address: {p}")
        return (["--keystore-json", keystore_json], address)

    mnemonic = _load_existing_valid_hot_mnemonic()
    derived = _run_walletd(["address", "--mnemonic", mnemonic])
    address = str(derived.get("address") or "").strip()
    if not address:
        raise HTTPException(status_code=500, detail="ACP hot mnemonic did not derive an address")
    return (["--mnemonic", mnemonic], address)


def _scan_chain_transactions() -> tuple[int, dict[tuple[str, int], tuple[str, int]], dict[str, dict]]:
    now = time.monotonic()
    cached = _chain_scan_cache.get("data")
    expires_at = float(_chain_scan_cache.get("expires_at") or 0.0)
    if cached is not None and now < expires_at:
        return cached  # type: ignore[return-value]

    rpc_url = _require_acp_rpc_url()
    best_height = int(_rpc_call(rpc_url, "getblockcount", []) or 0)
    if best_height <= 0:
        data = (0, {}, {})
        _chain_scan_cache["data"] = data
        _chain_scan_cache["expires_at"] = now + _CHAIN_SCAN_CACHE_TTL_S
        return data

    out_index: dict[tuple[str, int], tuple[str, int]] = {}
    tx_index: dict[str, dict] = {}

    for height in range(1, best_height + 1):
        block_hash = _rpc_call(rpc_url, "getblockhash", {"height": height})
        block = _rpc_call(rpc_url, "getblock", {"blockhash": block_hash, "verbose": 2}) or {}
        block_time = int(block.get("time") or 0)
        txs = block.get("tx") or []

        for tx in txs:
            txid = str(tx.get("txid") or "")
            if not txid:
                continue

            inputs: list[dict] = []
            total_input_units = 0
            for vin in tx.get("vin") or []:
                prev_txid = vin.get("prev_txid")
                prev_vout = vin.get("vout")
                if prev_txid is None or prev_vout is None:
                    continue
                key = (str(prev_txid), int(prev_vout))
                prev_out = out_index.get(key)
                prev_address = prev_out[0] if prev_out else None
                prev_units = int(prev_out[1]) if prev_out else 0
                total_input_units += prev_units
                inputs.append(
                    {
                        "address": prev_address,
                        "units": prev_units,
                        "vout": int(prev_vout),
                    }
                )

            outputs: list[dict] = []
            total_output_units = 0
            for idx, vout in enumerate(tx.get("vout") or []):
                out_addr = str(vout.get("recipient_address") or "")
                out_amount = _json_chain_amount_to_int(vout.get("amount"))
                out_index[(txid, idx)] = (out_addr, out_amount)
                total_output_units += out_amount
                outputs.append(
                    {
                        "address": out_addr or None,
                        "units": out_amount,
                        "vout": idx,
                    }
                )

            tx_index[txid] = {
                "txid": txid,
                "block_height": height,
                "block_hash": str(block_hash),
                "block_time": _acp_timestamp(block_time) if block_time > 0 else _utc_now_iso(),
                "confirmations": (best_height - height + 1),
                "inputs": inputs,
                "outputs": outputs,
                "total_input_units": total_input_units,
                "total_output_units": total_output_units,
                "fee_units": max(total_input_units - total_output_units, 0),
            }

    data = (best_height, out_index, tx_index)
    _chain_scan_cache["data"] = data
    _chain_scan_cache["expires_at"] = time.monotonic() + _CHAIN_SCAN_CACHE_TTL_S
    return data


def _chain_transactions_for_address(address: str, limit: int) -> list[AcpTransactionPublic]:
    best_height, _out_index, tx_index = _scan_chain_transactions()
    if best_height <= 0:
        return []

    rows: list[AcpTransactionPublic] = []

    for tx in tx_index.values():
        sent_units = sum(int(i.get("units") or 0) for i in tx["inputs"] if i.get("address") == address)
        received_units = sum(int(o.get("units") or 0) for o in tx["outputs"] if o.get("address") == address)

        if sent_units == 0 and received_units == 0:
            continue

        net_units = received_units - sent_units
        if sent_units > 0 and received_units > 0 and net_units == 0:
            direction = "self"
        elif net_units < 0:
            direction = "out"
        else:
            direction = "in"

        rows.append(
            AcpTransactionPublic(
                txid=tx["txid"],
                block_height=int(tx["block_height"]),
                block_time=str(tx["block_time"]),
                confirmations=int(tx["confirmations"]),
                direction=direction,
                sent_units=str(sent_units),
                sent_acp=_units_to_acp_str(sent_units),
                received_units=str(received_units),
                received_acp=_units_to_acp_str(received_units),
                net_units=str(net_units),
                net_acp=_units_to_acp_str(net_units),
            )
        )

    rows.sort(key=lambda x: (x.block_height, x.txid), reverse=True)
    return rows[:limit]


def _chain_transaction_details(txid: str) -> AcpTransactionDetailsPublic | None:
    _best_height, _out_index, tx_index = _scan_chain_transactions()
    tx = tx_index.get(txid)
    if tx is None:
        return None
    return AcpTransactionDetailsPublic(
        txid=str(tx["txid"]),
        block_height=int(tx["block_height"]),
        block_hash=str(tx.get("block_hash") or "") or None,
        block_time=str(tx["block_time"]),
        confirmations=int(tx["confirmations"]),
        total_input_units=str(int(tx["total_input_units"])),
        total_input_acp=_units_to_acp_str(int(tx["total_input_units"])),
        total_output_units=str(int(tx["total_output_units"])),
        total_output_acp=_units_to_acp_str(int(tx["total_output_units"])),
        fee_units=str(int(tx["fee_units"])),
        fee_acp=_units_to_acp_str(int(tx["fee_units"])),
        inputs=[
            AcpTransactionIoPublic(
                address=(item.get("address") if item.get("address") else None),
                units=str(int(item.get("units") or 0)),
                acp=_units_to_acp_str(int(item.get("units") or 0)),
                vout=(int(item["vout"]) if item.get("vout") is not None else None),
            )
            for item in tx["inputs"]
        ],
        outputs=[
            AcpTransactionIoPublic(
                address=(item.get("address") if item.get("address") else None),
                units=str(int(item.get("units") or 0)),
                acp=_units_to_acp_str(int(item.get("units") or 0)),
                vout=(int(item["vout"]) if item.get("vout") is not None else None),
            )
            for item in tx["outputs"]
        ],
    )


@router.post("/deposit_address", response_model=AcpDepositAddressResponse)
async def get_deposit_address(
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    wallet = await get_wallet_for_user(session, user_id)
    if wallet is None:
        raise HTTPException(
            status_code=409,
            detail="ACP wallet is not initialized for this account. Please sign in again.",
        )
    return AcpDepositAddressResponse(address=wallet.address)


@router.get("/hot/balance", response_model=AcpBalanceResponse)
async def hot_balance(
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    wallet = await get_wallet_for_user(session, user_id)
    if wallet is None:
        raise HTTPException(
            status_code=409,
            detail="ACP wallet is not initialized for this account. Please sign in again.",
        )
    addr = wallet.address
    try:
        res = _load_balance_result(addr)
    except HTTPException:
        # Keep wallet UI operational even when RPC is temporarily unavailable.
        res = {"address": addr, "units": "0", "acp": "0", "utxo_count": 0}
    return await _decorate_balance_for_user(session, user_id, res, include_in_work=True)


@router.get("/balance", response_model=AcpBalanceResponse)
async def balance(
    address: str | None = Query(default=None),
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    wallet = await get_wallet_for_user(session, user_id)
    target = (address or "").strip()
    if not target:
        if wallet is None:
            raise HTTPException(
                status_code=409,
                detail="ACP wallet is not initialized for this account. Please sign in again.",
            )
        target = wallet.address
    if len(target) < 16:
        raise HTTPException(status_code=400, detail="address looks invalid")
    include_in_work = bool(wallet and wallet.address == target)
    try:
        res = _load_balance_result(target)
    except HTTPException:
        # Keep wallet UI operational when RPC/balance helper is temporarily unavailable.
        res = {"address": target, "units": "0", "acp": "0", "utxo_count": 0}
    return await _decorate_balance_for_user(
        session,
        user_id,
        res,
        include_in_work=include_in_work,
    )


@router.get("/transactions", response_model=list[AcpTransactionPublic])
async def list_transactions(
    address: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    target = (address or "").strip()
    if not target:
        wallet = await get_wallet_for_user(session, user_id)
        if wallet is None:
            raise HTTPException(
                status_code=409,
                detail="ACP wallet is not initialized for this account. Please sign in again.",
            )
        target = wallet.address
    if len(target) < 16:
        raise HTTPException(status_code=400, detail="address looks invalid")
    try:
        return _chain_transactions_for_address(target, limit)
    except HTTPException as exc:
        # Keep wallet UI usable when node RPC is temporarily unavailable.
        if exc.status_code in (502, 503, 504):
            return []
        raise


@router.get("/transactions/{txid}", response_model=AcpTransactionDetailsPublic)
async def get_transaction_details(txid: str):
    txid_norm = (txid or "").strip()
    if len(txid_norm) < 16:
        raise HTTPException(status_code=400, detail="txid looks invalid")
    try:
        details = _chain_transaction_details(txid_norm)
    except HTTPException as exc:
        if exc.status_code in (502, 503, 504):
            raise HTTPException(status_code=503, detail="ACP transaction lookup is temporarily unavailable") from exc
        raise
    if details is None:
        raise HTTPException(status_code=404, detail="ACP transaction not found")
    return details


@router.post("/withdraw", response_model=AcpWithdrawResponse)
async def withdraw(
    body: AcpWithdrawRequest,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    rpc_url = _require_acp_rpc_url()
    wallet = await get_wallet_for_user(session, user_id)
    if wallet is None:
        raise HTTPException(
            status_code=409,
            detail="ACP wallet is not initialized for this account. Please sign in again.",
        )
    signer = await _get_user_wallet_signer(session, user_id, body.wallet_password)
    if signer.get("keystore_json"):
        derived = _run_walletd(["address", "--keystore-json", signer["keystore_json"]], timeout_s=60)
    else:
        derived = _run_walletd(["address", "--mnemonic", signer["mnemonic"]], timeout_s=60)
    derived_address = str(derived.get("address") or "").strip()
    if not derived_address or derived_address != wallet.address:
        raise HTTPException(
            status_code=409,
            detail=(
                "Wallet key mismatch for this address. "
                "This wallet was created with a legacy non-deterministic key flow and cannot sign spends for the stored address. "
                "Please create/migrate to a new wallet."
            ),
        )
    to_address = _validate_acp_address(body.to_address, "to_address")
    amount = _parse_positive_decimal(body.amount_acp, "amount_acp")
    fee: Decimal | None = None
    if body.fee_acp is not None and str(body.fee_acp).strip():
        fee = _parse_positive_decimal(body.fee_acp, "fee_acp")
    balance_res = _load_balance_result(wallet.address)
    on_chain_acp = _parse_decimal_or_zero(balance_res.get("acp"))
    _, in_staked, in_ledger = await _in_work_breakdown_for_user(session, user_id)
    _, _, available_acp = _custodial_balance_view(on_chain_acp, in_staked, in_ledger)
    in_work_acp = in_staked + in_ledger
    fee_for_check = fee if fee is not None else (Decimal(1) / Decimal(100_000_000))
    required_total = amount + fee_for_check
    if required_total > available_acp:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Requested {_decimal_to_api_str(amount)} ACP + fee {_decimal_to_api_str(fee_for_check)} ACP "
                f"exceeds available {_decimal_to_api_str(available_acp)} ACP "
                f"(in work: {_decimal_to_api_str(in_work_acp)} ACP)."
            ),
        )

    res = _run_walletd(
        (
            [
                "transfer",
                "--rpc",
                rpc_url,
                *(
                    ["--keystore-json", signer["keystore_json"]]
                    if signer.get("keystore_json")
                    else ["--mnemonic", signer["mnemonic"]]
                ),
                "--to",
                to_address,
                "--amount-acp",
                _decimal_to_api_str(amount),
            ]
            + (["--fee-acp", _decimal_to_api_str(fee)] if fee is not None else [])
        ),
        timeout_s=180,
    )
    return AcpWithdrawResponse(**res)


@router.post("/swap/quote", response_model=AcpSwapQuoteResponse)
def swap_quote(body: AcpSwapQuoteRequest):
    amount = _parse_positive_decimal(body.usdt_trc20_amount, "usdt_trc20_amount")
    rate = _swap_rate()
    estimated = (amount * rate).quantize(Decimal("0.00000001"))
    return AcpSwapQuoteResponse(
        usdt_trc20_amount=_decimal_to_api_str(amount),
        rate_acp_per_usdt=_decimal_to_api_str(rate),
        estimated_acp_amount=_decimal_to_api_str(estimated),
    )


@router.post("/swap/orders", response_model=AcpSwapOrderPublic)
async def create_swap_order(
    body: AcpSwapOrderCreateRequest,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
    x_idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    amount = _parse_positive_decimal(body.usdt_trc20_amount, "usdt_trc20_amount")
    rate = _swap_rate()
    estimated = (amount * rate).quantize(Decimal("0.00000001"))
    settings = get_settings()
    payout_address = _validate_acp_address(body.payout_acp_address, "payout_acp_address")

    idempotency_key = (x_idempotency_key or "").strip() or None
    if idempotency_key:
        existing = (
            await session.execute(
                select(AcpSwapOrder).where(
                    AcpSwapOrder.user_id == user_id,
                    AcpSwapOrder.idempotency_key == idempotency_key,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return _to_public_order(_swap_row_to_dict(existing))

    order = AcpSwapOrder(
        id=uuid4(),
        user_id=user_id,
        status="awaiting_deposit",
        usdt_trc20_amount=amount,
        rate_acp_per_usdt=rate,
        estimated_acp_amount=estimated,
        payout_acp_address=payout_address,
        deposit_trc20_address=settings.usdt_trc20_deposit_address,
        deposit_reference=f"ACP-{uuid4().hex[:8].upper()}",
        note=body.note.strip() if body.note else None,
        idempotency_key=idempotency_key,
    )
    session.add(order)
    await session.flush()
    return _to_public_order(_swap_row_to_dict(order))


@router.get("/swap/orders", response_model=list[AcpSwapOrderPublic])
async def list_swap_orders(user_id: str = Depends(require_auth), session: AsyncSession = Depends(get_db)):
    rows = (
        await session.execute(
            select(AcpSwapOrder).where(AcpSwapOrder.user_id == user_id).order_by(AcpSwapOrder.created_at.desc())
        )
    ).scalars().all()
    return [_to_public_order(_swap_row_to_dict(o)) for o in rows]


@router.get("/swap/orders/{order_id}", response_model=AcpSwapOrderPublic)
async def get_swap_order(order_id: str, user_id: str = Depends(require_auth), session: AsyncSession = Depends(get_db)):
    order = await session.get(AcpSwapOrder, order_id)
    if not order or str(order.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Swap order not found")
    return _to_public_order(_swap_row_to_dict(order))


@router.post("/swap/orders/{order_id}/confirm", response_model=AcpSwapOrderPublic)
async def confirm_swap_order(
    order_id: str,
    body: AcpSwapOrderConfirmRequest,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    order = await session.get(AcpSwapOrder, order_id)
    if not order or str(order.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Swap order not found")
    if order.status not in ("awaiting_deposit", "pending_review"):
        raise HTTPException(status_code=409, detail="Swap order can no longer be confirmed")
    order.status = "pending_review"
    if body.tron_txid:
        order.tron_txid = body.tron_txid.strip()
    order.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return _to_public_order(_swap_row_to_dict(order))


@router.post("/swap/orders/{order_id}/cancel", response_model=AcpSwapOrderPublic)
async def cancel_swap_order(order_id: str, user_id: str = Depends(require_auth), session: AsyncSession = Depends(get_db)):
    order = await session.get(AcpSwapOrder, order_id)
    if not order or str(order.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Swap order not found")
    if order.status in ("completed", "cancelled", "rejected"):
        return _to_public_order(_swap_row_to_dict(order))
    order.status = "cancelled"
    order.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return _to_public_order(_swap_row_to_dict(order))


@router.post("/swap/orders/{order_id}/complete", response_model=AcpSwapCompleteResponse)
async def complete_swap_order(
    order_id: str,
    body: AcpSwapCompleteRequest,
    user_id: str = Depends(require_auth),
    session: AsyncSession = Depends(get_db),
):
    order = await session.get(AcpSwapOrder, order_id)
    if not order or str(order.user_id) != user_id:
        raise HTTPException(status_code=404, detail="Swap order not found")
    if order.status in ("completed", "cancelled", "rejected"):
        raise HTTPException(status_code=409, detail=f"Swap order is already {order.status}")
    if order.status != "pending_review":
        raise HTTPException(status_code=409, detail="Swap order must be confirmed before completion")

    rpc_url = _require_acp_rpc_url()
    signer = await _get_user_wallet_signer(session, user_id, body.wallet_password)
    transfer_res = _run_walletd(
        [
            "transfer",
            "--rpc",
            rpc_url,
            *(
                ["--keystore-json", signer["keystore_json"]]
                if signer.get("keystore_json")
                else ["--mnemonic", signer["mnemonic"]]
            ),
            "--to",
            order.payout_acp_address,
            "--amount-acp",
            _decimal_to_api_str(_parse_decimal_or_zero(order.estimated_acp_amount)),
        ],
        timeout_s=180,
    )
    transfer = AcpWithdrawResponse(**transfer_res)
    order.status = "completed"
    order.payout_txid = transfer.txid
    order.updated_at = datetime.now(timezone.utc)
    await session.flush()
    return AcpSwapCompleteResponse(order=_to_public_order(_swap_row_to_dict(order)), transfer=transfer)

