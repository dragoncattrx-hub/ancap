import json
import os
import subprocess
import re
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
from app.schemas import (
    AcpBalanceResponse,
    AcpDepositAddressResponse,
    AcpWithdrawRequest,
    AcpWithdrawResponse,
    AcpTransactionPublic,
    AcpSwapQuoteRequest,
    AcpSwapQuoteResponse,
    AcpSwapOrderCreateRequest,
    AcpSwapOrderConfirmRequest,
    AcpSwapOrderPublic,
    AcpSwapCompleteResponse,
    AcpSwapCompleteRequest,
)


router = APIRouter(prefix="/wallet/acp", tags=["Wallet (ACP)"])


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


def _parse_positive_decimal(value: str, field_name: str) -> Decimal:
    try:
        d = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    if d <= 0:
        raise HTTPException(status_code=400, detail=f"{field_name} must be > 0")
    return d


def _require_non_empty(value: str, field_name: str) -> str:
    out = (value or "").strip()
    if not out:
        raise HTTPException(status_code=400, detail=f"{field_name} is required")
    return out


_ACP_ADDRESS_RE = re.compile(r"^acp1[a-z0-9]{20,100}$")


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


def _parse_decimal_or_zero(value: str | int | float | Decimal | None) -> Decimal:
    try:
        if value is None:
            return Decimal(0)
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return Decimal(0)


async def _in_work_acp_for_user(session: AsyncSession, user_id: str) -> Decimal:
    try:
        owner_user_id = user_id.strip()
    except Exception:
        return Decimal(0)
    if not owner_user_id:
        return Decimal(0)
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

    # Reserve on-chain withdrawals by ACP already allocated inside platform ledger
    # (user account + all user-owned agent accounts).
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

    if not account_ids:
        return staked_acp

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

    return staked_acp + ledger_reserved_acp


def _format_balance_note(real_acp: Decimal, in_work_acp: Decimal, available_acp: Decimal) -> str:
    return (
        f"Real account balance: {_decimal_to_api_str(real_acp)} ACP; "
        f"in work: {_decimal_to_api_str(in_work_acp)} ACP; "
        f"available for withdraw: {_decimal_to_api_str(available_acp)} ACP."
    )


def _creator_vesting_monthly_unlock_acp() -> Decimal:
    # 69,300,000 ACP over 72 months after a 12-month cliff.
    return Decimal("962500")


def _creator_vesting_snapshot(address: str, now_ts: int | None = None) -> tuple[Decimal, Decimal] | None:
    """
    Return (unlocked_acp, locked_acp) for creator genesis address, otherwise None.
    """
    rpc_url = _require_acp_rpc_url()
    bh = _rpc_call(rpc_url, "getblockhash", {"height": 1})
    block = _rpc_call(rpc_url, "getblock", {"blockhash": bh, "verbose": 2}) or {}
    txs = block.get("tx") or []
    if not txs:
        return None
    genesis_tx = txs[0] or {}
    outputs = genesis_tx.get("vout") or []
    creator_vout = next((o for o in outputs if str(o.get("recipient_address") or "") == address), None)
    if not creator_vout:
        return None

    creator_total_units = int(creator_vout.get("amount") or 0)
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
    real_acp = _parse_decimal_or_zero(raw.get("acp"))
    in_work_acp = await _in_work_acp_for_user(session, user_id) if include_in_work else Decimal(0)
    available_acp = real_acp - in_work_acp
    if available_acp < 0:
        available_acp = Decimal(0)
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
    return AcpBalanceResponse(
        **raw,
        in_work_acp=_decimal_to_api_str(in_work_acp),
        available_acp=_decimal_to_api_str(available_acp),
        vested_unlocked_acp=vested_unlocked_acp,
        vested_locked_acp=vested_locked_acp,
        balance_note=_format_balance_note(real_acp, in_work_acp, available_acp),
    )


def _rpc_call(rpc_url: str, method: str, params: list | None = None):
    body = {"jsonrpc": "2.0", "id": "wallet-acp-history", "method": method, "params": params or []}
    try:
        r = httpx.post(rpc_url, json=body, timeout=30.0)
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


