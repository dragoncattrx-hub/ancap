from app.config import get_settings


def test_economy_health_shape(client, monkeypatch):
    class _Resp:
        status_code = 200

        @staticmethod
        def json():
            return {"result": 1}

    from app.api.routers import system as system_router

    monkeypatch.setattr(system_router.httpx, "post", lambda *args, **kwargs: _Resp())
    get_settings.cache_clear()
    r = client.get("/v1/system/economy-health")
    assert r.status_code == 200, r.text
    payload = r.json()
    assert "acp_rpc_ok" in payload
    assert "ledger_halted" in payload
    assert "pending_swaps" in payload
    assert "pending_referral_payout_jobs" in payload
