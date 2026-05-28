"""Public mobile gateway for non-custodial ACP Wallet (read + broadcast relay).

See docs/mobile/API_MOBILE.md and docs/mobile/ROADMAP.md.
"""
from __future__ import annotations

import hashlib
import logging
import re
from decimal import Decimal, ROUND_UP
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, unquote, urlparse
from uuid import uuid4

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
    MerchantHint,
    MobileAcpBalanceResponse,
    MobileConfigResponse,
    MobileDocsLinks,
    PaymentAmount,
    PaymentAsset,
    PaymentIntentMetadata,
    PaymentIntentResponseItem,
    PaymentMemo,
    PaymentRecipient,
    SmartPayCapabilitiesResponse,
    SmartPayExecuteRequest,
    SmartPayExecutionItem,
    SmartPayExecutionResponse,
    SmartPayNetworkFeeItem,
    SmartPayQuoteAsset,
    SmartPayQuoteItem,
    SmartPayQuoteRequest,
    SmartPayQuoteResponse,
    SmartPayRecoverRequest,
    SmartPayRouteStep,
    SmartPaySupportedAsset,
    SmartPayTxRef,
    SmartQrParseRequest,
    SmartQrParseResponse,
)
from app.schemas.wallets import AcpTransactionDetailsPublic, AcpTransactionPublic
from app.services.rate_limit import enforce_rate_limit, get_request_ip


logger = logging.getLogger(__name__)

router = APIRouter(tags=["Mobile (ACP Wallet)"])

# Matches acp-crypto protocol_params MIN_FEE_UNITS = 100 (1e-8 ACP units)
_DEFAULT_MIN_FEE_ACP = "0.00000100"
_DEFAULT_MIN_FEE_UNITS = "100"
_EVM_ADDRESS_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")
_EIP681_NATIVE_TRANSFER_SEGMENT = "/transfer"
_ACP_TO_USDT_RATE = Decimal("0.25")
_SERVICE_FEE_ACP = Decimal("0.75")
_BSC_NETWORK_FEE_BNB = Decimal("0.00021")
_QUOTE_TTL_MINUTES = 5


