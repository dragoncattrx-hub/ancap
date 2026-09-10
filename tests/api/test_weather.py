"""Weather API tests (AccuWeather proxy)."""
from __future__ import annotations

from app.main import app


def test_weather_routes_registered():
    paths = {getattr(r, "path", "") for r in app.routes}
    assert "/weather/current" in paths
    assert "/v1/weather/current" in paths
    assert "/weather/status" in paths


def test_weather_current_fallback_without_key(client, monkeypatch):
    monkeypatch.setenv("ACCUWEATHER_ENABLED", "true")
    monkeypatch.setenv("ACCUWEATHER_API_KEY", "")
    from app.config import get_settings

    get_settings.cache_clear()

    import app.services.accuweather as aw

    async def fake_fallback(lat: float, lon: float):
        return {
            "provider": "accuweather",
            "status": "fallback",
            "configured": False,
            "latitude": lat,
            "longitude": lon,
            "timezone": "UTC",
            "temperature_c": 12.5,
            "realfeel_c": 11.0,
            "weather_text": "Cloudy",
            "weather_icon": 7,
            "weather_icon_url": "https://www.accuweather.com/images/weathericons/07-s.png",
            "wind_kmh": 8.0,
            "relative_humidity": 70,
            "observed_at": None,
            "forecast_today": {"min_c": 8.0, "max_c": 14.0, "day_text": "Cloudy"},
            "next_hour": {"temperature_c": 12.0, "weather_text": "Cloudy"},
            "accuweather_url": "https://www.accuweather.com/",
            "attribution": "Weather data provided by AccuWeather",
            "notes": ["test"],
            "fallback_provider": "open-meteo",
        }

    monkeypatch.setattr(aw, "_open_meteo_fallback", fake_fallback)
    aw._CACHE.clear()

    res = client.get("/v1/weather/current?lat=50.45&lon=30.52", headers={"Authorization": ""})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["provider"] == "accuweather"
    assert "accuweather.com" in body["accuweather_url"]
    assert body["temperature_c"] == 12.5
    assert body["forecast_today"]["max_c"] == 14.0
