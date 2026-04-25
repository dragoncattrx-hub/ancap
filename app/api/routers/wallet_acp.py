import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import shutil
from decimal import Decimal, InvalidOperation
from uuid import uuid4

import httpx
from fastapi import APIRouter, Header, HTTPException, Depends, Query

from app.config import get_settings
from app.api.deps import require_auth
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
)


router = APIRouter(prefix="/wallet/acp", tags=["Wallet (ACP)"])
_swap_orders: dict[str, dict] = {}
_swap_idempotency: dict[tuple[str, str], str] = {}


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
def get_deposit_address():
    mnemonic = _load_or_create_valid_hot_mnemonic()
    addr = _run_walletd(["address", "--mnemonic", mnemonic])["address"]
    return AcpDepositAddressResponse(address=addr)


@router.get("/hot/balance", response_model=AcpBalanceResponse)
def hot_balance():
    mnemonic = _load_or_create_valid_hot_mnemonic()
    addr = _run_walletd(["address", "--mnemonic", mnemonic])["address"]
    try:
        rpc_url = _require_acp_rpc_url()
        res = _run_walletd(["balance", "--rpc", rpc_url, "--address", addr], timeout_s=180)
        return AcpBalanceResponse(**res)
    except HTTPException:
        # Keep wallet UI operational even when RPC is temporarily unavailable.
        return AcpBalanceResponse(address=addr, units="0", acp="0", utxo_count=0)


@router.get("/balance", response_model=AcpBalanceResponse)
def balance(address: str | None = Query(default=None)):
    target = (address or "").strip()
    if not target:
        mnemonic = _load_or_create_valid_hot_mnemonic()
        target = str(_run_walletd(["address", "--mnemonic", mnemonic])["address"]).strip()
    if len(target) < 16:
        raise HTTPException(status_code=400, detail="address looks invalid")
    rpc_url = _require_acp_rpc_url()
    res = _run_walletd(["balance", "--rpc", rpc_url, "--address", target], timeout_s=180)
    return AcpBalanceResponse(**res)


@router.get("/transactions", response_model=list[AcpTransactionPublic])
def list_transactions(
    address: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
):
    target = (address or "").strip()
    if not target:
        mnemonic = _load_or_create_valid_hot_mnemonic()
        target = str(_run_walletd(["address", "--mnemonic", mnemonic])["address"]).strip()
    if len(target) < 16:
        raise HTTPException(status_code=400, detail="address looks invalid")
    return _chain_transactions_for_address(target, limit)


