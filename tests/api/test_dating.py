"""ANCAP Dating API smoke tests."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.dating import BLE_SERVICE_UUID, DEVICE_NAME_PREFIX


@pytest.mark.asyncio
async def test_dating_catalog_public():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/v1/dating/catalog")
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "ANCAP Dating"
    assert data["device_name_prefix"] == DEVICE_NAME_PREFIX
    assert data["ble_service_uuid"] == BLE_SERVICE_UUID
    assert data["age_gate"] == "18+"


@pytest.mark.asyncio
async def test_dating_access_points_public_list(monkeypatch):
    async def _empty(_session, *, limit: int = 100):
        return []

    monkeypatch.setattr("app.api.routers.dating.svc.list_access_points", _empty)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/v1/dating/access-points")
    assert res.status_code == 200
    assert res.json() == []
