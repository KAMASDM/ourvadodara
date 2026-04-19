// =============================================
// src/components/Weather/WeatherWidget.jsx
// Compact weather card with sessionStorage cache
// (10-min TTL). Shows temperature, condition, wind,
// humidity, and city name.
// =============================================
import React, { memo, useState, useEffect, useCallback } from 'react';
import { Cloud, Droplets, Wind, RefreshCw } from 'lucide-react';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

const Stat = memo(function Stat({ Icon, value, label }) {
  return (
    <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
      <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
      <span className="text-xs tabular-nums">{value}</span>
      {label && <span className="text-[10px] text-neutral-400">{label}</span>}
    </div>
  );
});

const WeatherWidget = memo(function WeatherWidget({
  city = 'Vadodara',
  fetchImpl,          // injection point for testing / custom API key
}) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async (force = false) => {
    const cacheKey = `weather_${city.toLowerCase()}`;
    if (!force) {
      const cached = getCached(cacheKey);
      if (cached) { setWeather(cached); setLoading(false); return; }
    }
    setLoading(true); setError(null);
    try {
      let data;
      if (fetchImpl) {
        data = await fetchImpl(city);
      } else {
        const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
        if (!API_KEY) throw new Error('No API key');
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        const json = await res.json();
        data = {
          temp: Math.round(json.main.temp),
          feels: Math.round(json.main.feels_like),
          condition: json.weather[0]?.main || 'Clear',
          icon: json.weather[0]?.icon,
          humidity: json.main.humidity,
          wind: Math.round(json.wind.speed),
          city: json.name,
        };
      }
      setCache(cacheKey, data);
      setWeather(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [city, fetchImpl]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  if (loading) return (
    <div className="card mx-4 mt-2 p-3 flex items-center gap-3">
      <div className="skeleton w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-3 w-32 rounded" />
      </div>
    </div>
  );

  if (error || !weather) return null;

  return (
    <div className="card mx-4 mt-2 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {weather.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.condition}
            width={40} height={40}
            className="w-10 h-10 object-contain"
          />
        )}
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            <span className="text-xl tabular-nums font-bold">{weather.temp}°</span>C
            <span className="ml-2 text-neutral-500 dark:text-neutral-400 font-normal">{weather.condition}</span>
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{weather.city}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <Stat Icon={Droplets} value={`${weather.humidity}%`} label="hum" />
        <Stat Icon={Wind} value={`${weather.wind} m/s`} />
        <button
          type="button"
          onClick={() => fetchWeather(true)}
          aria-label="Refresh weather"
          className="btn-icon w-6 h-6 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

export default WeatherWidget;
