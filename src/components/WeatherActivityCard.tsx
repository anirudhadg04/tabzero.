import React, { useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, RefreshCw, Plus, Check } from 'lucide-react';
import { ActivityRecommendation, WeatherData } from '../types';
import { generateRecommendations } from '../weather';
import { PillarBadge } from './PillarBadge';

interface WeatherActivityCardProps {
  weather: WeatherData | null;
  onRefreshWeather: () => void;
  onAddActivity: (recommendation: ActivityRecommendation) => void;
  compact?: boolean;
}

export const WeatherActivityCard: React.FC<WeatherActivityCardProps> = ({
  weather,
  onRefreshWeather,
  onAddActivity,
  compact = false,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshWeather();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAdd = (rec: ActivityRecommendation) => {
    onAddActivity(rec);
    setAddedIds(prev => ({ ...prev, [rec.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [rec.id]: false }));
    }, 2000);
  };

  const recommendations = generateRecommendations(weather);

  const getWeatherIcon = () => {
    if (!weather) return <Sun className="w-5 h-5 text-amber-500" />;
    const c = weather.condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain className="w-5 h-5 text-sky-500" />;
    if (c.includes('cloud') || c.includes('overcast')) return <Cloud className="w-5 h-5 text-slate-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  if (compact) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getWeatherIcon()}
            <div>
              <h4 className="text-xs font-semibold text-slate-800">
                {weather ? `${weather.temperature}°C, ${weather.condition}` : 'Outdoor Forecast'}
              </h4>
              <p className="text-[10px] text-slate-400">{weather?.city || 'Bangalore'}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {recommendations[0] && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                Weather Suggestion
              </span>
              <p className="text-xs font-medium text-slate-800 truncate">
                {recommendations[0].title}
              </p>
            </div>
            <button
              onClick={() => handleAdd(recommendations[0])}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-[11px] font-medium text-slate-700 rounded-lg border border-slate-200 transition-all shrink-0"
            >
              + Plan
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-slate-900 tracking-tight">
              Weather & Offline Suggestions
            </h3>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              Open-Meteo Live
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real atmospheric conditions calibrated to meaningful real-world offline activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {weather ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                {getWeatherIcon()}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-semibold text-slate-900">{weather.temperature}°C</span>
                    <span className="text-xs text-slate-500 font-medium">{weather.condition}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{weather.city}</span>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <span className="flex items-center gap-1" title="Relative Humidity">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" /> {weather.humidity}%
                </span>
                <span className="flex items-center gap-1" title="Wind Speed">
                  <Wind className="w-3.5 h-3.5 text-slate-400" /> {weather.windSpeed} km/h
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Fetching Open-Meteo...</div>
          )}

          <button
            onClick={handleRefresh}
            title="Refresh Open-Meteo weather"
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Suggested 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {recommendations.map(rec => {
          const isAdded = !!addedIds[rec.id];
          return (
            <div
              key={rec.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-subtle transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <PillarBadge pillar={rec.pillar} size="sm" />
                  <span className="text-[11px] text-slate-400 font-medium">{rec.durationMinutes}m</span>
                </div>

                <h4 className="text-sm font-medium text-slate-800 mb-1">{rec.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {rec.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 italic">{rec.weatherTag}</span>
                <button
                  onClick={() => handleAdd(rec)}
                  disabled={isAdded}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm active:scale-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> Plan Activity
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
