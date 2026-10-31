import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles, Moon, Sun, Monitor } from 'lucide-react';
import { OfflineStorageSchema, RestrictedSite, ActivityRecommendation } from '../types';
import { getStorageData } from '../storage';
import { sendExtensionMessage, subscribeToStorage } from '../services/bridge';
import { HistoryControls } from '../components/HistoryControls';
import { DetoxTimerCard } from '../components/DetoxTimerCard';
import { RestrictedSitesCard } from '../components/RestrictedSitesCard';
import { WeatherActivityCard } from '../components/WeatherActivityCard';
import { INITIAL_STORAGE } from '../storage/defaults';

export const Popup: React.FC = () => {
  const [data, setData] = useState<OfflineStorageSchema>(INITIAL_STORAGE);
  const [loading, setLoading] = useState(true);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Dynamic system theme listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    getStorageData().then(d => {
      setData(d);
      setLoading(false);
      // Auto-refresh weather if missing
      if (!d.weather) {
        sendExtensionMessage({ type: 'REFRESH_WEATHER' }).then(setData).catch(() => {});
      }
    });

    const unsubscribe = subscribeToStorage((updated) => {
      setData(updated);
    });

    return () => unsubscribe();
  }, []);

  const themePref = data.themePreference || 'system';
  const isDarkMode = themePref === 'dark' ? true : themePref === 'light' ? false : systemIsDark;

  const handleToggleTheme = async () => {
    const nextTheme: 'system' | 'light' | 'dark' =
      themePref === 'system' ? 'dark' : themePref === 'dark' ? 'light' : 'system';
    const updated = await sendExtensionMessage({ type: 'SET_THEME', theme: nextTheme });
    setData(updated);
  };

  const handleOpenDashboard = () => {
    sendExtensionMessage({ type: 'OPEN_DASHBOARD' });
  };

  const handleUndo = async () => {
    const updated = await sendExtensionMessage({ type: 'TRIGGER_UNDO' });
    setData(updated);
  };

  const handleRedo = async () => {
    const updated = await sendExtensionMessage({ type: 'TRIGGER_REDO' });
    setData(updated);
  };

  const handleStartSession = async (totalSeconds: number, isIndefinite?: boolean) => {
    const updated = await sendExtensionMessage({
      type: 'SESSION_START',
      durationSeconds: totalSeconds,
      durationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
      isIndefinite: !!isIndefinite,
    });
    setData(updated);
  };

  const handlePauseSession = async () => {
    const updated = await sendExtensionMessage({ type: 'SESSION_PAUSE' });
    setData(updated);
  };

  const handleResumeSession = async () => {
    const updated = await sendExtensionMessage({ type: 'SESSION_RESUME' });
    setData(updated);
  };

  const handleCompleteSession = async () => {
    const updated = await sendExtensionMessage({ type: 'SESSION_COMPLETE' });
    setData(updated);
  };

  const handleCancelSession = async () => {
    const updated = await sendExtensionMessage({ type: 'SESSION_CANCEL' });
    setData(updated);
  };

  const handleAddSite = async (domain: string, category?: RestrictedSite['category']) => {
    const updated = await sendExtensionMessage({
      type: 'ADD_SITE',
      domain,
      category,
    });
    setData(updated);
  };

  const handleRemoveSite = async (id: string) => {
    const updated = await sendExtensionMessage({
      type: 'REMOVE_SITE',
      id,
    });
    setData(updated);
  };

  const handleToggleSite = async (id: string) => {
    const updated = await sendExtensionMessage({
      type: 'TOGGLE_SITE',
      id,
    });
    setData(updated);
  };

  const handleRefreshWeather = async () => {
    const updated = await sendExtensionMessage({ type: 'REFRESH_WEATHER' });
    setData(updated);
  };

  const handleAddWeatherActivity = async (rec: ActivityRecommendation) => {
    const updated = await sendExtensionMessage({
      type: 'ADD_ACTIVITY',
      activity: {
        title: rec.title,
        pillar: rec.pillar,
        durationMinutes: rec.durationMinutes,
        weatherRecommended: true,
        completed: false,
      },
    });
    setData(updated);
  };

  if (loading) {
    return (
      <div
        className={`w-[380px] h-[450px] flex items-center justify-center p-6 text-xs ${
          isDarkMode ? 'bg-[#0B0F19] text-slate-400' : 'bg-offline-bg text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-indigo-500 animate-spin" />
          <span>Opening tabzero...</span>
        </div>
      </div>
    );
  }

  const { present } = data.history;
  const sessionMinutes = present.completedSessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const activityMinutes = present.activities
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.durationMinutes, 0);

  const totalOfflineMins = sessionMinutes + activityMinutes;
  const goalMins = present.dailyGoalMinutes;
  const progressPct = Math.min(100, Math.round((totalOfflineMins / goalMins) * 100));

  return (
    <div
      className={`w-[380px] max-w-full p-4 space-y-3 font-sans transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#0B0F19] text-slate-100'
          : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-2 border-b transition-colors ${
          isDarkMode ? 'border-[#1F293D]' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <img
            src="icons/icon48.png"
            alt="tabzero logo"
            className="w-6 h-6 rounded-full object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          />
          <div>
            <h2 className="text-xs font-bold tracking-tight">tabzero.</h2>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              Digital Detox
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Universal Theme Mode Toggle */}
          <button
            onClick={handleToggleTheme}
            title={`Current Theme: ${themePref.toUpperCase()} (Click to change mode across all pages)`}
            className={`p-1.5 rounded-lg border shadow-subtle transition-all cursor-pointer flex items-center gap-1 ${
              isDarkMode
                ? 'text-amber-300 bg-[#131B2A] border-[#1F293D] hover:bg-[#1C273C]'
                : 'text-indigo-600 bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            {themePref === 'dark' ? (
              <Moon className="w-3.5 h-3.5 fill-current" />
            ) : themePref === 'light' ? (
              <Sun className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Monitor className="w-3.5 h-3.5" />
            )}
          </button>

          <HistoryControls
            history={data.history}
            onUndo={handleUndo}
            onRedo={handleRedo}
            compact={true}
          />

          <button
            onClick={handleOpenDashboard}
            title="Open Full Dashboard in Tab"
            className={`p-1.5 rounded-lg border shadow-subtle transition-all cursor-pointer ${
              isDarkMode
                ? 'text-slate-300 hover:text-white bg-[#131B2A] border-[#1F293D] hover:bg-[#1C273C]'
                : 'text-slate-500 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Daily Progress Ribbon */}
      <div
        className={`p-3 rounded-xl border transition-colors ${
          isDarkMode
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 shadow-subtle'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span
            className={`font-medium flex items-center gap-1 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-400" /> Today's Offline Space
          </span>
          <span className="font-semibold">
            {totalOfflineMins} / {goalMins}m
          </span>
        </div>
        <div
          className={`w-full rounded-full h-1.5 overflow-hidden ${
            isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
          }`}
        >
          <div
            className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Detox Timer Card */}
      <DetoxTimerCard
        session={present.activeSession}
        onStart={handleStartSession}
        onPause={handlePauseSession}
        onResume={handleResumeSession}
        onComplete={handleCompleteSession}
        onCancel={handleCancelSession}
        compact={true}
        isDark={isDarkMode}
      />

      {/* Weather & Offline Activity Suggestion with + Plan */}
      <WeatherActivityCard
        weather={data.weather}
        onRefreshWeather={handleRefreshWeather}
        onAddActivity={handleAddWeatherActivity}
        compact={true}
        isDark={isDarkMode}
      />

      {/* Website Restriction List */}
      <RestrictedSitesCard
        sites={present.restrictedSites}
        onAddSite={handleAddSite}
        onRemoveSite={handleRemoveSite}
        onToggleSite={handleToggleSite}
        compact={true}
        isDark={isDarkMode}
      />

      {/* Footer link to Dashboard */}
      <button
        onClick={handleOpenDashboard}
        className={`w-full py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
          isDarkMode
            ? 'bg-[#131B2A] hover:bg-[#1C273C] text-slate-300 border-[#1F293D]'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
        }`}
      >
        <span>Open Full Wellness Dashboard</span>
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
};
