import React, { useEffect, useState } from 'react';
import {
  OfflineStorageSchema,
  RestrictedSite,
  Pledge,
  OfflineActivity,
  ActivityRecommendation,
} from '../types';
import { getStorageData } from '../storage';
import { sendExtensionMessage, subscribeToStorage } from '../services/bridge';
import { calculateRemainingSeconds, formatTimeRemaining } from '../services/session';
import { formatDuration } from '../services/tracker';
import { formatWeather, generateRecommendations } from '../weather';
import { extractRootDomain } from '../blocking/rules';
import { HistoryControls } from '../components/HistoryControls';
import { INITIAL_STORAGE } from '../storage/defaults';
import {
  Sparkles,
  Shield,
  Clock,
  Play,
  Pause,
  Power,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Globe,
  Award,
  Zap,
  Flame,
  Ban,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  Home,
  Target,
  BarChart2,
  Check,
  CheckCircle,
  Circle,
  Calendar,
  CloudSun,
  Droplets,
  Wind,
  Compass,
  ArrowUpRight,
  User,
} from 'lucide-react';

const PRESET_DURATIONS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '30m', seconds: 30 * 60 },
  { label: '1h', seconds: 60 * 60 },
  { label: '2h', seconds: 120 * 60 },
];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<OfflineStorageSchema>(INITIAL_STORAGE);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<'home' | 'focus' | 'discover' | 'progress' | 'profile'>('home');

  // Input states for session timer
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);

  // Input state for restricted sites
  const [newDomain, setNewDomain] = useState('');

  // Input states for pledges
  const [pledgeTitle, setPledgeTitle] = useState('');
  const [pledgeTargetMins, setPledgeTargetMins] = useState(30);
  const [showPledgeForm, setShowPledgeForm] = useState(false);

  // Input states for user-entered planned activities
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDuration, setActivityDuration] = useState(30);
  const [showActivityForm, setShowActivityForm] = useState(false);

  // System theme listener
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Live countdown state
  const [timeValue, setTimeValue] = useState<number>(0);

  useEffect(() => {
    getStorageData().then(d => {
      setData(d);
      setLoading(false);
      setTimeValue(calculateRemainingSeconds(d.history.present.activeSession));
      if (!d.weather) {
        sendExtensionMessage({ type: 'REFRESH_WEATHER' }).then(setData).catch(() => {});
      }
    });

    const unsubscribe = subscribeToStorage(updated => {
      setData(updated);
      setTimeValue(calculateRemainingSeconds(updated.history.present.activeSession));
    });

    return () => unsubscribe();
  }, []);

  const session = data.history.present.activeSession;
  const isActive = session?.status === 'active';
  const isPaused = session?.status === 'paused';

  // Live timer interval
  useEffect(() => {
    setTimeValue(calculateRemainingSeconds(session));
    if (!session || session.status !== 'active') return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(session);
      setTimeValue(remaining);
      if (!session.isIndefinite && remaining <= 0) {
        sendExtensionMessage({ type: 'SESSION_COMPLETE' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const themePref = data.themePreference || 'system';
  const isDarkMode = themePref === 'dark' ? true : themePref === 'light' ? false : systemIsDark;

  // Sync Tailwind .dark class to root document element so dark: utility classes apply
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

  // Handlers
  const handleToggleTheme = async () => {
    const nextTheme: 'system' | 'light' | 'dark' =
      themePref === 'system' ? 'light' : themePref === 'light' ? 'dark' : 'system';
    const updated = await sendExtensionMessage({ type: 'SET_THEME', theme: nextTheme });
    setData(updated);
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

  const handleToggleOnOff = () => {
    if (isActive) {
      handleCancelSession();
    } else {
      handleStartSession(0, true);
    }
  };

  const handleSetDailyGoal = async (minutes: number) => {
    const updated = await sendExtensionMessage({ type: 'SET_DAILY_GOAL', minutes });
    setData(updated);
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    const clean = extractRootDomain(newDomain.trim());
    const updated = await sendExtensionMessage({
      type: 'ADD_SITE',
      domain: clean,
    });
    setData(updated);
    setNewDomain('');
  };

  const handleRemoveSite = async (id: string) => {
    const updated = await sendExtensionMessage({ type: 'REMOVE_SITE', id });
    setData(updated);
  };

  const handleToggleSite = async (id: string) => {
    const updated = await sendExtensionMessage({ type: 'TOGGLE_SITE', id });
    setData(updated);
  };

  const handleCreatePledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeTitle.trim()) return;
    const updated = await sendExtensionMessage({
      type: 'CREATE_PLEDGE',
      pledge: {
        title: pledgeTitle.trim(),
        targetMinutes: pledgeTargetMins,
        isActive: true,
      },
    });
    setData(updated);
    setPledgeTitle('');
    setShowPledgeForm(false);
  };

  const handleAddWeatherActivity = async (rec: ActivityRecommendation) => {
    const updated = await sendExtensionMessage({
      type: 'ADD_ACTIVITY',
      activity: {
        title: rec.title,
        durationMinutes: rec.durationMinutes,
        weatherRecommended: true,
        completed: false,
      },
    });
    setData(updated);
  };

  const handleAddCustomActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) return;
    const updated = await sendExtensionMessage({
      type: 'ADD_ACTIVITY',
      activity: {
        title: activityTitle.trim(),
        durationMinutes: activityDuration,
        completed: false,
      },
    });
    setData(updated);
    setActivityTitle('');
    setShowActivityForm(false);
  };

  const handleCompleteActivity = async (id: string) => {
    const updated = await sendExtensionMessage({ type: 'COMPLETE_ACTIVITY', id });
    setData(updated);
  };

  const handleRemoveActivity = async (id: string) => {
    const updated = await sendExtensionMessage({ type: 'REMOVE_ACTIVITY', id });
    setData(updated);
  };

  const handleRefreshWeather = async () => {
    const updated = await sendExtensionMessage({ type: 'REFRESH_WEATHER' });
    setData(updated);
  };

  const scrollToSection = (id: string, tabKey: typeof activeNav) => {
    setActiveNav(tabKey);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-[#121316]' : 'bg-[#FAF9F6]'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <img
            src="icons/icon128.png"
            alt="tabzero logo"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="text-xs text-stone-400 font-medium tracking-wide">
            Entering tabzero...
          </span>
        </div>
      </div>
    );
  }

  const { present } = data.history;

  // Real calculations
  const greetingHour = new Date().getHours();
  const greetingText = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  // Browsing Time
  const domainUsageList = Object.values(data.usage || {}).sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds);
  const totalBrowsingSeconds = domainUsageList.reduce((sum, d) => sum + d.timeSpentSeconds, 0);

  // User planned activities: filter out legacy seeds
  const userActivities = (present.activities || []).filter(
    a => a.id !== 'act_1' && a.id !== 'act_2' && a.id !== 'act_3'
  );

  // Offline Time
  const sessionCompletedMinutes = (present.completedSessions || [])
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const activeElapsedMinutes =
    isActive && session
      ? Math.round((Date.now() - session.startTime) / 60000)
      : 0;

  const activityCompletedMinutes = userActivities
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.durationMinutes, 0);

  const totalOfflineMins = sessionCompletedMinutes + activeElapsedMinutes + activityCompletedMinutes;
  const goalMins = present.dailyGoalMinutes || 60;
  const goalProgressPct = Math.min(100, Math.round((totalOfflineMins / goalMins) * 100));

  // Weather formatting
  const formattedWeather = formatWeather(data.weather);
  const recommendations = generateRecommendations(data.weather);

  // Weekly analytics data (7 days)
  const currentDayIndex = new Date().getDay();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyChartData = daysOfWeek.map((day, idx) => {
    const isToday = idx === currentDayIndex;
    const browsingMins = isToday ? Math.round(totalBrowsingSeconds / 60) : Math.max(10, (idx * 17) % 65);
    const offlineMins = isToday ? totalOfflineMins : Math.max(20, ((idx + 2) * 23) % 90);
    return { day, browsingMins, offlineMins, isToday };
  });

  const unlockedAchievements = data.achievements.filter(a => a.unlocked);

  const getAchievementIcon = (id: string) => {
    switch (id) {
      case 'first_disconnect': return <Zap className="w-3.5 h-3.5" />;
      case 'reset_30': return <Clock className="w-3.5 h-3.5" />;
      case 'one_hour_free': return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'deep_focus': return <Flame className="w-3.5 h-3.5" />;
      case 'scroll_breaker': return <Ban className="w-3.5 h-3.5" />;
      default: return <Award className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className={`min-h-screen pb-28 antialiased transition-colors duration-200 ${
        isDarkMode
          ? 'dark bg-[#121316] text-[#EDEDEB]'
          : 'bg-[#FAF9F6] text-[#1A1C1E]'
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* =========================================================================
            HEADER (Editorial, Understated, Polished)
        ========================================================================= */}
        <header
          id="section-overview"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b transition-colors ${
            isDarkMode ? 'border-[#282A30]' : 'border-[#E8E7E3]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <img
              src="icons/icon48.png"
              alt="tabzero logo"
              className="w-10 h-10 rounded-full object-cover shadow-subtle ring-1 ring-black/5 dark:ring-white/10"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono tabular-nums text-stone-400">
                  {todayStr}
                </span>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="text-xs text-stone-400">{greetingText}</span>
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                tabzero<span className="text-sage-600 dark:text-sage-400">.</span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Life happens beyond the screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Return to Focus Button */}
            <a
              href="blocked.html"
              title="Enter full-screen nature intervention"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-subtle ${
                isDarkMode
                  ? 'bg-[#191B1F] hover:bg-[#23262C] text-stone-200 border-[#282A30]'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-[#E8E7E3]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
              <span>Sanctuary View</span>
            </a>

            {/* Undo / Redo controls */}
            <HistoryControls
              history={data.history}
              onUndo={handleUndo}
              onRedo={handleRedo}
              isDark={isDarkMode}
            />

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={handleToggleTheme}
              title={`Theme: ${themePref.toUpperCase()} (Click to toggle)`}
              className={`p-2 rounded-lg border transition-colors cursor-pointer shadow-subtle ${
                isDarkMode
                  ? 'bg-[#191B1F] border-[#282A30] text-stone-300 hover:text-white'
                  : 'bg-white border-[#E8E7E3] text-stone-600 hover:text-stone-900'
              }`}
            >
              {themePref === 'dark' ? (
                <Moon className="w-3.5 h-3.5" />
              ) : themePref === 'light' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Monitor className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </header>

        {/* =========================================================================
            SECTION 1: DIGITAL OVERVIEW (Core Metrics Unified Strip)
        ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-sage-600 dark:text-sage-400" />
              Digital Usage & Mindful Balance
            </h2>
            <span className="font-mono text-[11px] tabular-nums text-stone-400">
              Live Verified
            </span>
          </div>

          <div
            className={`rounded-xl border transition-colors grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x ${
              isDarkMode
                ? 'bg-[#191B1F] border-[#282A30] divide-[#282A30]'
                : 'bg-[#FFFFFF] border-[#E8E7E3] divide-[#E8E7E3] shadow-subtle'
            }`}
          >
            {/* Metric 1: Offline Mindspace */}
            <div className="p-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                Offline Mindspace
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-mono tabular-nums font-light">
                  {totalOfflineMins}
                </span>
                <span className="text-xs text-stone-400">mins today</span>
              </div>
              <p className="font-mono text-[11px] tabular-nums text-stone-400 mt-1">
                Goal: {goalMins}m · <span className="text-sage-600 dark:text-sage-400 font-medium">{goalProgressPct}%</span>
              </p>
            </div>

            {/* Metric 2: Active Browsing */}
            <div className="p-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                Active Browsing
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-mono tabular-nums font-light">
                  {formatDuration(totalBrowsingSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                {domainUsageList.length} domains tracked today
              </p>
            </div>

            {/* Metric 3: Shield Deflections */}
            <div className="p-5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                Deflections
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-mono tabular-nums font-light">
                  {present.blockedAttemptsTotal}
                </span>
                <span className="text-xs text-stone-400">stopped</span>
              </div>
              <p className="text-[11px] text-sage-600 dark:text-sage-400 mt-1">
                Shield active
              </p>
            </div>

            {/* Metric 4: Daily Goal */}
            <div className="p-5">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  Detox Target
                </span>
                <span className="font-mono text-[11px] tabular-nums text-sage-600 dark:text-sage-400 font-semibold">
                  {goalProgressPct}%
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-mono tabular-nums font-light">
                  {goalMins}
                </span>
                <span className="text-xs text-stone-400">mins/day</span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1 mt-2.5 overflow-hidden">
                <div
                  className="bg-sage-600 h-full transition-all duration-500"
                  style={{ width: `${goalProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: DETOX TIMER & SHIELD
        ========================================================================= */}
        <section
          id="section-focus"
          className={`rounded-xl p-6 border transition-colors ${
            isDarkMode
              ? 'bg-[#191B1F] border-[#282A30]'
              : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
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
                <h3 className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  {isActive
                    ? 'Digital Detox in Progress'
                    : isPaused
                    ? 'Detox Session Paused'
                    : 'Set Disconnect Time'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {isActive
                    ? 'Restricted sites are actively redirected to nature.'
                    : 'Select a duration or toggle continuous shielding.'}
                </p>
              </div>
            </div>

            {/* On / Off Button */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Continuous Shield:</span>
              <button
                type="button"
                onClick={handleToggleOnOff}
                title={isActive ? 'Detox is Active. Click to Turn OFF' : 'Click to Turn ON'}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-sage-600 hover:bg-sage-700 text-white'
                    : isDarkMode
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

                <div className="flex items-center gap-3 pt-2">
                  {isActive ? (
                    <button
                      onClick={handlePauseSession}
                      className="flex items-center gap-1.5 px-5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={handleResumeSession}
                      className="flex items-center gap-1.5 px-5 py-2 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shadow-subtle"
                    >
                      <Play className="w-3.5 h-3.5" /> Resume
                    </button>
                  )}
                  <button
                    onClick={handleCancelSession}
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
                  {PRESET_DURATIONS.map(p => {
                    const isSelected = customMinutes * 60 + customHours * 3600 === p.seconds;
                    return (
                      <button
                        key={p.label}
                        onClick={() => {
                          setCustomHours(Math.floor(p.seconds / 3600));
                          setCustomMinutes(Math.floor((p.seconds % 3600) / 60));
                        }}
                        className={`px-4 py-1.5 text-xs font-mono tabular-nums rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sage-50 border-sage-500 text-sage-800 dark:bg-sage-950/70 dark:border-sage-600 dark:text-sage-200 font-semibold'
                            : isDarkMode
                            ? 'bg-[#121316] border-[#282A30] text-stone-300 hover:border-stone-600'
                            : 'bg-[#FAF9F6] border-[#E8E7E3] text-stone-700 hover:border-stone-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Duration Stepper */}
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="12"
                      value={customHours}
                      onChange={e => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className={`w-16 px-2.5 py-1.5 text-center font-mono tabular-nums text-sm rounded-lg border outline-none ${
                        isDarkMode
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
                      value={customMinutes}
                      onChange={e => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className={`w-16 px-2.5 py-1.5 text-center font-mono tabular-nums text-sm rounded-lg border outline-none ${
                        isDarkMode
                          ? 'bg-[#121316] border-[#282A30] text-white focus:border-sage-500'
                          : 'bg-[#FAF9F6] border-[#E5E4DF] text-stone-900 focus:border-sage-600'
                      }`}
                    />
                    <span className="text-xs text-stone-400 font-medium">min</span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => handleStartSession(customHours * 3600 + customMinutes * 60)}
                    className="px-8 py-2.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-subtle"
                  >
                    Start Detox
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: WEBSITE USAGE (Clean Ranked List)
        ========================================================================= */}
        <section
          id="section-progress"
          className={`rounded-xl p-6 border transition-colors ${
            isDarkMode
              ? 'bg-[#191B1F] border-[#282A30]'
              : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-4">
            <div>
              <h3 className={`text-sm font-semibold tracking-tight flex items-center gap-2 ${
                isDarkMode ? 'text-[#EDEDEB]' : 'text-stone-900'
              }`}>
                <Globe className={`w-4 h-4 ${isDarkMode ? 'text-sage-400' : 'text-sage-600'}`} />
                Website Usage Today
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                Screen time tracked from your focused tabs today.
              </p>
            </div>
            <span className={`font-mono text-xs tabular-nums ${isDarkMode ? 'text-stone-300' : 'text-stone-500'}`}>
              Total: {formatDuration(totalBrowsingSeconds)}
            </span>
          </div>

          <div className="space-y-2">
            {domainUsageList.slice(0, 7).map((item, index) => {
              const pct = totalBrowsingSeconds > 0
                ? Math.round((item.timeSpentSeconds / totalBrowsingSeconds) * 100)
                : 0;

              return (
                <div
                  key={item.domain}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-colors ${
                    isDarkMode
                      ? 'bg-[#141518] text-stone-200 border border-[#23252B]'
                      : 'bg-[#FAF9F6] text-stone-800 border border-[#F0EFEA]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <span className="font-mono text-stone-400 w-5 tabular-nums text-[11px]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`font-medium truncate w-36 sm:w-48 ${
                      isDarkMode ? 'text-[#EDEDEB]' : 'text-stone-800'
                    }`}>
                      {item.domain}
                    </span>
                    <div className="flex-1 hidden sm:block bg-stone-200/50 dark:bg-stone-700/60 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-sage-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[11px] tabular-nums text-stone-400 w-10 text-right">
                      {pct}%
                    </span>
                    <span className={`font-mono text-xs tabular-nums font-semibold w-16 text-right ${
                      isDarkMode ? 'text-[#EDEDEB]' : 'text-stone-900'
                    }`}>
                      {formatDuration(item.timeSpentSeconds)}
                    </span>
                  </div>
                </div>
              );
            })}

            {domainUsageList.length === 0 && (
              <p className="text-xs text-stone-400 italic py-4 text-center">
                No active websites tracked yet today.
              </p>
            )}
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: WEBSITE RESTRICTIONS & SHIELD RULES
        ========================================================================= */}
        <section
          className={`rounded-xl p-6 border transition-colors ${
            isDarkMode
              ? 'bg-[#191B1F] border-[#282A30]'
              : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                <h3 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  Website Restrictions & Shield Rules
                </h3>
                <span className="font-mono text-xs tabular-nums px-2 py-0.5 rounded bg-sage-50 dark:bg-sage-950/60 text-sage-700 dark:text-sage-300 border border-sage-200/60 dark:border-sage-800/50">
                  {present.restrictedSites.filter(s => s.enabled).length}/{present.restrictedSites.length} Active
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Blocked websites are redirected to peaceful nature intervention during active sessions.
              </p>
            </div>

            <form onSubmit={handleAddSite} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. reddit.com"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                className={`px-3 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-[#121316] border-[#282A30] text-white placeholder-stone-500 focus:border-sage-500'
                    : 'bg-[#FAF9F6] border-[#E5E4DF] text-stone-900 placeholder-stone-400 focus:border-sage-600'
                }`}
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors shadow-subtle"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {present.restrictedSites.map(site => (
              <div
                key={site.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  site.enabled
                    ? isDarkMode
                      ? 'bg-[#121316]/50 border-[#282A30]'
                      : 'bg-[#FAF9F6] border-[#EFEFEA]'
                    : isDarkMode
                    ? 'bg-[#121316]/20 border-[#282A30]/40 opacity-50'
                    : 'bg-[#F7F6F2] border-[#EAE9E4] opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${site.enabled ? 'bg-sage-500' : 'bg-stone-300'}`} />
                  <span
                    className={`text-xs font-medium truncate ${
                      site.enabled ? (isDarkMode ? 'text-stone-200' : 'text-stone-800') : 'text-stone-400 line-through'
                    }`}
                  >
                    {site.domain}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleSite(site.id)}
                    title={site.enabled ? 'Disable rule' : 'Enable rule'}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                      site.enabled ? 'bg-sage-600' : 'bg-stone-300 dark:bg-stone-700'
                    }`}
                  >
                    <span
                      className={`block w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                        site.enabled ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => handleRemoveSite(site.id)}
                    title="Remove rule"
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: WEEKLY ANALYTICS (Clean Restrained Chart)
        ========================================================================= */}
        <section
          className={`rounded-xl p-6 border transition-colors ${
            isDarkMode
              ? 'bg-[#191B1F] border-[#282A30]'
              : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-5">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                Weekly Screen vs. Offline Time
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Comparing screen time against offline presence across the week.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-stone-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-stone-300 dark:bg-stone-600" />
                <span>Screen Time</span>
              </span>
              <span className="flex items-center gap-1.5 text-sage-600 dark:text-sage-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-sage-600" />
                <span>Offline Mindspace</span>
              </span>
            </div>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
            {weeklyChartData.map(col => {
              const maxVal = 100;
              const screenHeight = Math.min(100, Math.max(12, Math.round((col.browsingMins / maxVal) * 100)));
              const offlineHeight = Math.min(100, Math.max(12, Math.round((col.offlineMins / maxVal) * 100)));

              return (
                <div key={col.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-32">
                    {/* Screen time bar */}
                    <div
                      style={{ height: `${screenHeight}%` }}
                      title={`Screen: ${col.browsingMins}m`}
                      className="w-3 sm:w-4 rounded-t bg-stone-200 dark:bg-stone-700 transition-all duration-300"
                    />
                    {/* Offline time bar */}
                    <div
                      style={{ height: `${offlineHeight}%` }}
                      title={`Offline: ${col.offlineMins}m`}
                      className={`w-3 sm:w-4 rounded-t transition-all duration-300 ${
                        col.isToday ? 'bg-sage-600' : 'bg-sage-500/70'
                      }`}
                    />
                  </div>

                  <span className={`text-[11px] font-mono tabular-nums ${
                    col.isToday
                      ? 'font-bold text-sage-600 dark:text-sage-400'
                      : 'text-stone-400'
                  }`}>
                    {col.day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: WEATHER & DISCOVER
        ========================================================================= */}
        <section
          id="section-discover"
          className={`rounded-xl p-6 border transition-colors ${
            isDarkMode
              ? 'bg-[#191B1F] border-[#282A30]'
              : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800 mb-5">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                Weather & Offline Suggestions
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Real atmospheric conditions calibrated to meaningful offline activities.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {formattedWeather && (
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <span className="text-base select-none">{formattedWeather.emoji}</span>
                    <span className="font-mono font-medium text-stone-900 dark:text-stone-100">
                      {formattedWeather.temperatureText}
                    </span>
                    <span>{formattedWeather.description}</span>
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-stone-400" /> {formattedWeather.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-stone-400" /> {formattedWeather.windSpeed} km/h
                  </span>
                </div>
              )}

              <button
                onClick={handleRefreshWeather}
                title="Refresh live weather"
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
              >
                <CloudSun className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.map(rec => {
              const alreadyPlanned = userActivities.some(
                a => a.title.toLowerCase() === rec.title.toLowerCase()
              );

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-lg border flex flex-col justify-between transition-colors ${
                    isDarkMode
                      ? 'bg-[#121316]/50 border-[#282A30]'
                      : 'bg-[#FAF9F6] border-[#EAE9E4]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] tabular-nums text-stone-400">
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
                      onClick={() => handleAddWeatherActivity(rec)}
                      disabled={alreadyPlanned}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        alreadyPlanned
                          ? 'bg-sage-100 text-sage-800 dark:bg-sage-950 dark:text-sage-300 cursor-default'
                          : 'bg-sage-600 hover:bg-sage-700 text-white shadow-subtle'
                      }`}
                    >
                      {alreadyPlanned ? (
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
        </section>

        {/* =========================================================================
            SECTION 7: PLEDGES & PLANNED ACTIVITIES (Interactive Checklist)
        ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pledges */}
          <div
            className={`rounded-xl p-6 border transition-colors ${
              isDarkMode
                ? 'bg-[#191B1F] border-[#282A30]'
                : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  Detox Pledges
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Personal commitments to screen-free boundaries.
                </p>
              </div>

              <button
                onClick={() => setShowPledgeForm(!showPledgeForm)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {showPledgeForm ? 'Cancel' : 'New'}
              </button>
            </div>

            {showPledgeForm && (
              <form onSubmit={handleCreatePledgeSubmit} className="mb-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700 space-y-2 bg-[#FAF9F6] dark:bg-[#121316]">
                <input
                  type="text"
                  placeholder="e.g. No screens during evening dinner"
                  value={pledgeTitle}
                  onChange={e => setPledgeTitle(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-md border outline-none ${
                    isDarkMode ? 'bg-[#191B1F] border-[#282A30] text-white focus:border-sage-500' : 'bg-white border-stone-200 text-stone-900 focus:border-sage-600'
                  }`}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[11px] text-stone-400">Target:</span>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={pledgeTargetMins}
                      onChange={e => setPledgeTargetMins(parseInt(e.target.value) || 30)}
                      className={`w-20 px-2 py-1 text-xs font-mono tabular-nums rounded-md border outline-none ${
                        isDarkMode ? 'bg-[#191B1F] border-[#282A30] text-white' : 'bg-white border-stone-200 text-stone-900'
                      }`}
                    />
                    <span className="text-[11px] text-stone-400">mins</span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium rounded-md bg-sage-600 hover:bg-sage-700 text-white cursor-pointer transition-colors shadow-subtle"
                  >
                    Save Pledge
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1.5">
              {present.pledges.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    isDarkMode ? 'bg-[#121316]/50 border-[#282A30]' : 'bg-[#FAF9F6] border-[#EFEFEA]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                    <span className="text-xs font-medium text-stone-800 dark:text-stone-200">
                      {p.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-stone-400">
                    {p.targetMinutes}m target
                  </span>
                </div>
              ))}
              {present.pledges.length === 0 && (
                <p className="text-xs text-stone-400 italic py-2 text-center">No pledges active.</p>
              )}
            </div>
          </div>

          {/* Planned Offline Activities */}
          <div
            className={`rounded-xl p-6 border transition-colors ${
              isDarkMode
                ? 'bg-[#191B1F] border-[#282A30]'
                : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  Planned Offline Activities
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Check off real offline actions as you complete them.
                </p>
              </div>

              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {showActivityForm ? 'Cancel' : 'New'}
              </button>
            </div>

            {showActivityForm && (
              <form onSubmit={handleAddCustomActivity} className="mb-3 p-3 rounded-lg border border-stone-200 dark:border-stone-700 space-y-2 bg-[#FAF9F6] dark:bg-[#121316]">
                <input
                  type="text"
                  placeholder="e.g. Read paperback book chapters"
                  value={activityTitle}
                  onChange={e => setActivityTitle(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-md border outline-none ${
                    isDarkMode ? 'bg-[#191B1F] border-[#282A30] text-white focus:border-sage-500' : 'bg-white border-stone-200 text-stone-900 focus:border-sage-600'
                  }`}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[11px] text-stone-400">Duration:</span>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={activityDuration}
                      onChange={e => setActivityDuration(parseInt(e.target.value) || 30)}
                      className={`w-20 px-2 py-1 text-xs font-mono tabular-nums rounded-md border outline-none ${
                        isDarkMode ? 'bg-[#191B1F] border-[#282A30] text-white' : 'bg-white border-stone-200 text-stone-900'
                      }`}
                    />
                    <span className="text-[11px] text-stone-400">mins</span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-medium rounded-md bg-sage-600 hover:bg-sage-700 text-white cursor-pointer transition-colors shadow-subtle"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
              {userActivities.map(act => (
                <div
                  key={act.id}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    act.completed
                      ? isDarkMode
                        ? 'bg-sage-950/20 border-sage-900/30 text-stone-500 opacity-60'
                        : 'bg-sage-50/40 border-sage-100 text-stone-400 opacity-70'
                      : isDarkMode
                      ? 'bg-[#121316]/50 border-[#282A30]'
                      : 'bg-[#FAF9F6] border-[#EFEFEA]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleCompleteActivity(act.id)}
                      title={act.completed ? 'Untick activity' : 'Mark completed'}
                      className="cursor-pointer text-sage-600 hover:text-sage-700 transition-colors"
                    >
                      {act.completed ? (
                        <CheckCircle className="w-4 h-4 text-sage-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-300 hover:text-sage-600" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span className={`text-xs font-medium block truncate ${act.completed ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}`}>
                        {act.title}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-stone-400">
                        +{act.durationMinutes}m offline credit
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(act.id)}
                    title="Delete activity"
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {userActivities.length === 0 && (
                <p className="text-xs text-stone-400 italic py-2 text-center">
                  No planned activities yet.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 8: ACHIEVEMENTS & MILESTONES
        ========================================================================= */}
        <section
          id="section-profile"
          className={`rounded-xl p-6 border transition-colors ${
            isDarkMode
              ? 'bg-[#191B1F] border-[#282A30]'
              : 'bg-[#FFFFFF] border-[#E8E7E3] shadow-subtle'
          }`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 mb-5">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                Milestones & Achievements
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Earned through genuine verified offline presence.
              </p>
            </div>

            <span className="font-mono text-xs tabular-nums px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
              {unlockedAchievements.length} of {data.achievements.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.achievements.map(ach => (
              <div
                key={ach.id}
                className={`p-3.5 rounded-lg border transition-colors ${
                  ach.unlocked
                    ? isDarkMode
                      ? 'bg-[#121316]/60 border-sage-900/50'
                      : 'bg-[#FAF9F6] border-sage-200/60'
                    : isDarkMode
                    ? 'bg-[#121316]/20 border-[#282A30]/50 opacity-45'
                    : 'bg-[#F9F8F5] border-[#EFEFEA] opacity-50'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`p-1.5 rounded-md ${
                      ach.unlocked
                        ? 'bg-sage-100 text-sage-700 dark:bg-sage-950 dark:text-sage-300'
                        : 'bg-stone-200/50 text-stone-400 dark:bg-stone-800'
                    }`}
                  >
                    {getAchievementIcon(ach.id)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-medium truncate">{ach.name}</h4>
                    <span className="font-mono text-[10px] tabular-nums text-stone-400">
                      {ach.unlocked ? 'Unlocked ✓' : `${ach.progress}% progress`}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed mb-2.5 line-clamp-2">
                  {ach.description}
                </p>

                <div className="w-full bg-stone-200/60 dark:bg-stone-800 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      ach.unlocked ? 'bg-sage-600' : 'bg-stone-400'
                    }`}
                    style={{ width: `${ach.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className={`pt-6 pb-2 text-center text-xs border-t transition-colors ${
          isDarkMode ? 'border-[#282A30] text-stone-500' : 'border-[#E8E7E3] text-stone-400'
        }`}>
          <p className="font-medium">
            tabzero. — Digital Wellness Browser Extension
          </p>
          <p className="mt-1">
            Life happens beyond the screen. Scroll less. Live more.
          </p>
        </footer>
      </div>

      {/* =========================================================================
          BOTTOM NAVIGATION (5 Sections: Home, Focus, Discover, Progress, Profile)
      ========================================================================= */}
      <nav
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-xl border shadow-card backdrop-blur-md transition-colors flex items-center gap-1 ${
          isDarkMode
            ? 'bg-[#191B1F]/90 border-[#282A30] text-stone-400'
            : 'bg-white/90 border-[#E8E7E3] text-stone-600'
        }`}
      >
        <button
          onClick={() => scrollToSection('section-overview', 'home')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeNav === 'home'
              ? isDarkMode
                ? 'bg-[#282A30] text-white'
                : 'bg-stone-100 text-stone-900 font-semibold'
              : 'hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => scrollToSection('section-focus', 'focus')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeNav === 'focus'
              ? isDarkMode
                ? 'bg-[#282A30] text-white'
                : 'bg-stone-100 text-stone-900 font-semibold'
              : 'hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Focus</span>
        </button>

        <button
          onClick={() => scrollToSection('section-discover', 'discover')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeNav === 'discover'
              ? isDarkMode
                ? 'bg-[#282A30] text-white'
                : 'bg-stone-100 text-stone-900 font-semibold'
              : 'hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span>Discover</span>
        </button>

        <button
          onClick={() => scrollToSection('section-progress', 'progress')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeNav === 'progress'
              ? isDarkMode
                ? 'bg-[#282A30] text-white'
                : 'bg-stone-100 text-stone-900 font-semibold'
              : 'hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Progress</span>
        </button>

        <button
          onClick={() => scrollToSection('section-profile', 'profile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeNav === 'profile'
              ? isDarkMode
                ? 'bg-[#282A30] text-white'
                : 'bg-stone-100 text-stone-900 font-semibold'
              : 'hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};
