"""Public mobile gateway for non-custodial ACP Wallet (read + broadcast relay).

See docs/mobile/API_MOBILE.md and docs/mobile/ROADMAP.md.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from app.api.routers import wallet_acp
from app.config import get_settings
from app.schemas.mobile_acp import (
    AcpBroadcastRequest,
    AcpBroadcastResponse,
    AcpFeeEstimateRequest,
    AcpFeeEstimateResponse,
    AcpNetworkStatusResponse,
    MobileAcpBalanceResponse,
    MobileConfigResponse,
    MobileDocsLinks,
)
from app.schemas.wallets import AcpTransactionDetailsPublic, AcpTransactionPublic
from app.services.rate_limit import enforce_rate_limit, get_request_ip


logger = logging.getLogger(__name__)

router = APIRouter(tags=["Mobile (ACP Wallet)"])

# Matches acp-crypto protocol_params MIN_FEE_UNITS = 100 (1e-8 ACP units)
_DEFAULT_MIN_FEE_ACP = "0.00000100"
_DEFAULT_MIN_FEE_UNITS = "100"


def _public_docs() -> MobileDocsLinks:
    base = "https://ancap.cloud"
    return MobileDocsLinks(
        bridge=f"{base}/docs/wacp/bridge",
        risks=f"{base}/docs/wacp/risks",
        reserve=f"{base}/docs/wacp/reserve",
        contracts=f"{base}/docs/wacp/contracts",
        wallet_security=f"{base}/wallet-security",
    )


def _acp_rpc_status() -> str:
    settings = get_settings()
    if not (settings.acp_rpc_url or "").strip():
        return "unconfigured"
    try:
        wallet_acp._rpc_call(settings.acp_rpc_url.strip(), "getblockcount", [])
        return "ok"
    except HTTPException:
        return "degraded"
    except Exception as exc:
        logger.warning("mobile acp rpc probe failed: %s", exc)
        return "degraded"


def _bridge_status_label() -> str:
    s = get_settings()
    if not s.bridge_rail_enabled:
        return "disabled"
    if s.bridge_rail_paused:
        return "paused"
    return "ok"


@router.get("/mobile/config", response_model=MobileConfigResponse)
async def mobile_config():
    s = get_settings()
    rpc_status = _acp_rpc_status()
    bridge_status = _bridge_status_label()
    maintenance = bool(s.mobile_wallet_maintenance) or rpc_status == "unconfigured"
    message = s.mobile_wallet_maintenance_message if maintenance else None
    if maintenance and not message and rpc_status == "unconfigured":
        message = "ACP network RPC is not configured."

    reverse_enabled = bool(
        s.bridge_rail_enabled
        and not s.bridge_rail_paused
        and s.mobile_wallet_bridge_reverse_enabled
    )

    return MobileConfigResponse(
        min_app_version=s.mobile_wallet_min_app_version,
        maintenance=maintenance,
        maintenance_message=message,
        acp_decimals=8,
        wacp_decimals=18,
        acp_rpc_status=rpc_status,
        bridge_status=bridge_status,
        bridge_enabled=bool(s.bridge_rail_enabled),
        bridge_paused=bool(s.bridge_rail_paused),
        bridge_reverse_enabled=reverse_enabled,
        wacp_contract=(s.bridge_wacp_contract or "").strip(),
        bsc_chain_id=56,
        acp_rpc_url=(s.acp_rpc_url or "").strip(),
        acp_explorer_tx_base=(s.acp_explorer_tx_base or "https://ancap.cloud/acp/tx").rstrip("/"),
        bsc_explorer_base=(s.bsc_explorer_base or "https://bscscan.com").rstrip("/"),
        support_url=(s.mobile_wallet_support_url or "https://ancap.cloud/support").strip(),
        docs=_public_docs(),
    )


@router.get("/acp/network/status", response_model=AcpNetworkStatusResponse)
async def acp_network_status():
    settings = get_settings()
    rpc = (settings.acp_rpc_url or "").strip()
    if not rpc:
        return AcpNetworkStatusResponse(rpc_status="unconfigured", block_height=None, min_fee_acp=_DEFAULT_MIN_FEE_ACP)
    try:
        height = wallet_acp._rpc_call(rpc, "getblockcount", [])
        block_height = int(height) if height is not None else None
        status = "ok"
    except HTTPException:
        block_height = None
        status = "degraded"
    return AcpNetworkStatusResponse(
        rpc_status=status,
        block_height=block_height,
        min_fee_acp=_DEFAULT_MIN_FEE_ACP,
    )


@router.get("/acp/address/{address}/balance", response_model=MobileAcpBalanceResponse)
async def acp_address_balance(address: str):
    target = wallet_acp._validate_acp_address(address, "address")
    try:
        raw = wallet_acp._load_balance_result(target)
    except HTTPException as exc:
        if exc.status_code in (502, 503, 504):
            return MobileAcpBalanceResponse(address=target, units="0", acp="0", utxo_count=0)
        raise
    return MobileAcpBalanceResponse(
        address=str(raw.get("address") or target),
        units=str(raw.get("units") or "0"),
        acp=str(raw.get("acp") or "0"),
        utxo_count=int(raw.get("utxo_count") or 0),
    )


@router.get("/acp/address/{address}/transactions", response_model=list[AcpTransactionPublic])
async def acp_address_transactions(
    address: str,
    limit: int = Query(default=50, ge=1, le=500),
):
    target = wallet_acp._validate_acp_address(address, "address")
    try:
        return wallet_acp._chain_transactions_for_address(target, limit)
    except HTTPException as exc:
        if exc.status_code in (502, 503, 504):
            return []
        raise


@router.get("/acp/transactions/{txid}", response_model=AcpTransactionDetailsPublic)
async def acp_transaction_by_id(txid: str):
    txid_norm = (txid or "").strip()
    if len(txid_norm) < 32:
        raise HTTPException(status_code=400, detail="txid looks invalid")
    try:
        details = wallet_acp._chain_transaction_details(txid_norm)
    except HTTPException as exc:
        if exc.status_code in (502, 503, 504):
            raise HTTPException(status_code=503, detail="ACP transaction lookup is temporarily unavailable") from exc
        raise
    if details is None:
        raise HTTPException(status_code=404, detail="ACP transaction not found")
    return details


@router.post("/acp/tx/estimate-fee", response_model=AcpFeeEstimateResponse)
async def acp_estimate_fee(body: AcpFeeEstimateRequest):
    wallet_acp._validate_acp_address(body.from_address, "from")
    wallet_acp._validate_acp_address(body.to_address, "to")
    wallet_acp._parse_positive_decimal(body.amount_acp, "amountAcp")
    return AcpFeeEstimateResponse(
        fee_acp=_DEFAULT_MIN_FEE_ACP,
        fee_units=_DEFAULT_MIN_FEE_UNITS,
        min_fee_acp=_DEFAULT_MIN_FEE_ACP,
    )


@router.post("/acp/tx/broadcast", response_model=AcpBroadcastResponse)
async def acp_broadcast(request: Request, body: AcpBroadcastRequest):
    s = get_settings()
    ip = get_request_ip(request)
    await enforce_rate_limit(
        key=f"mobile:broadcast:{ip}",
        limit=s.mobile_broadcast_rate_limit_per_minute,
        window_seconds=60,
    )

    raw = (body.raw_tx or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="rawTx is required")
    if raw.startswith("0x") or raw.startswith("0X"):
        raw = raw[2:]
    if len(raw) < 32 or len(raw) > 2_000_000:
        raise HTTPException(status_code=400, detail="rawTx length is invalid")
    try:
        int(raw, 16)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="rawTx must be hexadecimal") from exc

    rpc = wallet_acp._require_acp_rpc_url()
    try:
        result = wallet_acp._rpc_call(rpc, "sendrawtransaction", {"tx": raw})
    except HTTPException as exc:
        if exc.status_code == 502:
            raise HTTPException(status_code=503, detail="ACP broadcast is temporarily unavailable") from exc
        raise

    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="ACP RPC returned unexpected broadcast result")

    accepted = bool(result.get("accepted"))
    txid = result.get("txid")
    if isinstance(txid, str):
        txid = txid.strip() or None
    else:
        txid = None
    reason = result.get("reason")
    if isinstance(reason, str):
        reason = reason.strip() or None
    else:
        reason = None

    return AcpBroadcastResponse(accepted=accepted, txid=txid, reason=reason)


@router.get("/mobile/health")
async def mobile_health():
    return JSONResponse({"ok": True, "service": "acp-wallet-mobile-gateway"})
