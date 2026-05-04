from app.services.bridge_decimal import (
    acp_smallest_to_wacp_wei,
    display_acp_from_smallest,
    wacp_wei_to_acp_smallest_floor,
)


def test_acp_to_wacp_roundtrip_floor():
    s = 100_000_000  # 1 ACP in smallest
    w = acp_smallest_to_wacp_wei(s)
    assert w == 10**18
    back, rem = wacp_wei_to_acp_smallest_floor(w)
    assert back == s
    assert rem == 0


def test_remainder_on_partial_wei():
    w = 10**18 + 123  # dust in wei
    back, rem = wacp_wei_to_acp_smallest_floor(w)
    assert rem == 123
    assert back == 10**8


def test_display():
    assert display_acp_from_smallest(1) == __import__("decimal").Decimal("0.00000001")
