from app.services.wacp_mint_envelope import compute_mint_envelope, suggest_stage_a_mint


def test_mint_envelope_gate_a_pass():
    env = compute_mint_envelope(
        acp_reserve_balance_smallest="10000000000",
        wacp_total_supply_acp_smallest="100000000",
        operational_buffer_smallest="999000000",
    )
    assert env.gate_a_pass
    assert env.max_additional_mint_acp_smallest == 8901000000


def test_mint_envelope_gate_a_fail_when_over_minted():
    env = compute_mint_envelope(
        acp_reserve_balance_smallest="1000000000",
        wacp_total_supply_acp_smallest="2000000000",
        operational_buffer_smallest="0",
    )
    assert not env.gate_a_pass
    assert env.max_additional_mint_acp_smallest == 0


def test_suggest_stage_a_respects_cap():
    env = compute_mint_envelope(
        acp_reserve_balance_smallest="10000000000",
        wacp_total_supply_acp_smallest="0",
        operational_buffer_smallest="0",
    )
    assert suggest_stage_a_mint(env, 5_000_000_000) == 5_000_000_000
    assert suggest_stage_a_mint(env, 20_000_000_000) == env.max_additional_mint_acp_smallest
