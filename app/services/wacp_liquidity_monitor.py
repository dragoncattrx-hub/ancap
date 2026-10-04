"""Jobs-tick hooks for wACP liquidity posture (reserve + optional V3 pool)."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services.market_economy import OFFICIAL_WACP_POOL_V3, _configured_v3_pool
from app.services.wacp_mint_envelope import compute_mint_envelope

logger = logging.getLogger(__name__)


async def wacp_liquidity_monitor_tick(session: AsyncSession) -> dict[str, Any]:
    """Lightweight monitor: mint envelope + V3 bootstrap pool + fee-recycle gate."""
    from app.api.routers.bridge_rail import _live_reserve_proof_payload
    from app.services.wacp_fee_recycle import fee_recycle_eligibility

    reserve = await _live_reserve_proof_payload(session)
    envelope = compute_mint_envelope(
        acp_reserve_balance_smallest=reserve.acp_reserve_balance_smallest,
        wacp_total_supply_acp_smallest=reserve.wacp_total_supply_acp_smallest,
        operational_buffer_smallest=reserve.operational_buffer_smallest,
    )

    s = get_settings()
    v3_pool = _configured_v3_pool() or OFFICIAL_WACP_POOL_V3
    out: dict[str, Any] = {
        "ok": reserve.reserve_health in {"healthy", "degraded"},
        "reserve_health": reserve.reserve_health,
        "gate_a_pass": envelope.gate_a_pass,
        "max_additional_mint_acp_smallest": envelope.max_additional_mint_acp_smallest,
        "v3_pool_configured": bool(v3_pool),
        "v3_pool": v3_pool or None,
        "v3_bootstrap_shallow": True,
        "oracle_use_v3": bool(getattr(s, "wacp_oracle_use_v3", False)),
        "infinity_gate": {
            "eligible": False,
            "reason": "Requires sustained organic V3 volume per WACP_LIQUIDITY_V3_PLAYBOOK §28",
        },
    }

    try:
        out["fee_recycle"] = await fee_recycle_eligibility(session)
    except Exception as exc:
        logger.warning("wacp_fee_recycle_tick_failed: %s", exc)
        out["fee_recycle"] = {"eligible": False, "error": str(exc)[:200]}

    if v3_pool and s.bridge_bsc_rpc_url:
        try:
            from web3 import Web3

            w3 = Web3(Web3.HTTPProvider(s.bridge_bsc_rpc_url, request_kwargs={"timeout": 15}))
            if w3.is_connected():
                pool = w3.eth.contract(
                    address=Web3.to_checksum_address(v3_pool),
                    abi=[
                        {
                            "name": "slot0",
                            "outputs": [
                                {"type": "uint160"},
                                {"type": "int24"},
                                {"type": "uint16"},
                                {"type": "uint16"},
                                {"type": "uint16"},
                                {"type": "uint8"},
                                {"type": "bool"},
                            ],
                            "inputs": [],
                            "stateMutability": "view",
                            "type": "function",
                        }
                    ],
                )
                slot0 = pool.functions.slot0().call()
                out["v3_current_tick"] = int(slot0[1])
        except Exception as exc:
            logger.warning("wacp_v3_pool_tick_read_failed: %s", exc)
            out["v3_read_error"] = str(exc)[:200]

    return out