def _public_docs() -> MobileDocsLinks:
    base = "https://ancap.cloud"
    return MobileDocsLinks(
        bridge=f"{base}/docs/wacp/bridge",
        risks=f"{base}/docs/wacp/risks",
        reserve=f"{base}/docs/wacp/reserve",
        contracts=f"{base}/docs/wacp/contracts",
        wallet_security=f"{base}/docs/mobile/security",
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


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _payload_hash(raw_payload: str) -> str:
    return hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()


_PAYMENT_INTENTS: dict[str, PaymentIntentResponseItem] = {}
_SMART_PAY_QUOTES: dict[str, SmartPayQuoteItem] = {}
_SMART_PAY_EXECUTIONS: dict[str, SmartPayExecutionItem] = {}


def _supported_assets() -> list[SmartPaySupportedAsset]:
    s = get_settings()
    assets = [SmartPaySupportedAsset(network="acp", symbol="ACP")]
    wacp_contract = (s.bridge_wacp_contract or "").strip() or None
    assets.append(SmartPaySupportedAsset(network="bsc", symbol="wACP", token_address=wacp_contract))
    assets.append(SmartPaySupportedAsset(network="bsc", symbol="USDT", token_address=None))
    return assets


def _base_metadata(detected_standard: str | None, invoice_type: str | None) -> PaymentIntentMetadata:
    return PaymentIntentMetadata(
        detected_standard=detected_standard,
        invoice_type=invoice_type,
        ai_model=None,
        ai_used=False,
        parser_version="1",
    )


def _make_payment_intent(
    *,
    source: str,
    raw_payload: str,
    parse_method: str,
    confidence: float,
    status: str,
    network: str,
    asset: PaymentAsset,
    recipient: PaymentRecipient,
    amount: PaymentAmount | None,
    memo: PaymentMemo | None,
    merchant: MerchantHint | None,
    risk_flags: list[str],
    warnings: list[str],
    unsupported_reasons: list[str],
    metadata: PaymentIntentMetadata,
) -> PaymentIntentResponseItem:
    intent = PaymentIntentResponseItem(
        id=f"pi_{uuid4().hex}",
        created_at=_utc_now_iso(),
        source=source,
        raw_payload=raw_payload,
        payload_hash=_payload_hash(raw_payload),
        parse_method=parse_method,
        confidence=confidence,
        status=status,
        network=network,
        asset=asset,
        recipient=recipient,
        amount=amount,
        memo=memo,
        merchant=merchant,
        risk_flags=risk_flags,
        warnings=warnings,
        unsupported_reasons=unsupported_reasons,
        requires_user_confirmation=True,
        metadata=metadata,
    )
    _PAYMENT_INTENTS[intent.id] = intent
    return intent


def _parse_decimal_string(raw: str) -> str:
    value = (raw or "").strip()
    if not value:
        raise HTTPException(status_code=400, detail="amount is required")
    normalized = value.replace(",", "")
    wallet_acp._parse_positive_decimal(normalized, "amount")
    return normalized


def _parse_acp_payload(source: str, raw_payload: str) -> PaymentIntentResponseItem:
    payload = raw_payload.strip()
    if "?" in payload:
        address_part, query_part = payload.split("?", 1)
    else:
        address_part, query_part = payload, ""
    address = wallet_acp._validate_acp_address(address_part, "recipient")
    params = parse_qs(query_part, keep_blank_values=False)
    amount_value = params.get("amount", [None])[0]
    memo_value = params.get("memo", [None])[0] or params.get("message", [None])[0]
    amount = None
    if amount_value:
        parsed_amount = _parse_decimal_string(amount_value)
        amount = PaymentAmount(
            value=parsed_amount,
            atomic_value=None,
            currency_symbol="ACP",
            is_exact=True,
            is_max=False,
        )
    memo = None
    if memo_value:
        memo = PaymentMemo(value=memo_value, type="memo", required=False)
    return _make_payment_intent(
        source=source,
        raw_payload=raw_payload,
        parse_method="deterministic",
        confidence=1.0,
        status="parsed",
        network="acp",
        asset=PaymentAsset(kind="native", symbol="ACP", name="ACP", token_address=None, decimals=8, is_supported=True, is_allowlisted=True),
        recipient=PaymentRecipient(address=address, resolved_display=None, address_type="acp", checksum_valid=True, ens_or_alias=None),
        amount=amount,
        memo=memo,
        merchant=None,
        risk_flags=[],
        warnings=[],
        unsupported_reasons=[],
        metadata=_base_metadata("acp_uri" if query_part else "acp_address", "native_transfer"),
    )


def _parse_evm_address_payload(source: str, raw_payload: str) -> PaymentIntentResponseItem:
    address = raw_payload.strip()
    if not _EVM_ADDRESS_RE.fullmatch(address):
        raise HTTPException(status_code=400, detail="Unsupported or malformed QR payload")
    return _make_payment_intent(
        source=source,
        raw_payload=raw_payload,
        parse_method="deterministic",
        confidence=1.0,
        status="needs_review",
        network="unknown",
        asset=PaymentAsset(kind="unknown", symbol=None, name=None, token_address=None, decimals=None, is_supported=False, is_allowlisted=False),
        recipient=PaymentRecipient(address=address, resolved_display=None, address_type="evm", checksum_valid=True, ens_or_alias=None),
        amount=None,
        memo=None,
        merchant=None,
        risk_flags=["unknown_network", "unknown_asset", "missing_amount"],
        warnings=["Raw EVM address detected. Select network and asset before paying."],
        unsupported_reasons=[],
        metadata=_base_metadata("evm_address", "address_only"),
    )


def _parse_eip681_payload(source: str, raw_payload: str) -> PaymentIntentResponseItem:
    decoded = unquote(raw_payload.strip())
    parsed = urlparse(decoded)
    if parsed.scheme.lower() != "ethereum":
        raise HTTPException(status_code=400, detail="Unsupported or malformed QR payload")

    target = parsed.path or parsed.netloc
    if not target:
        raise HTTPException(status_code=400, detail="Unsupported or malformed QR payload")

    params = parse_qs(parsed.query, keep_blank_values=False)
    token_transfer = target.endswith(_EIP681_NATIVE_TRANSFER_SEGMENT)
    if token_transfer:
        contract_part = target[: -len(_EIP681_NATIVE_TRANSFER_SEGMENT)]
        if "@" in contract_part:
            contract_part, chain_id = contract_part.split("@", 1)
        else:
            chain_id = ""
        recipient = params.get("address", [None])[0]
        atomic = params.get("uint256", [None])[0]
        if not contract_part or not _EVM_ADDRESS_RE.fullmatch(contract_part) or not recipient or not _EVM_ADDRESS_RE.fullmatch(recipient):
            raise HTTPException(status_code=400, detail="Unsupported or malformed QR payload")
        amount = None
        if atomic:
            if not atomic.isdigit():
                raise HTTPException(status_code=400, detail="Unsupported or malformed QR payload")
            amount = PaymentAmount(value=atomic, atomic_value=atomic, currency_symbol="USDT", is_exact=True, is_max=False)
        network = "bsc" if chain_id == "56" else "ethereum"
        return _make_payment_intent(
            source=source,
            raw_payload=raw_payload,
            parse_method="deterministic",
            confidence=1.0,
            status="parsed",
            network=network,
            asset=PaymentAsset(kind="erc20", symbol="USDT", name="Tether USD", token_address=contract_part, decimals=None, is_supported=network == "bsc", is_allowlisted=network == "bsc"),
            recipient=PaymentRecipient(address=recipient, resolved_display=None, address_type="evm", checksum_valid=True, ens_or_alias=None),
            amount=amount,
            memo=None,
            merchant=None,
            risk_flags=[] if network == "bsc" else ["unsupported_asset"],
            warnings=[] if network == "bsc" else ["Ethereum mainnet token payments are not in first Smart Pay release scope."],
            unsupported_reasons=[] if network == "bsc" else ["network_not_in_first_release_scope"],
            metadata=_base_metadata("eip681", "token_transfer"),
        )

    address_only = target
    if "@" in address_only:
        address_only, chain_id = address_only.split("@", 1)
    else:
        chain_id = ""
    if not _EVM_ADDRESS_RE.fullmatch(address_only):
        raise HTTPException(status_code=400, detail="Unsupported or malformed QR payload")
    amount_raw = params.get("value", [None])[0]
    amount = None
    if amount_raw:
        parsed_amount = _parse_decimal_string(amount_raw)
        amount = PaymentAmount(value=parsed_amount, atomic_value=None, currency_symbol="ETH" if chain_id != "56" else "BNB", is_exact=True, is_max=False)
    network = "bsc" if chain_id == "56" else "ethereum"
    symbol = "BNB" if network == "bsc" else "ETH"
    return _make_payment_intent(
        source=source,
        raw_payload=raw_payload,
        parse_method="deterministic",
        confidence=1.0,
        status="parsed",
        network=network,
        asset=PaymentAsset(kind="native", symbol=symbol, name=symbol, token_address=None, decimals=18, is_supported=network == "bsc", is_allowlisted=network == "bsc"),
        recipient=PaymentRecipient(address=address_only, resolved_display=None, address_type="evm", checksum_valid=True, ens_or_alias=None),
        amount=amount,
        memo=None,
        merchant=None,
        risk_flags=[] if network == "bsc" else ["unsupported_asset"],
        warnings=[] if network == "bsc" else ["Ethereum mainnet payments are not in first Smart Pay release scope."],
        unsupported_reasons=[] if network == "bsc" else ["network_not_in_first_release_scope"],
        metadata=_base_metadata("eip681", "native_transfer"),
    )


def _parse_smart_qr_payload(source: str, raw_payload: str) -> PaymentIntentResponseItem:
    payload = (raw_payload or "").strip()
    if not payload:
        raise HTTPException(status_code=400, detail="rawPayload is required")
    if payload.startswith("ethereum:"):
        return _parse_eip681_payload(source, payload)
    if payload.startswith("acp1"):
        return _parse_acp_payload(source, payload)
    if _EVM_ADDRESS_RE.fullmatch(payload):
        return _parse_evm_address_payload(source, payload)
    raise HTTPException(status_code=400, detail="Unsupported or malformed QR payload")


def _quantize_up(value: Decimal, places: str) -> str:
    return str(value.quantize(Decimal(places), rounding=ROUND_UP))


def _get_payment_intent_or_404(payment_intent_id: str) -> PaymentIntentResponseItem:
    intent = _PAYMENT_INTENTS.get((payment_intent_id or "").strip())
    if intent is None:
        raise HTTPException(status_code=404, detail="paymentIntentId not found")
    return intent


def _get_quote_or_404(quote_id: str) -> SmartPayQuoteItem:
    quote = _SMART_PAY_QUOTES.get((quote_id or "").strip())
    if quote is None:
        raise HTTPException(status_code=404, detail="quoteId not found")
    return quote


def _intent_target_amount(intent: PaymentIntentResponseItem) -> Decimal:
    if intent.amount is None or not intent.amount.value:
        raise HTTPException(status_code=422, detail="Payment intent is missing amount")
    return Decimal(str(intent.amount.value))


def _source_asset_for_symbol(symbol: str) -> SmartPayQuoteAsset:
    normalized = (symbol or "").strip().upper()
    if normalized == "ACP":
        return SmartPayQuoteAsset(network="acp", symbol="ACP", token_address=None, decimals=8)
    if normalized == "WACP":
        s = get_settings()
        return SmartPayQuoteAsset(network="bsc", symbol="wACP", token_address=(s.bridge_wacp_contract or "").strip() or None, decimals=18)
    if normalized == "USDT":
        return SmartPayQuoteAsset(network="bsc", symbol="USDT", token_address=None, decimals=18)
    raise HTTPException(status_code=422, detail=f"Unsupported preferred asset: {symbol}")


def _target_asset_from_intent(intent: PaymentIntentResponseItem) -> SmartPayQuoteAsset:
    return SmartPayQuoteAsset(
        network=intent.network,
        symbol=intent.asset.symbol or "UNKNOWN",
        token_address=intent.asset.token_address,
        decimals=intent.asset.decimals,
    )


def _build_quote_route(intent: PaymentIntentResponseItem, source_symbol: str) -> tuple[str, list[SmartPayRouteStep], list[SmartPayNetworkFeeItem]]:
    source = source_symbol.upper()
    if intent.network == "acp" and source == "ACP":
        return (
            "direct_send",
            [SmartPayRouteStep(kind="transfer", network="acp", dex_or_rail=None, from_asset="ACP", to_asset="ACP", estimated_out=intent.amount.value if intent.amount else "0")],
            [SmartPayNetworkFeeItem(network="acp", asset_symbol="ACP", amount=_DEFAULT_MIN_FEE_ACP)],
        )
    if intent.network == "bsc" and (intent.asset.symbol or "").upper() == "USDT" and source in {"ACP", "WACP", "USDT"}:
        if source == "USDT":
            route = [SmartPayRouteStep(kind="transfer", network="bsc", dex_or_rail=None, from_asset="USDT", to_asset="USDT", estimated_out=intent.amount.value if intent.amount else "0")]
            mode = "direct_send"
        elif source == "WACP":
            route = [
                SmartPayRouteStep(kind="swap", network="bsc", dex_or_rail="ancap_router_v1", from_asset="wACP", to_asset="USDT", estimated_out=intent.amount.value if intent.amount else "0"),
                SmartPayRouteStep(kind="transfer", network="bsc", dex_or_rail=None, from_asset="USDT", to_asset="USDT", estimated_out=intent.amount.value if intent.amount else "0"),
            ]
            mode = "swap_then_send"
        else:
            route = [
                SmartPayRouteStep(kind="bridge", network="acp", dex_or_rail="ancap_bridge_v1", from_asset="ACP", to_asset="wACP", estimated_out=intent.amount.value if intent.amount else "0"),
                SmartPayRouteStep(kind="swap", network="bsc", dex_or_rail="ancap_router_v1", from_asset="wACP", to_asset="USDT", estimated_out=intent.amount.value if intent.amount else "0"),
                SmartPayRouteStep(kind="transfer", network="bsc", dex_or_rail=None, from_asset="USDT", to_asset="USDT", estimated_out=intent.amount.value if intent.amount else "0"),
            ]
            mode = "swap_then_send"
        return (
            mode,
            route,
            [
                SmartPayNetworkFeeItem(network="acp", asset_symbol="ACP", amount=_DEFAULT_MIN_FEE_ACP),
                SmartPayNetworkFeeItem(network="bsc", asset_symbol="BNB", amount=str(_BSC_NETWORK_FEE_BNB)),
            ],
        )
    raise HTTPException(status_code=422, detail="Unsupported route for current Smart Pay scope")


def _required_source_amount(intent: PaymentIntentResponseItem, preferred_asset: str) -> str:
    target_amount = _intent_target_amount(intent)
    asset_symbol = (intent.asset.symbol or "").upper()
    source = preferred_asset.upper()
    if intent.network == "acp" and asset_symbol == "ACP" and source == "ACP":
        return _quantize_up(target_amount + Decimal(_DEFAULT_MIN_FEE_ACP) + _SERVICE_FEE_ACP, "0.00000001")
    if intent.network == "bsc" and asset_symbol == "USDT":
        if source == "USDT":
            return _quantize_up(target_amount, "0.000001")
        if source == "WACP":
            return _quantize_up(target_amount / Decimal("0.98"), "0.00000001")
        if source == "ACP":
            return _quantize_up(target_amount / _ACP_TO_USDT_RATE, "0.00000001")
    raise HTTPException(status_code=422, detail="Unsupported quote source/target pair")


def _build_quote(intent: PaymentIntentResponseItem, body: SmartPayQuoteRequest) -> SmartPayQuoteItem:
    s = get_settings()
    preferred = body.source_preference.preferred_asset.upper()
    allowed = {a.upper() for a in body.source_preference.allowed_assets}
    if allowed and preferred not in allowed:
        raise HTTPException(status_code=422, detail="preferredAsset must be present in allowedAssets")
    min_reserve = Decimal(str(body.source_preference.min_acp_fee_reserve or s.mobile_smart_pay_min_acp_fee_reserve))
    required_fee_reserve = Decimal(str(s.mobile_smart_pay_min_acp_fee_reserve))
    if min_reserve < required_fee_reserve:
        raise HTTPException(status_code=409, detail="ACP fee reserve below required minimum")
    source_asset = _source_asset_for_symbol(preferred)
    target_asset = _target_asset_from_intent(intent)
    mode, route, network_fee = _build_quote_route(intent, preferred)
    quote = SmartPayQuoteItem(
        quote_id=f"q_{uuid4().hex}",
        payment_intent_id=intent.id,
        mode=mode,
        expires_at=(datetime.now(timezone.utc) + timedelta(minutes=_QUOTE_TTL_MINUTES)).isoformat().replace("+00:00", "Z"),
        source_asset=source_asset,
        target_asset=target_asset,
        target_amount=str(intent.amount.value if intent.amount else "0"),
        required_source_amount=_required_source_amount(intent, preferred),
        service_fee_acp=str(_SERVICE_FEE_ACP),
        network_fee=network_fee,
        slippage_bps=min(int(body.source_preference.max_slippage_bps), int(s.mobile_smart_pay_max_slippage_bps)),
        route=route,
        warnings=list(intent.warnings),
        risk_flags=list(intent.risk_flags),
    )
    _SMART_PAY_QUOTES[quote.quote_id] = quote
    return quote


def _build_execution(intent: PaymentIntentResponseItem, quote: SmartPayQuoteItem) -> SmartPayExecutionItem:
    next_action = "sign_direct_send_tx" if quote.mode == "direct_send" else "sign_swap_tx"
    execution = SmartPayExecutionItem(
        id=f"pe_{uuid4().hex}",
        payment_intent_id=intent.id,
        quote_id=quote.quote_id,
        status="awaiting_local_signature",
        created_at=_utc_now_iso(),
        updated_at=_utc_now_iso(),
        recoverable=True,
        next_action=next_action,
        tx_refs=[],
        error=None,
    )
    _SMART_PAY_EXECUTIONS[execution.id] = execution
    return execution


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
        bsc_rpc_url=(s.bridge_bsc_rpc_url or "").strip(),
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


@router.get("/mobile/smart-pay/capabilities", response_model=SmartPayCapabilitiesResponse)
async def smart_pay_capabilities():
    s = get_settings()
    return SmartPayCapabilitiesResponse(
        enabled=bool(s.mobile_smart_pay_enabled),
        smart_qr_parse_enabled=True,
        smart_qr_ai_fallback_enabled=bool(s.mobile_smart_pay_ai_fallback_enabled),
        auto_swap_enabled=bool(s.mobile_smart_pay_auto_swap_enabled),
        supported_networks=["acp", "bsc"],
        supported_assets=_supported_assets(),
        max_image_bytes=int(s.mobile_smart_pay_max_image_bytes),
        max_slippage_bps=int(s.mobile_smart_pay_max_slippage_bps),
        min_acp_fee_reserve=str(s.mobile_smart_pay_min_acp_fee_reserve),
    )


@router.post("/mobile/smart-pay/parse", response_model=SmartQrParseResponse)
async def smart_pay_parse(body: SmartQrParseRequest):
    intent = _parse_smart_qr_payload(body.source, body.raw_payload)
    return SmartQrParseResponse(payment_intent=intent)


@router.post("/mobile/smart-pay/quote", response_model=SmartPayQuoteResponse)
async def smart_pay_quote(body: SmartPayQuoteRequest):
    intent = _get_payment_intent_or_404(body.payment_intent_id)
    quote = _build_quote(intent, body)
    return SmartPayQuoteResponse(quote=quote)


@router.post("/mobile/smart-pay/execute", response_model=SmartPayExecutionResponse)
async def smart_pay_execute(body: SmartPayExecuteRequest):
    if not body.confirmation_accepted:
        raise HTTPException(status_code=400, detail="confirmationAccepted must be true")
    intent = _get_payment_intent_or_404(body.payment_intent_id)
    quote = _get_quote_or_404(body.quote_id)
    if quote.payment_intent_id != intent.id:
        raise HTTPException(status_code=409, detail="quote does not belong to payment intent")
    execution = _build_execution(intent, quote)
    return SmartPayExecutionResponse(execution=execution)


@router.get("/mobile/smart-pay/payments/{execution_id}", response_model=SmartPayExecutionResponse)
async def smart_pay_payment_status(execution_id: str):
    execution = _SMART_PAY_EXECUTIONS.get((execution_id or "").strip())
    if execution is None:
        raise HTTPException(status_code=404, detail="execution not found")
    return SmartPayExecutionResponse(execution=execution)


@router.post("/mobile/smart-pay/payments/{execution_id}/recover", response_model=SmartPayExecutionResponse)
async def smart_pay_recover(execution_id: str, body: SmartPayRecoverRequest):
    execution = _SMART_PAY_EXECUTIONS.get((execution_id or "").strip())
    if execution is None:
        raise HTTPException(status_code=404, detail="execution not found")
    tx_refs = list(execution.tx_refs)
    for txid in body.client_known_txs:
        clean = (txid or "").strip()
        if not clean or any(existing.txid == clean for existing in tx_refs):
            continue
        tx_refs.append(SmartPayTxRef(role="client_known", network="unknown", txid=clean, explorer_url=None))
    execution = execution.model_copy(update={"status": "pending_reconciliation", "updated_at": _utc_now_iso(), "tx_refs": tx_refs})
    _SMART_PAY_EXECUTIONS[execution.id] = execution
    return SmartPayExecutionResponse(execution=execution)


@router.get("/mobile/health")
async def mobile_health():
    return JSONResponse({"ok": True, "service": "acp-wallet-mobile-gateway"})
