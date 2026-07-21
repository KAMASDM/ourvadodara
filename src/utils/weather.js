import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase-config';

const CLIENT_CACHE_KEY = 'vadodara_weather_v2';
const CLIENT_CACHE_MS = 15 * 60 * 1000;
let pendingRequest = null;

export const describeWeather = symbolCode => {
  const code = String(symbolCode || 'cloudy').toLowerCase();
  const thunder = code.includes('thunder');
  const snow = code.includes('snow') || code.includes('sleet');
  const rain = code.includes('rain') || code.includes('drizzle');
  const fog = code.includes('fog');
  const cloudy = code.includes('cloud');
  const clear = code.includes('clear') || code.includes('fair');
  const heavy = code.includes('heavy');
  const isNight = code.endsWith('_night') || code.includes('polartwilight');

  let kind = 'cloudy';
  if (thunder) kind = 'thunder';
  else if (snow) kind = 'snow';
  else if (rain) kind = 'rain';
  else if (fog) kind = 'fog';
  else if (clear) kind = isNight ? 'clear-night' : 'clear';
  else if (cloudy) kind = 'cloudy';

  const labels = {
    thunder: heavy ? 'Heavy rain with thunderstorms' : 'Rain with thunderstorms',
    snow: heavy ? 'Heavy snow' : 'Snow showers',
    rain: heavy ? 'Heavy rain' : code.includes('light') ? 'Light rain' : 'Rain',
    fog: 'Foggy',
    cloudy: code.includes('partly') ? 'Partly cloudy' : 'Cloudy',
    clear: 'Clear sky',
    'clear-night': 'Clear night'
  };
  return { code, kind, label: labels[kind], isNight, heavy };
};
export const getMoonPhase = value => {
  const date = value ? new Date(value) : new Date();
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const synodicMonth = 29.53058867;
  const age = ((((date.getTime() - knownNewMoon) / 86400000) % synodicMonth) + synodicMonth) % synodicMonth;
  const fraction = age / synodicMonth;
  const phases = [
    ['New Moon', '🌑'], ['Waxing Crescent', '🌒'], ['First Quarter', '🌓'],
    ['Waxing Gibbous', '🌔'], ['Full Moon', '🌕'], ['Waning Gibbous', '🌖'],
    ['Last Quarter', '🌗'], ['Waning Crescent', '🌘']
  ];
  const index = Math.round(fraction * 8) % 8;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) / 2 * 100);
  return { name: phases[index][0], emoji: phases[index][1], illumination, age: Math.round(age * 10) / 10 };
};

const readClientCache = () => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CLIENT_CACHE_KEY) || 'null');
    return cached && Date.now() - cached.savedAt < CLIENT_CACHE_MS ? cached.data : null;
  } catch { return null; }
};

const requestWeather = async () => {
  if (!pendingRequest) {
    pendingRequest = httpsCallable(functions, 'getVadodaraWeather')({})
      .then(response => {
        const data = response.data;
        try { sessionStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* optional cache */ }
        return data;
      })
      .finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
};

export const useVadodaraWeather = () => {
  const [weather, setWeather] = useState(() => readClientCache());
  const [loading, setLoading] = useState(() => !readClientCache());
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setWeather(await requestWeather()); }
    catch (requestError) { setError(requestError?.message || 'Weather is temporarily unavailable'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!weather) refresh();
  }, [refresh, weather]);

  return { weather, loading, error, refresh };
};
