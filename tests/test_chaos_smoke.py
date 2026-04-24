def test_chaos_jobs_tick_stability(client):
    # Lightweight chaos smoke: repeated tick calls should remain stable.
    for _ in range(3):
        r = client.post("/system/jobs/tick")
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

