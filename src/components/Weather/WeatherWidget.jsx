// =============================================
// src/components/Weather/WeatherWidget.jsx
// Weather widget with location-based updates
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  Eye,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WeatherWidget = ({ location = 'Vadodara', className = '' }) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Mock weather data - in real app, fetch from weather API
  const mockWeatherData = {
    current: {
      temperature: 32,
      condition: 'sunny',
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      feelsLike: 35,
      uvIndex: 7
    },
    forecast: [
      { day: 'Today', high: 35, low: 28, condition: 'sunny' },
      { day: 'Tomorrow', high: 33, low: 26, condition: 'cloudy' },
      { day: 'Tuesday', high: 30, low: 24, condition: 'rainy' },
      { day: 'Wednesday', high: 29, low: 23, condition: 'thunderstorm' }
    ]
  };

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWeather(mockWeatherData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rainy': return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'snowy': return <CloudSnow className="w-8 h-8 text-blue-300" />;
      case 'thunderstorm': return <CloudLightning className="w-8 h-8 text-purple-500" />;
      default: return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getConditionText = (condition) => {
    const conditions = {
      sunny: t('weather.sunny', 'Sunny'),
      cloudy: t('weather.cloudy', 'Cloudy'), 
      rainy: t('weather.rainy', 'Rainy'),
      snowy: t('weather.snowy', 'Snowy'),
      thunderstorm: t('weather.thunderstorm', 'Thunderstorm')
    };
    return conditions[condition] || condition;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={fetchWeather}
            className="text-blue-500 hover:text-blue-600 text-sm flex items-center justify-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-800 dark:to-blue-900 rounded-lg shadow-md p-4 text-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{location}</span>
        </div>
        <button
          onClick={fetchWeather}
          className="text-white/80 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Current Weather */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-bold mb-1">
            {weather.current.temperature}°C
          </div>
          <div className="text-sm opacity-90">
            {getConditionText(weather.current.condition)}
          </div>
          <div className="text-xs opacity-75">
            {t('weather.feelsLike', 'Feels like')} {weather.current.feelsLike}°C
          </div>
        </div>
        <div className="text-right">
          {getWeatherIcon(weather.current.condition)}
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="text-center">
          <Droplets className="w-4 h-4 mx-auto mb-1 opacity-75" />
          <div className="opacity-90">{weather.current.humidity}%</div>
          <div className="opacity-75">{t('weather.humidity', 'Humidity')}</div>
        </div>
        <div className="text-center">
          <Wind className="w-4 h-4 mx-auto mb-1 opacity-75" />
          <div className="opacity-90">{weather.current.windSpeed} km/h</div>
          <div className="opacity-75">{t('weather.wind', 'Wind')}</div>
        </div>
        <div className="text-center">
          <Eye className="w-4 h-4 mx-auto mb-1 opacity-75" />
          <div className="opacity-90">{weather.current.visibility} km</div>
          <div className="opacity-75">{t('weather.visibility', 'Visibility')}</div>
        </div>
      </div>

      {/* Forecast */}
      <div className="border-t border-white/20 pt-3">
        <div className="text-xs opacity-75 mb-2">
          {t('weather.forecast', '4-Day Forecast')}
        </div>
        <div className="space-y-2">
          {weather.forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="w-16 opacity-90">{day.day}</span>
              <div className="flex items-center flex-1 justify-center">
                <div className="w-5 h-5 flex items-center justify-center">
                  {React.cloneElement(getWeatherIcon(day.condition), { 
                    className: 'w-4 h-4' 
                  })}
                </div>
              </div>
              <span className="opacity-90">
                {day.high}°/{day.low}°
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs opacity-60 mt-3 text-center">
          {t('weather.lastUpdated', 'Last updated')}: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;