def _load_or_create_hot_mnemonic() -> str:
    env = os.getenv("ACP_HOT_MNEMONIC", "").strip()
    if env:
        return env
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
    mnemonic = str(created["mnemonic"]).strip()
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
        new_mnemonic = str(created["mnemonic"]).strip()
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(new_mnemonic + "\n", encoding="utf-8")
        _run_walletd(["address", "--mnemonic", new_mnemonic])
        return new_mnemonic


def _chain_transactions_for_address(address: str, limit: int) -> list[AcpTransactionPublic]:
    rpc_url = _require_acp_rpc_url()
    best_height = int(_rpc_call(rpc_url, "getblockcount", []) or 0)
    if best_height <= 0:
        return []

    # Track outputs while scanning chain to resolve vin ownership.
    out_index: dict[tuple[str, int], tuple[str, int]] = {}
    rows: list[AcpTransactionPublic] = []

    for height in range(1, best_height + 1):
        block_hash = _rpc_call(rpc_url, "getblockhash", {"height": height})
        block = _rpc_call(rpc_url, "getblock", {"blockhash": block_hash, "verbose": 2}) or {}
        block_time = int(block.get("time") or 0)
        txs = block.get("tx") or []

        for tx in txs:
            txid = str(tx.get("txid") or "")
            if not txid:
                continue

            sent_units = 0
            received_units = 0

            for vin in tx.get("vin") or []:
                prev_txid = vin.get("prev_txid")
                prev_vout = vin.get("vout")
                if prev_txid is None or prev_vout is None:
                    continue
                key = (str(prev_txid), int(prev_vout))
                prev_out = out_index.pop(key, None)
                if prev_out and prev_out[0] == address:
                    sent_units += int(prev_out[1])

            for idx, vout in enumerate(tx.get("vout") or []):
                out_addr = str(vout.get("recipient_address") or "")
                out_amount = int(vout.get("amount") or 0)
                out_index[(txid, idx)] = (out_addr, out_amount)
                if out_addr == address:
                    received_units += out_amount

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
                    txid=txid,
                    block_height=height,
                    block_time=_acp_timestamp(block_time) if block_time > 0 else _utc_now_iso(),
                    confirmations=(best_height - height + 1),
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
        rpc_url = _require_acp_rpc_url()
        res = _run_walletd(["balance", "--rpc", rpc_url, "--address", addr], timeout_s=180)
        return await _decorate_balance_for_user(session, user_id, res, include_in_work=True)
    except HTTPException:
        # Keep wallet UI operational even when RPC is temporarily unavailable.
        return await _decorate_balance_for_user(
            session,
            user_id,
            {"address": addr, "units": "0", "acp": "0", "utxo_count": 0},
            include_in_work=True,
        )


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
    rpc_url = _require_acp_rpc_url()
    include_in_work = bool(wallet and wallet.address == target)
    try:
        res = _run_walletd(["balance", "--rpc", rpc_url, "--address", target], timeout_s=180)
        return await _decorate_balance_for_user(session, user_id, res, include_in_work=include_in_work)
    except HTTPException as exc:
        # Keep wallet UI operational when RPC/balance helper is temporarily unavailable.
        if exc.status_code in (502, 503, 504):
            return await _decorate_balance_for_user(
                session,
                user_id,
                {"address": target, "units": "0", "acp": "0", "utxo_count": 0},
                include_in_work=include_in_work,
            )
        raise


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
    to_address = _require_non_empty(body.to_address, "to_address")
    amount = _parse_positive_decimal(body.amount_acp, "amount_acp")
    fee: Decimal | None = None
    if body.fee_acp is not None and str(body.fee_acp).strip():
        fee = _parse_positive_decimal(body.fee_acp, "fee_acp")
    balance_res = _run_walletd(["balance", "--rpc", rpc_url, "--address", wallet.address], timeout_s=180)
    real_acp = _parse_decimal_or_zero(balance_res.get("acp"))
    in_work_acp = await _in_work_acp_for_user(session, user_id)
    available_acp = real_acp - in_work_acp
    if available_acp < 0:
        available_acp = Decimal(0)
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

