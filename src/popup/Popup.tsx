import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    getStorageData().then(d => {
      setData(d);
      setLoading(false);
    });

    const unsubscribe = subscribeToStorage((updated) => {
      setData(updated);
    });

    return () => unsubscribe();
  }, []);

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
      <div className="w-[380px] h-[450px] bg-offline-bg flex items-center justify-center p-6 text-slate-400 text-xs">
        Loading tabzero...
      </div>
    );
  }

  const { present } = data.history;

  // Calculate offline minutes today
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
    <div className="w-[380px] max-h-[580px] overflow-y-auto bg-offline-bg text-offline-text p-4 space-y-3.5 select-none font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] tracking-tight">
            t0.
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-tight text-slate-900">tabzero.</h2>
            <p className="text-[10px] text-slate-400">Digital Detox</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HistoryControls
            history={data.history}
            onUndo={handleUndo}
            onRedo={handleRedo}
            compact={true}
          />
          <button
            onClick={handleOpenDashboard}
            title="Open Full Dashboard in Tab"
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 shadow-subtle transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Daily Progress Ribbon */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-slate-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Today's Offline Space
          </span>
          <span className="font-semibold text-slate-900">
            {totalOfflineMins} / {goalMins}m
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Detox Timer Card (Compact) */}
      <DetoxTimerCard
        session={present.activeSession}
        onStart={handleStartSession}
        onPause={handlePauseSession}
        onResume={handleResumeSession}
        onComplete={handleCompleteSession}
        onCancel={handleCancelSession}
        compact={true}
      />

      {/* Weather & Offline Activity Suggestion (Compact) */}
      <WeatherActivityCard
        weather={data.weather}
        onRefreshWeather={handleRefreshWeather}
        onAddActivity={handleAddWeatherActivity}
        compact={true}
      />

      {/* Website Restriction List (Compact) */}
      <RestrictedSitesCard
        sites={present.restrictedSites}
        onAddSite={handleAddSite}
        onRemoveSite={handleRemoveSite}
        onToggleSite={handleToggleSite}
        compact={true}
      />

      {/* Footer link to Dashboard */}
      <button
        onClick={handleOpenDashboard}
        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>Open Full Wellness Dashboard</span>
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
};
