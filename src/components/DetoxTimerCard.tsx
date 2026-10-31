import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle2, XCircle, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { DetoxSession } from '../types';
import { calculateRemainingSeconds, formatTimeRemaining } from '../services/session';

interface DetoxTimerCardProps {
  session: DetoxSession | null;
  onStart: (totalSeconds: number) => void;
  onPause: () => void;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
  compact?: boolean;
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
}) => {
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(30);
  const [seconds, setSeconds] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => calculateRemainingSeconds(session));

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(session));
    if (!session || session.status !== 'active') return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(session);
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, onComplete]);

  const isActive = session?.status === 'active';
  const isPaused = session?.status === 'paused';
  const totalSessionSeconds = session?.durationSeconds || (session?.durationMinutes ? session.durationMinutes * 60 : (hours * 3600 + minutes * 60 + seconds));
  
  const progressPercent = totalSessionSeconds > 0
    ? Math.min(100, Math.max(0, Math.round(((totalSessionSeconds - remainingSeconds) / totalSessionSeconds) * 100)))
    : 0;

  const handleStart = () => {
    const totalSecs = Math.max(1, hours * 3600 + minutes * 60 + seconds);
    onStart(totalSecs);
  };

  const applyPreset = (h: number, m: number, s: number) => {
    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  const selectedTotalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (compact) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-300'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isActive ? 'Detox Active' : isPaused ? 'Detox Paused' : 'Set Disconnect Time'}
            </span>
          </div>
          {session && (
            <span className="text-xs text-slate-400 font-medium">
              {formatTimeRemaining(session.durationSeconds || session.durationMinutes * 60)}
            </span>
          )}
        </div>

        {session ? (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-light tracking-tight font-mono text-slate-900">
                {formatTimeRemaining(remainingSeconds)}
              </span>
              <span className="text-xs text-slate-400 font-medium">{progressPercent}% elapsed</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden">
              <div
                className="bg-indigo-400 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              {isActive ? (
                <button
                  onClick={onPause}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-xl transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume
                </button>
              )}
              <button
                onClick={onComplete}
                title="Finish Session"
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                title="Cancel Session"
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Hours / Minutes / Seconds Selector */}
            <div className="flex items-center justify-center gap-2 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-11 text-center font-mono font-medium text-sm bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-indigo-400"
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
                  className="w-11 text-center font-mono font-medium text-sm bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-indigo-400"
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
                  className="w-11 text-center font-mono font-medium text-sm bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-indigo-400"
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
                  className={`flex-1 py-1 text-[11px] font-medium rounded-lg transition-all ${
                    hours === p.h && minutes === p.m && seconds === p.s
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={selectedTotalSeconds <= 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl transition-all shadow-subtle active:scale-[0.99] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Start Detox ({formatTimeRemaining(selectedTotalSeconds)})
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full Dashboard Display
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-300'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isActive ? 'Session in Progress' : isPaused ? 'Detox Paused' : 'Custom Detox Focus'}
            </span>
          </div>
          <h2 className="text-2xl font-light text-slate-900 tracking-tight">
            {isActive
              ? 'Distraction Shield Active'
              : isPaused
              ? 'Focus on Pause'
              : 'Choose Your Screen-Free Duration'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            {isActive
              ? 'Restricted websites and their subdomains are currently blocked.'
              : 'Decide exactly how long you want to disconnect — hours, minutes, and seconds.'}
          </p>
        </div>

        {/* Big Live Countdown / Chosen Timer */}
        <div className="flex flex-col items-center md:items-end">
          <div className="font-mono text-5xl sm:text-6xl font-light tracking-tight text-slate-900">
            {session ? formatTimeRemaining(remainingSeconds) : formatTimeRemaining(selectedTotalSeconds)}
          </div>
          <span className="text-xs text-slate-400 mt-1 font-medium">
            {session ? `${progressPercent}% complete` : 'Selected Disconnect Time'}
          </span>
        </div>
      </div>

      {session && (
        <div className="mt-6">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-400 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Inputs & Actions */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-5">
        {!session ? (
          <>
            {/* Hours / Minutes / Seconds Interactive Inputs */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-slate-400 mr-1">Duration:</span>
              
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
                {/* Hours */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 text-center font-mono font-semibold text-sm bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-indigo-400 text-slate-800"
                  />
                  <span className="text-xs text-slate-500 font-medium">hr</span>
                </div>

                <span className="text-slate-400 font-bold">:</span>

                {/* Minutes */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-12 text-center font-mono font-semibold text-sm bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-indigo-400 text-slate-800"
                  />
                  <span className="text-xs text-slate-500 font-medium">min</span>
                </div>

                <span className="text-slate-400 font-bold">:</span>

                {/* Seconds */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={e => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-12 text-center font-mono font-semibold text-sm bg-white border border-slate-200 rounded-lg py-1 outline-none focus:border-indigo-400 text-slate-800"
                  />
                  <span className="text-xs text-slate-500 font-medium">sec</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                {PRESET_OPTIONS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.h, p.m, p.s)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      hours === p.h && minutes === p.m && seconds === p.s
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={selectedTotalSeconds <= 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-xl transition-all shadow-subtle active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              Start Detox ({formatTimeRemaining(selectedTotalSeconds)})
            </button>
          </>
        ) : (
          <div className="w-full flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isActive ? (
                <button
                  onClick={onPause}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause Session
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Resume Session
                </button>
              )}

              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-xl transition-all cursor-pointer border border-emerald-200/60"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
              </button>
            </div>

            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
