import React, { useState } from 'react';
import { RefreshCw, Plus, Check, CloudOff, Wind, Droplets } from 'lucide-react';
import { ActivityRecommendation, WeatherData } from '../types';
import { formatWeather, generateRecommendations } from '../weather';

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

  const formatted = formatWeather(weather);
  const recommendations = generateRecommendations(weather);

  if (compact) {
    const topRec = recommendations[0];
    const isTopAdded = topRec && !!addedIds[topRec.id];

    return (
      <div
        className={`rounded-xl p-3.5 border transition-colors ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
            : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {formatted ? (
              <span className="text-base select-none" role="img" aria-label={formatted.description}>
                {formatted.emoji}
              </span>
            ) : (
              <CloudOff className="w-4 h-4 text-stone-400" />
            )}
            <div>
              <h4 className="text-xs font-semibold">
                {formatted ? `${formatted.temperatureText} · ${formatted.description}` : 'Weather unavailable'}
              </h4>
              <p className="text-[10px] text-stone-400">
                {formatted ? formatted.locationText : 'Fetching forecast...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            title="Refresh weather"
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-sage-600' : ''}`} />
          </button>
        </div>

        {topRec && (
          <div
            className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors ${
              isDark
                ? 'bg-[#121316]/60 border-[#282A30]/60'
                : 'bg-[#FAF9F6] border-[#F0EFEA]'
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{topRec.title}</p>
              <span className="font-mono text-[10px] tabular-nums text-stone-400">
                {topRec.durationMinutes}m offline
              </span>
            </div>

            <button
              onClick={() => handleAdd(topRec)}
              disabled={isTopAdded}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                isTopAdded
                  ? 'bg-sage-100 text-sage-800 dark:bg-sage-950 dark:text-sage-300'
                  : 'bg-sage-600 hover:bg-sage-700 text-white shadow-subtle'
              }`}
            >
              {isTopAdded ? (
                <>
                  <Check className="w-3 h-3" /> Planned
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> Plan
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-5 border transition-colors ${
        isDark
          ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
          : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800 mb-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Weather & Offline Suggestions</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Real atmospheric conditions calibrated to meaningful offline activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {formatted && (
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <span className="text-base select-none">{formatted.emoji}</span>
                <span className="font-mono font-medium text-stone-900 dark:text-stone-100">
                  {formatted.temperatureText}
                </span>
                <span>{formatted.description}</span>
              </span>
              <span className="text-stone-300 dark:text-stone-700">•</span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-stone-400" /> {formatted.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-stone-400" /> {formatted.windSpeed} km/h
              </span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            title="Refresh live weather"
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sage-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Suggested Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {recommendations.map(rec => {
          const isAdded = !!addedIds[rec.id];
          return (
            <div
              key={rec.id}
              className={`p-3.5 rounded-lg border flex flex-col justify-between transition-colors ${
                isDark
                  ? 'bg-[#121316]/50 border-[#282A30]'
                  : 'bg-[#FAF9F6] border-[#EAE9E4]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] tabular-nums text-stone-400 font-medium">
                    {rec.durationMinutes}m offline
                  </span>
                  <span className="text-[10px] text-stone-400 italic">
                    {rec.weatherTag}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-1">
                  {rec.title}
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-200/60 dark:border-stone-800 flex justify-end">
                <button
                  onClick={() => handleAdd(rec)}
                  disabled={isAdded}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isAdded
                      ? 'bg-sage-100 text-sage-800 dark:bg-sage-950 dark:text-sage-300'
                      : 'bg-sage-600 hover:bg-sage-700 text-white shadow-subtle'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3" /> Planned
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
