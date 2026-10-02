import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "wacp"))

from v3_math import deploy_from_wacp_amount, human_to_raw_price, snap_ticks  # noqa: E402


def test_human_to_raw_price_wacp_token0():
    # wACP 18 dec, USDT 18 dec → multiplier 1
    raw = human_to_raw_price(1.0, 18, 18)
    assert abs(raw - 1.0) < 1e-12


def test_snap_ticks_respects_spacing():
    low, high = snap_ticks(-100.2, 200.7, 50)
    assert low % 50 == 0
    assert high % 50 == 0
    assert low < high


def test_deploy_from_wacp_amount_positive_usdt():
    plan = deploy_from_wacp_amount(
        wacp_amount=1000.0,
        p0_usdt_per_wacp=0.001,
        range_fraction=0.20,
        tick_spacing=50,
        token0_decimals=18,
        token1_decimals=18,
    )
    assert plan.amount0 == 1000.0
    assert plan.amount1 > 0
    assert plan.tick_lower < plan.tick_upper
    assert plan.usdt_required == plan.amount1
