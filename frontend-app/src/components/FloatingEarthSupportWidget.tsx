"use client";

import { useEffect, useMemo, useState } from "react";

const GEO_CACHE_KEY = "ancap_earth_geo_v1";
const WEATHER_CACHE_KEY = "ancap_earth_weather_v1";
const CACHE_TTL_MS = 30 * 60 * 1000;

type GeoInfo = {
  lat: number;
  lon: number;
  city: string;
  country: string;
  timezone: string;
};

type WeatherInfo = {
  tempC: number | null;
  code: number | null;
  windKmh: number | null;
};

type CacheEnvelope<T> = { savedAt: number; data: T };

function readCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    const payload: CacheEnvelope<T> = { savedAt: Date.now(), data };
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function weatherLabelRu(code: number | null): string {
  if (code == null) return "—";
  if (code === 0) return "ясно";
  if (code <= 3) return "облачно";
  if (code <= 48) return "туман";
  if (code <= 57) return "морось";
  if (code <= 67) return "дождь";
  if (code <= 77) return "снег";
  if (code <= 82) return "ливень";
  if (code <= 86) return "снегопад";
  if (code <= 99) return "гроза";
  return "погода";
}

async function fetchGeo(): Promise<GeoInfo> {
  const cached = readCache<GeoInfo>(GEO_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch("https://get.geojs.io/v1/ip/geo.json", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("geo failed");
  const j = (await res.json()) as Record<string, unknown>;
  const lat = Number(j.latitude);
  const lon = Number(j.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("geo coords");
  const data: GeoInfo = {
    lat,
    lon,
    city: String(j.city || j.region || "—"),
    country: String(j.country || j.country_code || ""),
    timezone: String(j.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"),
  };
  writeCache(GEO_CACHE_KEY, data);
  return data;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherInfo> {
  const cached = readCache<WeatherInfo>(WEATHER_CACHE_KEY);
  if (cached) return cached;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("weather failed");
  const j = (await res.json()) as { current?: Record<string, number> };
  const data: WeatherInfo = {
    tempC: typeof j.current?.temperature_2m === "number" ? j.current.temperature_2m : null,
    code: typeof j.current?.weather_code === "number" ? j.current.weather_code : null,
    windKmh: typeof j.current?.wind_speed_10m === "number" ? j.current.wind_speed_10m : null,
  };
  writeCache(WEATHER_CACHE_KEY, data);
  return data;
}

function formatClock(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  } catch {
    return now.toISOString().slice(11, 19);
  }
}

export function FloatingEarthSupportWidget() {
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState("");
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const g = await fetchGeo();
        if (cancelled) return;
        setGeo(g);
        const w = await fetchWeather(g.lat, g.lon);
        if (cancelled) return;
        setWeather(w);
      } catch {
        if (!cancelled) setError("гео/погода временно недоступны");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clock = useMemo(
    () => formatClock(now, geo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"),
    [now, geo?.timezone],
  );

  const place = geo
    ? [geo.city, geo.country].filter(Boolean).join(", ")
    : error
      ? "—"
      : "определяем…";

  const temp =
    weather?.tempC != null ? `${weather.tempC > 0 ? "+" : ""}${Math.round(weather.tempC)}°C` : "—";

  return (
    <aside
      aria-label="Локальное время, погода и поддержка"
      className="pointer-events-none fixed bottom-[max(0.85rem,env(safe-area-inset-bottom))] right-3 z-[90] w-[min(17.5rem,calc(100vw-1.5rem))] sm:right-4"
    >
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-white/12 bg-[#071020]/94 text-white shadow-[0_18px_50px_rgba(0,0,0,0.48)] backdrop-blur-xl">
        <div className="flex gap-3 p-3">
          <div className="ancap-earth" aria-hidden="true">
            <div className="ancap-earth__map" />
            <div className="ancap-earth__shine" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200/90">
              Live · Earth
            </div>
            <div className="mt-1 font-mono text-lg font-semibold leading-none tracking-tight text-white">
              {clock}
            </div>
            <div className="mt-1 truncate text-[11px] text-white/55" title={place}>
              {place}
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px]">
              <span className="font-semibold text-emerald-200">{temp}</span>
              <span className="text-white/55">{weatherLabelRu(weather?.code ?? null)}</span>
              {weather?.windKmh != null ? (
                <span className="text-white/40">{Math.round(weather.windKmh)} км/ч</span>
              ) : null}
            </div>
            {geo ? (
              <div className="mt-1 text-[10px] text-white/35">
                {geo.lat.toFixed(2)}°, {geo.lon.toFixed(2)}° · IP
              </div>
            ) : error ? (
              <div className="mt-1 text-[10px] text-amber-200/80">{error}</div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setSupportOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-2 text-left hover:border-emerald-300/40 hover:bg-emerald-400/[0.12]"
          >
            <span className="text-xs font-semibold text-emerald-100">Support 24/7</span>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              Online
            </span>
          </button>

          {supportOpen ? (
            <div className="mt-2 space-y-1.5 text-[12px]">
              <a
                href="mailto:support@ancap.cloud"
                className="block rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white/80 hover:border-white/25 hover:text-white"
              >
                support@ancap.cloud
              </a>
              <a
                href="https://t.me/ancap24news"
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white/80 hover:border-white/25 hover:text-white"
              >
                Telegram · @ancap24news
              </a>
              <a
                href="/legal"
                className="block rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white/80 hover:border-white/25 hover:text-white"
              >
                Legal / контакты
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
