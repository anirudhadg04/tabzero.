import React, { useEffect, useState } from 'react';
import { OfflineStorageSchema, RestrictedSite, Pledge, OfflineActivity, ActivityRecommendation } from '../types';
import { getStorageData } from '../storage';
import { sendExtensionMessage, subscribeToStorage } from '../services/bridge';
import { HeaderOverview } from '../components/HeaderOverview';
import { DetoxTimerCard } from '../components/DetoxTimerCard';
import { RestrictedSitesCard } from '../components/RestrictedSitesCard';
import { WeatherActivityCard } from '../components/WeatherActivityCard';
import { PledgesCard } from '../components/PledgesCard';
import { AchievementsCard } from '../components/AchievementsCard';
import { UsageSummaryCard } from '../components/UsageSummaryCard';
import { INITIAL_STORAGE } from '../storage/defaults';

export const Dashboard: React.FC = () => {
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
      // Auto refresh weather if null
      if (!d.weather) {
        sendExtensionMessage({ type: 'REFRESH_WEATHER' }).then(setData).catch(() => {});
      }
    });

    // Real-time synchronization
    const unsubscribe = subscribeToStorage((updated) => {
      setData(updated);
    });

    return () => unsubscribe();
  }, []);

  const themePref = data.themePreference || 'system';
  const isDarkMode = themePref === 'dark' ? true : themePref === 'light' ? false : systemIsDark;

  const handleUndo = async () => {
    const updated = await sendExtensionMessage({ type: 'TRIGGER_UNDO' });
    setData(updated);
  };

  const handleRedo = async () => {
    const updated = await sendExtensionMessage({ type: 'TRIGGER_REDO' });
    setData(updated);
  };

  const handleStartSession = async (totalSeconds: number) => {
    const updated = await sendExtensionMessage({
      type: 'SESSION_START',
      durationSeconds: totalSeconds,
      durationMinutes: Math.max(1, Math.round(totalSeconds / 60)),
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

  const handleSetDailyGoal = async (minutes: number) => {
    const updated = await sendExtensionMessage({
      type: 'SET_DAILY_GOAL',
      minutes,
    });
    setData(updated);
  };

  const handleCreatePledge = async (pledge: Omit<Pledge, 'id' | 'createdAt'>) => {
    const updated = await sendExtensionMessage({
      type: 'CREATE_PLEDGE',
      pledge,
    });
    setData(updated);
  };

  const handleAddActivity = async (activity: Omit<OfflineActivity, 'id' | 'createdAt'>) => {
    const updated = await sendExtensionMessage({
      type: 'ADD_ACTIVITY',
      activity,
    });
    setData(updated);
  };

  const handleAddWeatherActivity = (rec: ActivityRecommendation) => {
    handleAddActivity({
      title: rec.title,
      pillar: rec.pillar,
      durationMinutes: rec.durationMinutes,
      weatherRecommended: true,
      completed: false,
    });
  };

  const handleCompleteActivity = async (id: string) => {
    const updated = await sendExtensionMessage({
      type: 'COMPLETE_ACTIVITY',
      id,
    });
    setData(updated);
  };

  const handleRefreshWeather = async () => {
    const updated = await sendExtensionMessage({ type: 'REFRESH_WEATHER' });
    setData(updated);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-[#0B0F19]' : 'bg-offline-bg'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-subtle animate-pulse">
            t0.
          </div>
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Entering tabzero. sanctuary...
          </span>
        </div>
      </div>
    );
  }

  const { present } = data.history;

  return (
    <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-12 transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0B0F19] text-slate-100' : 'bg-offline-bg text-offline-text'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 1. Header & Overview Metrics (HealthTech MVP removed, exact 4 metrics retained) */}
        <HeaderOverview
          data={data}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSetDailyGoal={handleSetDailyGoal}
          isDashboard={true}
          isDark={isDarkMode}
        />

        {/* 2. Detox Focus Timer */}
        <DetoxTimerCard
          session={present.activeSession}
          onStart={handleStartSession}
          onPause={handlePauseSession}
          onResume={handleResumeSession}
          onComplete={handleCompleteSession}
          onCancel={handleCancelSession}
          compact={false}
          isDark={isDarkMode}
        />

        {/* 3. Open-Meteo Weather & 3 Pillars Recommendations (Integrated with Plan Activity) */}
        <WeatherActivityCard
          weather={data.weather}
          onRefreshWeather={handleRefreshWeather}
          onAddActivity={handleAddWeatherActivity}
          compact={false}
          isDark={isDarkMode}
        />

        {/* 4. Restricted Websites Shield Management */}
        <RestrictedSitesCard
          sites={present.restrictedSites}
          onAddSite={handleAddSite}
          onRemoveSite={handleRemoveSite}
          onToggleSite={handleToggleSite}
          compact={false}
          isDark={isDarkMode}
        />

        {/* 5. Pledges & Planned Activities */}
        <PledgesCard
          pledges={present.pledges}
          activities={present.activities}
          onCreatePledge={handleCreatePledge}
          onAddActivity={handleAddActivity}
          onCompleteActivity={handleCompleteActivity}
          compact={false}
          isDark={isDarkMode}
        />

        {/* 6. Milestones & Achievements */}
        <AchievementsCard achievements={data.achievements} />

        {/* 7. Website Usage Awareness */}
        <UsageSummaryCard
          usage={data.usage}
          blockedTotal={present.blockedAttemptsTotal}
        />

        {/* Footer */}
        <footer className={`pt-8 pb-12 text-center text-xs border-t transition-colors ${
          isDark ? 'border-[#1F293D] text-slate-500' : 'border-slate-200/80 text-slate-400'
        }`}>
          <p className="font-medium text-slate-400">tabzero. — Digital Detox Browser Extension</p>
          <p className="mt-1">
            Life happens beyond the screen. Move more. Scroll less. Live more.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            IEEE Computer Society Hackathon • Team CodeNova • Manifest V3 Compliant
          </p>
        </footer>
      </div>
    </div>
  );
};
