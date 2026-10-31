import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle2, XCircle, Sparkles, Shield, Clock, Power } from 'lucide-react';
import { DetoxSession } from '../types';
import { calculateRemainingSeconds, formatTimeRemaining } from '../services/session';

interface DetoxTimerCardProps {
  session: DetoxSession | null;
  onStart: (totalSeconds: number, isIndefinite?: boolean) => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
  compact?: boolean;
  isDark?: boolean;
}

const PRESET_OPTIONS = [
  { label: '5m', h: 0, m: 5, s: 0 },
  { label: '15m', h: 0, m: 15, s: 0 },
  { label: '30m', h: 0, m: 30, s: 0 },
  { label: '1h', h: 1, m: 0, s: 0 },
  { label: '2h', h: 2, m: 0, s: 0 },
];

export const DetoxTimerCard: React.FC<DetoxTimerCardProps> = ({
  session,
  onStart,
  onPause,
  onResume,
  onComplete,
  onCancel,
  compact = false,
  isDark = false,
}) => {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(30);
  const [seconds, setSeconds] = useState<number>(0);
  const [timeValue, setTimeValue] = useState<number>(() => calculateRemainingSeconds(session));

  useEffect(() => {
    setTimeValue(calculateRemainingSeconds(session));
    if (!session || session.status !== 'active') return;

    const interval = setInterval(() => {
      const current = calculateRemainingSeconds(session);
      setTimeValue(current);
      if (!session.isIndefinite && current <= 0) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, onComplete]);

  const isActive = session?.status === 'active';
  const isPaused = session?.status === 'paused';

  const totalSessionSeconds =
    session?.durationSeconds ||
    (session?.durationMinutes ? session.durationMinutes * 60 : hours * 3600 + minutes * 60 + seconds);

  const progressPercent =
    totalSessionSeconds > 0
      ? Math.min(100, Math.max(0, Math.round(((totalSessionSeconds - timeValue) / totalSessionSeconds) * 100)))
      : 100;

  const handleStartTimed = () => {
    const totalSecs = Math.max(1, hours * 3600 + minutes * 60 + seconds);
    onStart(totalSecs);
  };

  const applyPreset = (h: number, m: number, s: number) => {
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  const selectedTotalSeconds = hours * 3600 + minutes * 60 + seconds;

  const handleToggleOnOff = () => {
    if (isActive) {
      onCancel();
    } else {
      // Permanent Always-On mode: stays ON indefinitely until manually toggled OFF
      onStart(0, true);
    }
  };

  // Compact View (Side Panel / Toolbar Popup)
  if (compact) {
    return (
      <div
        className={`rounded-2xl p-4 border transition-colors duration-300 ${
          isDark
            ? 'bg-[#131B2A] border-[#1F293D] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
            : 'bg-white border-slate-200/80 text-slate-900 shadow-subtle'
        }`}
      >
        {/* Header Status with On / Off button next to Set Disconnect Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isActive
                  ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                  : isPaused
                  ? 'bg-amber-400'
                  : 'bg-slate-300'
              }`}
            />
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {isActive ? 'Detox Active' : isPaused ? 'Detox Paused' : 'Set Disconnect Time'}
            </span>

            {/* On / Off Button directly next to Set Disconnect Time */}
            <button
              type="button"
              onClick={handleToggleOnOff}
              title={isActive ? 'Detox is Active. Click to Turn OFF' : 'Click to Turn ON'}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Power className="w-2.5 h-2.5" />
              <span>{isActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {session && !session.isIndefinite && (
            <span className="text-[11px] font-medium text-slate-400">
              {progressPercent}%
            </span>
          )}
        </div>

        {session ? (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span
                className={`text-3xl font-light tracking-tight font-mono ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {formatTimeRemaining(timeValue)}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {session.isIndefinite ? 'time elapsed' : 'remaining'}
              </span>
            </div>

            {!session.isIndefinite && (
              <div
                className={`w-full rounded-full h-1.5 mb-4 overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <div
                  className="bg-indigo-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              {isActive ? (
                <button
                  onClick={onPause}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume
                </button>
              )}

              <button
                onClick={onComplete}
                title="Finish Session (Restore Access)"
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                onClick={onCancel}
                title="Stop Session (Restore Access)"
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isDark
                    ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-500'
                }`}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Hours / Minutes / Seconds Selector */}
            <div
              className={`flex items-center justify-center gap-2 mb-3 p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-11 text-center font-mono font-medium text-sm rounded-lg py-1 outline-none border focus:border-indigo-400 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Hours</span>
              </div>
              <span className="text-slate-400 font-mono font-bold text-sm">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-11 text-center font-mono font-medium text-sm rounded-lg py-1 outline-none border focus:border-indigo-400 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Mins</span>
              </div>
              <span className="text-slate-400 font-mono font-bold text-sm">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={e => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-11 text-center font-mono font-medium text-sm rounded-lg py-1 outline-none border focus:border-indigo-400 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Secs</span>
              </div>
            </div>

            {/* Quick Preset Pills */}
            <div className="flex items-center justify-between gap-1 mb-3">
              {PRESET_OPTIONS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.h, p.m, p.s)}
                  className={`flex-1 py-1 text-[11px] font-medium rounded-lg transition-all border cursor-pointer ${
                    hours === p.h && minutes === p.m && seconds === p.s
                      ? isDark
                        ? 'bg-slate-100 text-slate-900 border-white'
                        : 'bg-slate-900 text-white border-slate-900'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartTimed}
              disabled={selectedTotalSeconds <= 0}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-xl transition-all shadow-subtle active:scale-[0.99] cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-slate-100 text-slate-900'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Start Detox ({formatTimeRemaining(selectedTotalSeconds)})
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full Dashboard Display
  return (
    <div
      className={`rounded-2xl p-6 sm:p-8 border relative overflow-hidden transition-colors ${
        isDark
          ? 'bg-[#131B2A] border-[#1F293D] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
          : 'bg-white border-slate-200/80 text-slate-900 shadow-subtle'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isActive
                  ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                  : isPaused
                  ? 'bg-amber-400'
                  : 'bg-slate-300'
              }`}
            />
            <h2 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isActive ? 'Digital Detox in Progress' : isPaused ? 'Detox Paused' : 'Begin Digital Detox'}
            </h2>

            {/* On / Off Button */}
            <button
              type="button"
              onClick={handleToggleOnOff}
              title={isActive ? 'Detox is Active. Click to Turn OFF' : 'Click to Turn ON'}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ml-1 ${
                isActive
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            {isActive
              ? 'Distracting websites are locked down. Step away from your screen and embrace the real world.'
              : 'Choose your desired disconnect window to shield distracting sites and reclaim presence.'}
          </p>
        </div>

        {session ? (
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <span className={`text-4xl sm:text-5xl font-light font-mono tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {formatTimeRemaining(timeValue)}
              </span>
              <p className="text-xs text-slate-400 mt-1">
                {session.isIndefinite ? 'Continuous mindful time elapsed' : `${progressPercent}% session elapsed`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isActive ? (
                <button
                  onClick={onPause}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume
                </button>
              )}

              <button
                onClick={onComplete}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
              </button>

              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Hours / Minutes / Seconds input */}
            <div className={`flex items-center gap-2 p-2 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-12 text-center font-mono font-medium text-sm rounded-lg py-1 border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-400 uppercase mt-0.5">Hours</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-12 text-center font-mono font-medium text-sm rounded-lg py-1 border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-400 uppercase mt-0.5">Mins</span>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={e => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-12 text-center font-mono font-medium text-sm rounded-lg py-1 border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-400 uppercase mt-0.5">Secs</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {PRESET_OPTIONS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.h, p.m, p.s)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl transition-all border cursor-pointer ${
                    hours === p.h && minutes === p.m && seconds === p.s
                      ? isDark
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-slate-900 text-white border-slate-900'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/80'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartTimed}
              disabled={selectedTotalSeconds <= 0}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold rounded-xl transition-all shadow-subtle cursor-pointer ${
                isDark
                  ? 'bg-white hover:bg-slate-100 text-slate-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Start ({formatTimeRemaining(selectedTotalSeconds)})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
