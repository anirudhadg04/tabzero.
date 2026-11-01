import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle2, XCircle, Clock, Power } from 'lucide-react';
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
      onStart(0, true);
    }
  };

  // Compact View (Side Panel / Popup)
  if (compact) {
    return (
      <div
        className={`rounded-xl p-3.5 border transition-colors ${
          isDark
            ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
            : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
        }`}
      >
        {/* Header Status with On / Off button next to Set Disconnect Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isActive
                  ? 'bg-sage-500'
                  : isPaused
                  ? 'bg-amber-500'
                  : 'bg-stone-300 dark:bg-stone-600'
              }`}
            />
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {isActive ? 'Detox Active' : isPaused ? 'Detox Paused' : 'Set Disconnect Time'}
            </span>

            <button
              type="button"
              onClick={handleToggleOnOff}
              title={isActive ? 'Detox is Active. Click to Turn OFF' : 'Click to Turn ON'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-sage-600 hover:bg-sage-700 text-white'
                  : isDark
                  ? 'bg-[#121316] text-stone-300 hover:text-white border border-[#282A30]'
                  : 'bg-[#FAF9F6] text-stone-700 hover:text-stone-900 border border-[#E5E4DF]'
              }`}
            >
              <Power className="w-2.5 h-2.5" />
              <span>{isActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {isActive && (
            <span className="font-mono text-[10px] text-sage-600 dark:text-sage-400 font-medium">
              Shielding
            </span>
          )}
        </div>

        {/* Live Timer or Duration Controls */}
        {isActive || isPaused ? (
          <div className="space-y-3">
            <div className="text-center py-1">
              <div className="font-mono text-3xl font-light tracking-tight tabular-nums">
                {session?.isIndefinite ? 'Active' : formatTimeRemaining(timeValue)}
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {session?.isIndefinite ? 'Continuous Shield Active' : `${progressPercent}% completed`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {isActive ? (
                <button
                  onClick={onPause}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors"
              >
                End
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Presets */}
            <div className="grid grid-cols-5 gap-1">
              {PRESET_OPTIONS.map(p => {
                const isSelected = hours === p.h && minutes === p.m && seconds === p.s;
                return (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.h, p.m, p.s)}
                    className={`py-1 text-xs font-mono tabular-nums rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sage-50 border-sage-500 text-sage-800 dark:bg-sage-950/70 dark:border-sage-600 dark:text-sage-200 font-semibold'
                        : isDark
                        ? 'bg-[#121316] border-[#282A30] text-stone-300 hover:border-stone-600'
                        : 'bg-[#FAF9F6] border-[#E8E7E3] text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleStartTimed}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shadow-subtle"
            >
              <Play className="w-3.5 h-3.5" /> Start Detox Session
            </button>
          </div>
        )}
      </div>
    );
  }

  // Expanded View
  return (
    <div
      className={`rounded-xl p-6 border transition-colors ${
        isDark
          ? 'bg-[#191B1F] border-[#282A30] text-[#EDEDEB]'
          : 'bg-[#FFFFFF] border-[#E8E7E3] text-[#1A1C1E] shadow-subtle'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isActive
                ? 'bg-sage-500'
                : isPaused
                ? 'bg-amber-500'
                : 'bg-stone-300 dark:bg-stone-700'
            }`}
          />
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {isActive ? 'Digital Detox in Progress' : isPaused ? 'Session Paused' : 'Set Disconnect Time'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {isActive
                ? 'Restricted websites are currently deflected to nature.'
                : 'Choose your desired screen-free focus duration.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Continuous Shield:</span>
          <button
            type="button"
            onClick={handleToggleOnOff}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              isActive
                ? 'bg-sage-600 hover:bg-sage-700 text-white'
                : isDark
                ? 'bg-[#121316] text-stone-300 hover:text-white border border-[#282A30]'
                : 'bg-[#FAF9F6] text-stone-700 hover:text-stone-900 border border-[#E5E4DF]'
            }`}
          >
            <Power className="w-3 h-3" />
            <span>{isActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      <div className="py-6">
        {isActive || isPaused ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="font-mono text-5xl sm:text-6xl font-light tracking-tight tabular-nums">
              {session?.isIndefinite ? 'Active' : formatTimeRemaining(timeValue)}
            </div>

            {!session?.isIndefinite && (
              <div className="w-full max-w-md bg-stone-100 dark:bg-stone-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sage-600 h-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {isActive ? (
                <button
                  onClick={onPause}
                  className="flex items-center gap-2 px-5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex items-center gap-2 px-5 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4" /> Resume
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-4 py-2 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 max-w-xl mx-auto">
            {/* Presets */}
            <div className="flex items-center justify-center gap-2">
              {PRESET_OPTIONS.map(p => {
                const isSelected = hours === p.h && minutes === p.m && seconds === p.s;
                return (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.h, p.m, p.s)}
                    className={`px-4 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sage-50 border-sage-500 text-sage-800 dark:bg-sage-950/70 dark:border-sage-600 dark:text-sage-200 font-semibold'
                        : isDark
                        ? 'bg-[#121316] border-[#282A30] text-stone-300 hover:border-stone-600'
                        : 'bg-[#FAF9F6] border-[#E8E7E3] text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Hours & Minutes Stepper */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={hours}
                  onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-16 px-2.5 py-1.5 text-center font-mono tabular-nums text-sm rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121316] border-[#282A30] text-white focus:border-sage-500'
                      : 'bg-[#FAF9F6] border-[#E5E4DF] text-stone-900 focus:border-sage-600'
                  }`}
                />
                <span className="text-xs text-stone-400 font-medium">hr</span>
              </div>

              <span className="text-stone-300 dark:text-stone-700">:</span>

              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={e => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className={`w-16 px-2.5 py-1.5 text-center font-mono tabular-nums text-sm rounded-lg border outline-none ${
                    isDark
                      ? 'bg-[#121316] border-[#282A30] text-white focus:border-sage-500'
                      : 'bg-[#FAF9F6] border-[#E5E4DF] text-stone-900 focus:border-sage-600'
                  }`}
                />
                <span className="text-xs text-stone-400 font-medium">min</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleStartTimed}
                className="px-8 py-2.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-subtle"
              >
                Start Focused Detox
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
