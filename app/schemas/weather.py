"""Public weather schemas (AccuWeather-backed, indicative)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class WeatherForecastDay(BaseModel):
    date: str | None = None
    min_c: float | None = None
    max_c: float | None = None
    day_text: str | None = None
    night_text: str | None = None
    precip_probability_day: int | None = None
    link: str | None = None


class WeatherHourly(BaseModel):
    time: str | None = None
    temperature_c: float | None = None
    weather_text: str | None = None
    precip_probability: int | None = None
    icon: int | None = None


class WeatherCurrentResponse(BaseModel):
    provider: str = "accuweather"
    status: str
    configured: bool
    city: str | None = None
    country: str | None = None
    admin_area: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    timezone: str | None = None
    temperature_c: float | None = None
    realfeel_c: float | None = None
    realfeel_phrase: str | None = None
    weather_text: str | None = None
    weather_icon: int | None = None
    weather_icon_url: str | None = None
    is_day_time: bool | None = None
    wind_kmh: float | None = None
    wind_gust_kmh: float | None = None
    wind_dir: str | None = None
    relative_humidity: int | None = None
    indoor_humidity: int | None = None
    dew_point_c: float | None = None
    uv_index: float | None = None
    uv_text: str | None = None
    visibility_km: float | None = None
    cloud_cover: int | None = None
    pressure_mb: float | None = None
    pressure_tendency: str | None = None
    ceiling_m: float | None = None
    precip_1h_mm: float | None = None
    precip_24h_mm: float | None = None
    observed_at: datetime | None = None
    forecast_today: WeatherForecastDay | None = None
    next_hour: WeatherHourly | None = None
    accuweather_url: str = "https://www.accuweather.com/"
    attribution: str = "Weather data provided by AccuWeather"
    notes: list[str] = Field(default_factory=list)
    fallback_provider: str | None = None
