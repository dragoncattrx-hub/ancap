"""Public weather surface (AccuWeather-backed Earth widget)."""
from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.weather import WeatherCurrentResponse
from app.services import accuweather

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current", response_model=WeatherCurrentResponse)
async def weather_current(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    payload = await accuweather.fetch_current(lat=lat, lon=lon)
    return WeatherCurrentResponse(**{k: v for k, v in payload.items() if k in WeatherCurrentResponse.model_fields})


@router.get("/status")
async def weather_status():
    return {
        "provider": "accuweather",
        "configured": accuweather.is_configured(),
        "site": "https://www.accuweather.com/",
        "docs": "/legal/market-data",
    }
