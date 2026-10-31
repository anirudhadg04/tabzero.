import React, { useState } from 'react';
import { RefreshCw, Plus, Check, CloudOff, Wind, Droplets } from 'lucide-react';
import { ActivityRecommendation, WeatherData } from '../types';
import { formatWeather, generateRecommendations } from '../weather';
import { PillarBadge } from './PillarBadge';

interface WeatherActivityCardProps {
  weather: WeatherData | null;
  onRefreshWeather: () => void;
  onAddActivity: (recommendation: ActivityRecommendation) => void;
  compact?: boolean;
  isDark?: boolean;
}

export const WeatherActivityCard: React.FC<WeatherActivityCardProps> = ({
  weather,
  onRefreshWeather,
  onAddActivity,
  compact = false,
  isDark = false,
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
    }, 4000);
  };

  // Centralized single source of truth for normalized weather
  const formatted = formatWeather(weather);
  const recommendations = generateRecommendations(weather);

  if (compact) {
    const topRec = recommendations[0];
    const isTopAdded = topRec && !!addedIds[topRec.id];

    return (
      <div
        className={`rounded-2xl p-4 border transition-colors duration-300 ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 text-slate-900 shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {formatted ? (
              <span className="text-xl leading-none select-none" role="img" aria-label={formatted.description}>
                {formatted.emoji}
              </span>
            ) : (
              <CloudOff className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            )}
            <div>
              <h4 className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {formatted ? `${formatted.temperatureText} · ${formatted.description}` : 'Weather unavailable'}
              </h4>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <span>{formatted ? formatted.locationText : 'Fetching forecast...'}</span>
                {formatted?.isCached && (
                  <span className="opacity-75 font-medium text-[9px] px-1 py-0.2 bg-slate-200 dark:bg-slate-800 rounded">
                    Cached
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            title="Refresh Open-Meteo live weather"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        {topRec && (
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isDark
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">
                Weather Suggestion
              </span>
              <p className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {topRec.title}
              </p>
            </div>
            <button
              onClick={() => handleAdd(topRec)}
              disabled={isTopAdded}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                isTopAdded
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-sm'
              }`}
            >
              {isTopAdded ? (
                <>
                  <Check className="w-3 h-3 text-white" /> Planned
                </>
              ) : (
                '+ Plan'
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-6 border transition-colors ${
        isDark
          ? 'bg-[#131B2A] border-[#1F293D] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
          : 'bg-white border-slate-200/80 text-slate-900 shadow-subtle'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-base font-medium tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Weather & Offline Suggestions
            </h3>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              Open-Meteo Live
            </span>
            {formatted?.isCached && (
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full">
                Cached {formatted.observationTimeText && `(${formatted.observationTimeText})`}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Real atmospheric conditions calibrated to meaningful real-world offline activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {formatted ? (
            <div className={`flex items-center gap-3 border px-3.5 py-2 rounded-xl ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none select-none" role="img" aria-label={formatted.description}>
                  {formatted.emoji}
                </span>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatted.temperatureText}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{formatted.description}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatted.locationText}</span>
                </div>
              </div>

              <div className={`h-6 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <span className="flex items-center gap-1" title="Relative Humidity">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" /> {formatted.humidity}%
                </span>
                <span className="flex items-center gap-1" title="Wind Speed">
                  <Wind className="w-3.5 h-3.5 text-slate-400" /> {formatted.windSpeed} km/h
                </span>
              </div>
            </div>
          ) : (
            <div className={`flex items-center gap-2 text-xs italic border px-3 py-2 rounded-xl ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <CloudOff className="w-4 h-4 text-slate-400" />
              <span>Weather unavailable</span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            title="Refresh Open-Meteo weather"
            className={`p-2 border rounded-xl transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Suggested 3 Pillars Grid with Direct Plan Activity Integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {recommendations.map(rec => {
          const isAdded = !!addedIds[rec.id];
          return (
            <div
              key={rec.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50/50 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-subtle'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <PillarBadge pillar={rec.pillar} size="sm" />
                  <span className="text-[11px] text-slate-400 font-medium">{rec.durationMinutes}m</span>
                </div>

                <h4 className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {rec.description}
                </p>
              </div>

              <div className={`flex items-center justify-between pt-2 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className="text-[10px] text-slate-400 italic">{rec.weatherTag}</span>
                <button
                  onClick={() => handleAdd(rec)}
                  disabled={isAdded}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm active:scale-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" /> Planned
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Plan Activity
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
