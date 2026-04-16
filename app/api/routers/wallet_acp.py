import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import shutil
from decimal import Decimal, InvalidOperation
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException, Depends

from app.config import get_settings
from app.api.deps import require_auth
from app.schemas import (
    AcpBalanceResponse,
    AcpDepositAddressResponse,
    AcpWithdrawRequest,
    AcpWithdrawResponse,
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

