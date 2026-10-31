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
    <div className="space-y-6">
      {/* Top Bar */}
      <header className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-[#1F293D]' : 'border-slate-200/80'
      }`}>
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs tracking-wider shadow-subtle ${
              isDark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
            }`}>
              t0.
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                tabzero.
              </h1>
              <p className="text-xs text-slate-400">
                Move more. Scroll less. Live more.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <HistoryControls
            history={data.history}
            onUndo={onUndo}
            onRedo={onRedo}
            compact={!isDashboard}
          />

          {!isDashboard && onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all shadow-subtle cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              Open Dashboard
            </button>
          )}
        </div>
      </header>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Offline Time */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 shadow-subtle'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Offline Mindspace</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-light font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {totalOfflineMins}
            </span>
            <span className="text-xs text-slate-400 font-medium">mins today</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Goal: {goalMins}m</span>
            <span className="font-semibold text-indigo-400">{progressPct}%</span>
          </div>
        </div>

        {/* Metric 2: Browsing Time */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 shadow-subtle'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Browsing</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-light font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {formatDuration(browsingSeconds)}
            </span>
            <span className="text-xs text-slate-400 font-medium">tracked</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 truncate">
            {todayStr}
          </p>
        </div>

        {/* Metric 3: Distractions Deflected */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 shadow-subtle'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Deflections</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-light font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {data.history.present.blockedAttemptsTotal}
            </span>
            <span className="text-xs text-slate-400 font-medium">distractions stopped</span>
          </div>
          <p className="text-[11px] text-emerald-500 font-medium mt-2.5">
            Shield protection active
          </p>
        </div>

        {/* Metric 4: Daily Goal Setting */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 shadow-subtle'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Daily Goal</span>
            <button
              onClick={() => setEditingGoal(!editingGoal)}
              className="text-slate-400 hover:text-slate-300 p-0.5 rounded cursor-pointer"
              title="Edit daily goal"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {editingGoal ? (
            <form onSubmit={handleSaveGoal} className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="600"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                className={`w-16 px-2 py-1 text-sm rounded-lg outline-none border ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                autoFocus
              />
              <button
                type="submit"
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-light font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {goalMins}
              </span>
              <span className="text-xs text-slate-400 font-medium">mins/day</span>
            </div>
          )}

          <div className={`w-full rounded-full h-1.5 mt-3 overflow-hidden ${
            isDark ? 'bg-slate-800' : 'bg-slate-100'
          }`}>
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
