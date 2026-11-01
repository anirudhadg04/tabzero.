import React, { useState } from 'react';
import { HistoryState, OfflineStorageSchema } from '../types';
import { HistoryControls } from './HistoryControls';
import { Clock, Shield, Sparkles, Check, Edit3 } from 'lucide-react';
import { formatDuration } from '../services/tracker';

interface HeaderOverviewProps {
  data: OfflineStorageSchema;
  onUndo: () => void;
  onRedo: () => void;
  onSetDailyGoal: (minutes: number) => void;
  onOpenDashboard?: () => void;
  isDashboard?: boolean;
  isDark?: boolean;
}

export const HeaderOverview: React.FC<HeaderOverviewProps> = ({
  data,
  onUndo,
  onRedo,
  onSetDailyGoal,
  onOpenDashboard,
  isDashboard = true,
  isDark = false,
}) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(data.history.present.dailyGoalMinutes.toString());

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  // Calculate today offline minutes
  const sessionMinutes = data.history.present.completedSessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const activityMinutes = data.history.present.activities
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.durationMinutes, 0);

  const totalOfflineMins = sessionMinutes + activityMinutes;
  const goalMins = data.history.present.dailyGoalMinutes;
  const progressPct = Math.min(100, Math.round((totalOfflineMins / goalMins) * 100));

  // Browsing total
  const browsingSeconds = Object.values(data.usage).reduce((sum, u) => sum + u.timeSpentSeconds, 0);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(goalInput, 10);
    if (parsed > 0) {
      onSetDailyGoal(parsed);
    }
    setEditingGoal(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <header
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b transition-colors ${
          isDark ? 'border-[#282A30]' : 'border-[#E8E7E3]'
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src="icons/icon48.png"
            alt="tabzero logo"
            className="w-8 h-8 rounded-full object-cover shadow-subtle ring-1 ring-black/5 dark:ring-white/10"
          />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              tabzero<span className="text-sage-600 dark:text-sage-400">.</span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Life happens beyond the screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HistoryControls
            history={data.history}
            onUndo={onUndo}
            onRedo={onRedo}
            compact={!isDashboard}
            isDark={isDark}
          />

          {!isDashboard && onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 transition-colors shadow-subtle cursor-pointer"
            >
              Open Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Unified Metric Bar */}
      <div
        className={`rounded-xl border transition-colors grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30] divide-[#282A30] text-[#EDEDEB]'
            : 'bg-[#FFFFFF] border-[#E8E7E3] divide-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
        }`}
      >
        {/* Metric 1: Offline Time */}
        <div className="p-4 sm:p-5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
            Offline Mindspace
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-light">
              {totalOfflineMins}
            </span>
            <span className="text-xs text-stone-400">mins today</span>
          </div>
          <p className="font-mono text-[11px] tabular-nums text-stone-400 mt-1">
            Goal: {goalMins}m · <span className="text-sage-600 dark:text-sage-400 font-medium">{progressPct}%</span>
          </p>
        </div>

        {/* Metric 2: Browsing Time */}
        <div className="p-4 sm:p-5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
            Active Browsing
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-light">
              {formatDuration(browsingSeconds)}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">{todayStr}</p>
        </div>

        {/* Metric 3: Deflections */}
        <div className="p-4 sm:p-5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
            Deflections
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-light">
              {data.history.present.blockedAttemptsTotal}
            </span>
            <span className="text-xs text-stone-400">distractions stopped</span>
          </div>
          <p className="text-[11px] text-sage-600 dark:text-sage-400 mt-1">Shield active</p>
        </div>

        {/* Metric 4: Daily Goal */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider">Daily Goal</span>
            <button
              onClick={() => setEditingGoal(!editingGoal)}
              className="p-0.5 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
              title="Edit goal"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>

          {editingGoal ? (
            <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5 mt-1">
              <input
                type="number"
                min="10"
                max="480"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                className="w-16 px-1.5 py-0.5 font-mono text-xs tabular-nums rounded border outline-none bg-stone-50 dark:bg-stone-800 border-stone-300 dark:border-stone-700"
                autoFocus
              />
              <button
                type="submit"
                className="p-1 rounded bg-sage-600 text-white cursor-pointer"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-mono tabular-nums font-light">
                  {goalMins}
                </span>
                <span className="text-xs text-stone-400">mins/day</span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1 mt-2.5 overflow-hidden">
                <div
                  className="bg-sage-600 h-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
