import pytest
from fastapi import HTTPException

from app.api.routers import wallet_acp


def _valid_supply():
    cap = 210_000_000 * 100_000_000
    return {
        "initialized": True,
        "height": 2,
        "max_supply_units": str(cap),
        "max_supply_acp": "210000000",
        "issued_supply_units": str(cap),
        "issued_supply_acp": "210000000",
        "utxo_supply_units": str(cap - 100),
        "utxo_supply_acp": "209999999.999999",
        "supply_invariant_ok": True,
    }


def test_supply_guard_accepts_exact_210m_state(monkeypatch):
    monkeypatch.setattr(wallet_acp, "_require_acp_rpc_url", lambda: "http://node/rpc")
    monkeypatch.setattr(wallet_acp, "_rpc_call", lambda *_args, **_kwargs: _valid_supply())

    result = wallet_acp._chain_supply_info(required=True)

    assert result is not None
    assert result["max_supply_units"] == 21_000_000_000_000_000
    assert result["utxo_supply_units"] == 20_999_999_999_999_900


@pytest.mark.parametrize(
    "field,value",
    [
        ("max_supply_units", str(211_000_000 * 100_000_000)),
        ("issued_supply_units", str(211_000_000 * 100_000_000)),
        ("utxo_supply_units", str(211_000_000 * 100_000_000)),
        ("supply_invariant_ok", False),
    ],
)
def test_supply_guard_fails_closed(monkeypatch, field, value):
    payload = _valid_supply()
    payload[field] = value
    monkeypatch.setattr(wallet_acp, "_require_acp_rpc_url", lambda: "http://node/rpc")
    monkeypatch.setattr(wallet_acp, "_rpc_call", lambda *_args, **_kwargs: payload)

    with pytest.raises(HTTPException) as exc:
        wallet_acp._chain_supply_info(required=True)

    assert exc.value.status_code == 503
    assert "supply invariant" in str(exc.value.detail)