@router.post("/withdraw", response_model=AcpWithdrawResponse)
def withdraw(body: AcpWithdrawRequest, x_wallet_secret: str | None = Header(default=None)):
    expected = os.getenv("ACP_WALLET_OPERATOR_SECRET", "").strip()
    if expected and (x_wallet_secret or "").strip() != expected:
        raise HTTPException(status_code=403, detail="Forbidden")

    rpc_url = _require_acp_rpc_url()
    mnemonic = _load_or_create_valid_hot_mnemonic()
    to_address = _require_non_empty(body.to_address, "to_address")
    amount = _parse_positive_decimal(body.amount_acp, "amount_acp")

    res = _run_walletd(
        [
            "transfer",
            "--rpc",
            rpc_url,
            "--mnemonic",
            mnemonic,
            "--to",
            to_address,
            "--amount-acp",
            _decimal_to_api_str(amount),
        ],
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
def create_swap_order(
    body: AcpSwapOrderCreateRequest,
    user_id: str = Depends(require_auth),
    x_idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    amount = _parse_positive_decimal(body.usdt_trc20_amount, "usdt_trc20_amount")
    rate = _swap_rate()
    estimated = (amount * rate).quantize(Decimal("0.00000001"))
    settings = get_settings()
    payout_address = _require_non_empty(body.payout_acp_address, "payout_acp_address")
    if len(payout_address) < 16:
        raise HTTPException(status_code=400, detail="payout_acp_address looks invalid")

    idempotency_key = (x_idempotency_key or "").strip()
    if idempotency_key:
        existing_id = _swap_idempotency.get((user_id, idempotency_key))
        if existing_id and existing_id in _swap_orders:
            return _to_public_order(_swap_orders[existing_id])

    order_id = str(uuid4())
    now = _utc_now_iso()
    order = {
        "id": order_id,
        "user_id": user_id,
        "status": "awaiting_deposit",
        "usdt_trc20_amount": _decimal_to_api_str(amount),
        "rate_acp_per_usdt": _decimal_to_api_str(rate),
        "estimated_acp_amount": _decimal_to_api_str(estimated),
        "payout_acp_address": payout_address,
        "deposit_trc20_address": settings.usdt_trc20_deposit_address,
        "deposit_reference": f"ACP-{order_id[:8]}",
        "tron_txid": None,
        "payout_txid": None,
        "note": body.note.strip() if body.note else None,
        "created_at": now,
        "updated_at": now,
    }
    _swap_orders[order_id] = order
    if idempotency_key:
        _swap_idempotency[(user_id, idempotency_key)] = order_id
    return _to_public_order(order)


@router.get("/swap/orders", response_model=list[AcpSwapOrderPublic])
def list_swap_orders(user_id: str = Depends(require_auth)):
    rows = [o for o in _swap_orders.values() if o["user_id"] == user_id]
    rows.sort(key=lambda x: x["created_at"], reverse=True)
    return [_to_public_order(o) for o in rows]


@router.get("/swap/orders/{order_id}", response_model=AcpSwapOrderPublic)
def get_swap_order(order_id: str, user_id: str = Depends(require_auth)):
    order = _swap_orders.get(order_id)
    if not order or order["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Swap order not found")
    return _to_public_order(order)


@router.post("/swap/orders/{order_id}/confirm", response_model=AcpSwapOrderPublic)
def confirm_swap_order(order_id: str, body: AcpSwapOrderConfirmRequest, user_id: str = Depends(require_auth)):
    order = _swap_orders.get(order_id)
    if not order or order["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Swap order not found")
    if order["status"] not in ("awaiting_deposit", "pending_review"):
        raise HTTPException(status_code=409, detail="Swap order can no longer be confirmed")
    order["status"] = "pending_review"
    if body.tron_txid:
        order["tron_txid"] = body.tron_txid.strip()
    order["updated_at"] = _utc_now_iso()
    return _to_public_order(order)


@router.post("/swap/orders/{order_id}/cancel", response_model=AcpSwapOrderPublic)
def cancel_swap_order(order_id: str, user_id: str = Depends(require_auth)):
    order = _swap_orders.get(order_id)
    if not order or order["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Swap order not found")
    if order["status"] in ("completed", "cancelled", "rejected"):
        return _to_public_order(order)
    order["status"] = "cancelled"
    order["updated_at"] = _utc_now_iso()
    return _to_public_order(order)


@router.post("/swap/orders/{order_id}/complete", response_model=AcpSwapCompleteResponse)
def complete_swap_order(order_id: str, x_wallet_secret: str | None = Header(default=None)):
    expected = os.getenv("ACP_WALLET_OPERATOR_SECRET", "").strip()
    if not expected or (x_wallet_secret or "").strip() != expected:
        raise HTTPException(status_code=403, detail="Forbidden")

    order = _swap_orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Swap order not found")
    if order["status"] in ("completed", "cancelled", "rejected"):
        raise HTTPException(status_code=409, detail=f"Swap order is already {order['status']}")
    if order["status"] != "pending_review":
        raise HTTPException(status_code=409, detail="Swap order must be confirmed before completion")

    rpc_url = _require_acp_rpc_url()
    mnemonic = _load_or_create_valid_hot_mnemonic()
    transfer_res = _run_walletd(
        [
            "transfer",
            "--rpc",
            rpc_url,
            "--mnemonic",
            mnemonic,
            "--to",
            order["payout_acp_address"],
            "--amount-acp",
            order["estimated_acp_amount"],
        ],
        timeout_s=180,
    )
    transfer = AcpWithdrawResponse(**transfer_res)
    order["status"] = "completed"
    order["payout_txid"] = transfer.txid
    order["updated_at"] = _utc_now_iso()
    return AcpSwapCompleteResponse(order=_to_public_order(order), transfer=transfer)

