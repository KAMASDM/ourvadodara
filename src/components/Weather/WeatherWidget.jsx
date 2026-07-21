import React, { memo } from 'react';
import {
  Cloud, CloudFog, CloudLightning, CloudRain, Droplets, Moon, RefreshCw,
  Snowflake, Sun, Wind
} from 'lucide-react';
import { describeWeather, getMoonPhase, useVadodaraWeather } from '../../utils/weather';
import WeatherAtmosphere from './WeatherAtmosphere';

const WEATHER_ICONS = { thunder: CloudLightning, rain: CloudRain, snow: Snowflake, fog: CloudFog, cloudy: Cloud, clear: Sun, 'clear-night': Moon };

const Stat = memo(function Stat({ icon, value, label }) {
  return <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">{React.createElement(icon, { className: 'h-4 w-4 shrink-0', strokeWidth: 1.7 })}<span className="text-xs font-semibold tabular-nums">{value}</span>{label && <span className="text-[10px] text-slate-400">{label}</span>}</div>;
});

const WeatherWidget = memo(function WeatherWidget() {
  const { weather, loading, error, refresh } = useVadodaraWeather();
  if (loading && !weather) return <div className="mx-1 rounded-3xl border bg-white p-5 dark:bg-slate-900"><div className="animate-pulse space-y-3"><div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800" /></div></div>;
  if (error && !weather) return <div className="mx-1 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Weather is temporarily unavailable.</div>;

  const current = weather.current;
  const tomorrow = weather.tomorrow;
  const condition = describeWeather(current.symbolCode);
  const tomorrowCondition = describeWeather(tomorrow.symbolCode);
  const moon = getMoonPhase(tomorrow.date);
  const CurrentIcon = WEATHER_ICONS[condition.kind] || Cloud;

  return (
    <section className="relative isolate mx-1 overflow-hidden rounded-[1.75rem] border border-sky-200/70 bg-gradient-to-br from-sky-100 via-white to-indigo-100 shadow-sm dark:border-sky-900/60 dark:from-sky-950 dark:via-slate-950 dark:to-indigo-950">
      <WeatherAtmosphere symbolCode={current.symbolCode} />
      <div className="relative z-10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/75 text-sky-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-sky-200"><CurrentIcon className="h-8 w-8" /></div><div><p className="text-3xl font-black tabular-nums text-slate-950 dark:text-white">{current.temperature}°C</p><p className="font-semibold text-sky-800 dark:text-sky-200">{condition.label}</p><p className="text-xs text-slate-500 dark:text-slate-400">Vadodara · updated live</p></div></div>
          <button type="button" onClick={refresh} aria-label="Refresh weather" className="grid h-9 w-9 place-items-center rounded-full bg-white/60 text-slate-500 backdrop-blur transition hover:text-sky-700 dark:bg-white/10"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white/60 p-3 backdrop-blur dark:bg-black/15"><Stat icon={Droplets} value={`${current.humidity}%`} label="humidity" /><Stat icon={Wind} value={`${current.windSpeed} m/s`} label="wind" /><Stat icon={CloudRain} value={`${current.precipitation} mm`} label="rain" /></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Tomorrow</p><div className="mt-2 flex items-center justify-between"><div><p className="font-bold text-slate-900 dark:text-white">{tomorrowCondition.label}</p><p className="text-xs text-slate-500 dark:text-slate-400">{tomorrow.temperatureMin}°–{tomorrow.temperatureMax}° · {tomorrow.precipitationTotal} mm</p></div><span className="text-2xl">{tomorrowCondition.kind === 'thunder' ? '⛈️' : tomorrowCondition.kind === 'rain' ? '🌧️' : tomorrowCondition.kind === 'clear' ? '☀️' : '☁️'}</span></div></div>
          <div className="rounded-2xl border border-white/60 bg-white/65 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">Moon phase</p><div className="mt-2 flex items-center gap-3"><span className="text-3xl" aria-hidden="true">{moon.emoji}</span><div><p className="font-bold text-slate-900 dark:text-white">{moon.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{moon.illumination}% illuminated</p></div></div></div>
        </div>
        <a href={weather.providerUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[10px] text-slate-400 underline underline-offset-2">Weather data: MET Norway</a>
      </div>
    </section>
  );
});

export default WeatherWidget;
