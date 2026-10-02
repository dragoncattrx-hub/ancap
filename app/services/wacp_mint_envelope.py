"""Compute wACP mint envelope from reserve-proof fields (Gate A)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class WacpMintEnvelope:
    acp_reserve_smallest: int
    minted_acp_smallest: int
    operational_buffer_smallest: int
    max_additional_mint_acp_smallest: int
    gate_a_pass: bool
    notes: list[str]


def compute_mint_envelope(
    *,
    acp_reserve_balance_smallest: str | int | None,
    wacp_total_supply_acp_smallest: str | int | None,
    operational_buffer_smallest: str | int | None,
) -> WacpMintEnvelope:
    notes: list[str] = []

    def _int(raw: str | int | None) -> int:
        if raw is None:
            return 0
        return int(str(raw).strip() or "0")

    reserve = _int(acp_reserve_balance_smallest)
    minted = _int(wacp_total_supply_acp_smallest)
    buffer = _int(operational_buffer_smallest)

    headroom = reserve - buffer - minted
    m_max = max(0, headroom)

    if reserve <= 0:
        notes.append("ACP reserve balance is zero or unknown; mint envelope is zero.")
    if headroom < 0:
        notes.append(
            "Reserve minus buffer minus minted supply is negative; no additional mint permitted."
        )

    gate_a = m_max > 0 and headroom >= 0

    return WacpMintEnvelope(
        acp_reserve_smallest=reserve,
        minted_acp_smallest=minted,
        operational_buffer_smallest=buffer,
        max_additional_mint_acp_smallest=m_max,
        gate_a_pass=gate_a,
        notes=notes,
    )


def suggest_stage_a_mint(
    envelope: WacpMintEnvelope,
    approved_stage_a_cap_acp_smallest: int | None = None,
) -> int:
    """M_A = min(cap, M_max) when cap provided; else M_max."""
    if approved_stage_a_cap_acp_smallest is not None:
        return min(max(0, approved_stage_a_cap_acp_smallest), envelope.max_additional_mint_acp_smallest)
    return envelope.max_additional_mint_acp_smallest
