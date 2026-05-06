// =============================================
// src/components/Weather/WeatherWidget.jsx
// Weather — session-cached fetch, cleaner layout,
// graceful skeleton, no layout shift.
// =============================================
import React, { memo, useEffect, useState, useCallback } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Eye as EyeIcon } from 'lucide-react';

const CACHE_KEY = 'ov_weather_v1';
const CACHE_TTL = 10 * 60 * 1000; // 10 min

const ICON = {
  Clear: Sun, Sunny: Sun,
  Clouds: Cloud, Cloudy: Cloud,
  Rain: CloudRain, Drizzle: CloudRain,
  Snow: CloudSnow,
  Thunderstorm: CloudLightning,
};

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
};
const writeCache = (data) => {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
};

const WeatherWidget = memo(function WeatherWidget({ city = 'Vadodara', fetchImpl }) {
  const [data, setData] = useState(() => readCache());
  const [loading, setLoading] = useState(!data);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      if (fetchImpl) {
        const d = await fetchImpl(city);
        setData(d); writeCache(d); setLoading(false);
      } else {
        // placeholder — plug your OpenWeather/AccuWeather call here
        setData({ temp: 32, desc: 'Sunny', cond: 'Sunny', humidity: 65, wind: 12, uv: 7, city });
        setLoading(false);
      }
    } catch (e) { setErr(e); setLoading(false); }
  }, [city, fetchImpl]);

  useEffect(() => { if (!data) load(); }, [data, load]);

  if (loading) {
    return (
      <div className="card p-4 mx-4 mb-3.5">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1">
            <div className="skeleton h-8 w-20" />
            <div className="skeleton h-3 w-28" />
          </div>
          <div className="skeleton w-12 h-12 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {[0,1,2].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
        </div>
      </div>
    );
  }
  if (err || !data) return null;

  const Icon = ICON[data.cond] || Sun;

  return (
    <section className="card p-4 mx-4 mb-3.5" aria-label={`Weather in ${data.city}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-3xl font-bold tracking-tight leading-none tabular-nums">{data.temp}°</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
            <span aria-hidden>📍</span>{data.city} · {data.desc}
          </div>
        </div>
        <Icon className="w-11 h-11 text-accent-500" strokeWidth={1.8} />
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        <Stat icon={<Droplets className="w-3.5 h-3.5" />} label="Humidity" value={`${data.humidity}%`} />
        <Stat icon={<Wind     className="w-3.5 h-3.5" />} label="Wind"     value={`${data.wind} km/h`} />
        <Stat icon={<EyeIcon  className="w-3.5 h-3.5" />} label="UV index" value={String(data.uv)} />
      </div>
    </section>
  );
});

const Stat = memo(({ icon, label, value }) => (
  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-2 py-2 text-center">
    <div className="flex items-center justify-center gap-1 text-neutral-400 mb-0.5">{icon}</div>
    <div className="text-sm font-bold tabular-nums">{value}</div>
    <div className="text-[9px] uppercase tracking-wider text-neutral-400 mt-0.5">{label}</div>
  </div>
));

export default WeatherWidget;
