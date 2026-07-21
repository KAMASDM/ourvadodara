import React from 'react';
import { describeWeather } from '../../utils/weather';

const Drops = ({ count = 18 }) => <div className="weather-rain" aria-hidden="true">{Array.from({ length: count }, (_, index) => <i key={index} style={{ '--drop-index': index, '--drop-left': `${(index * 37) % 101}%`, '--drop-delay': `${-((index * 0.17) % 1.2)}s` }} />)}</div>;
const Snow = () => <div className="weather-snow" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <i key={index} style={{ '--flake-index': index, '--flake-left': `${(index * 29) % 101}%`, '--flake-delay': `${-((index * 0.31) % 3)}s` }}>•</i>)}</div>;

const WeatherAtmosphere = ({ symbolCode, compact = false }) => {
  const condition = describeWeather(symbolCode);
  return (
    <div className={`weather-atmosphere weather-atmosphere--${condition.kind} ${compact ? 'weather-atmosphere--compact' : ''}`} aria-hidden="true">
      {(condition.kind === 'cloudy' || condition.kind === 'rain' || condition.kind === 'thunder' || condition.kind === 'snow') && <><span className="weather-cloud weather-cloud--one" /><span className="weather-cloud weather-cloud--two" /></>}
      {(condition.kind === 'rain' || condition.kind === 'thunder') && <Drops count={condition.heavy ? 26 : 18} />}
      {condition.kind === 'thunder' && <span className="weather-lightning" />}
      {condition.kind === 'snow' && <Snow />}
      {condition.kind === 'fog' && <><span className="weather-fog weather-fog--one" /><span className="weather-fog weather-fog--two" /></>}
      {condition.kind === 'clear' && <span className="weather-sun" />}
      {condition.kind === 'clear-night' && <><span className="weather-moon" /><span className="weather-stars" /></>}
    </div>
  );
};

export default WeatherAtmosphere;
