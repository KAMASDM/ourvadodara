import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Open-Meteo – free, no API key, no CORS issues (Vadodara coords)
const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=22.3119&longitude=73.1812' +
  '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,uv_index' +
  '&daily=temperature_2m_max,temperature_2m_min,weather_code' +
  '&timezone=Asia%2FKolkata&forecast_days=5';

/** Map WMO weather codes → internal condition string */
const wmoToCondition = (code) => {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'foggy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  if (code <= 82) return 'rainy';
  if (code <= 86) return 'snowy';
  return 'thunderstorm'; // 95-99
};

const DAY_LABELS = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri'];

const WeatherWidget = ({ location = 'Vadodara', className = '' }) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OPEN_METEO_URL);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const c = data.current;
      const d = data.daily;
      setWeather({
        current: {
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          uvIndex: c.uv_index ?? '—',
          condition: wmoToCondition(c.weather_code),
        },
        forecast: d.time.slice(0, 5).map((_, i) => ({
          day: DAY_LABELS[i] ?? d.time[i],
          high: Math.round(d.temperature_2m_max[i]),
          low: Math.round(d.temperature_2m_min[i]),
          condition: wmoToCondition(d.weather_code[i]),
        })),
      });
      setLastUpdated(new Date());
    } catch {
      setError(t('weather.fetchError', 'Failed to load weather data'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchWeather]);

  const WeatherIcon = ({ condition, size = 'md' }) => {
    const cls = size === 'lg' ? 'w-10 h-10' : 'w-4 h-4';
    switch (condition) {
      case 'sunny': return <Sun className={`${cls} text-yellow-400`} />;
      case 'cloudy': return <Cloud className={`${cls} text-neutral-400`} />;
      case 'rainy': return <CloudRain className={`${cls} text-blue-400`} />;
      case 'snowy': return <CloudSnow className={`${cls} text-sky-300`} />;
      case 'thunderstorm': return <CloudLightning className={`${cls} text-violet-400`} />;
      default: return <Cloud className={`${cls} text-neutral-400`} />;
    }
  };

  const conditionLabel = (c) => ({
    sunny: t('weather.sunny', 'Sunny'),
    cloudy: t('weather.cloudy', 'Cloudy'),
    foggy: t('weather.foggy', 'Foggy'),
    rainy: t('weather.rainy', 'Rainy'),
    snowy: t('weather.snowy', 'Snowy'),
    thunderstorm: t('weather.thunderstorm', 'Thunderstorm'),
  }[c] ?? c);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className={`bg-white dark:bg-neutral-800 rounded-2xl p-4 animate-pulse ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="h-10 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-1" />
            <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
          <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-12 bg-neutral-100 dark:bg-neutral-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className={`bg-white dark:bg-neutral-800 rounded-2xl p-4 ${className}`}>
        <p className="text-sm text-danger mb-3">{error}</p>
        <button
          onClick={fetchWeather}
          className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const { current, forecast } = weather;

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-700 ${className}`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          <MapPin className="w-3 h-3" />
          {location}
        </div>
        <button
          onClick={fetchWeather}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 dark:text-neutral-500 transition"
          aria-label="Refresh weather"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hero row */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div>
          <div className="text-4xl font-bold text-neutral-900 dark:text-white leading-none">
            {current.temperature}°
          </div>
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mt-1">
            {conditionLabel(current.condition)}
          </div>
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {t('weather.feelsLike', 'Feels like')} {current.feelsLike}°C
          </div>
        </div>
        <WeatherIcon condition={current.condition} size="lg" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px bg-neutral-100 dark:bg-neutral-700 border-t border-neutral-100 dark:border-neutral-700">
        {[
          {
            icon: <Droplets className="w-3.5 h-3.5" />,
            label: t('weather.humidity', 'Humidity'),
            value: `${current.humidity}%`,
          },
          {
            icon: <Wind className="w-3.5 h-3.5" />,
            label: t('weather.wind', 'Wind'),
            value: `${current.windSpeed} km/h`,
          },
          {
            icon: <Eye className="w-3.5 h-3.5" />,
            label: t('weather.uv', 'UV Index'),
            value: current.uvIndex,
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 py-3 bg-white dark:bg-neutral-800"
          >
            <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{value}</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div className="px-4 pt-3 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2.5">
          {t('weather.forecast', '5-Day Forecast')}
        </p>
        <div className="space-y-1.5">
          {forecast.map((day, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-neutral-500 dark:text-neutral-400 font-medium">{day.day}</span>
              <span className="flex-1 flex items-center">
                <WeatherIcon condition={day.condition} size="sm" />
              </span>
              <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                {day.high}°
              </span>
              <span className="text-neutral-400 dark:text-neutral-500">/{day.low}°</span>
            </div>
          ))}
        </div>
      </div>

      {lastUpdated && (
        <div className="px-4 pb-3 text-[10px] text-neutral-400 dark:text-neutral-500 text-center">
          {t('weather.lastUpdated', 'Updated')} {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;