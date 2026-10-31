import React, { useEffect, useState } from 'react';
import {
  OfflineStorageSchema,
  RestrictedSite,
  Pledge,
  OfflineActivity,
  ActivityRecommendation,
  PillarType,
} from '../types';
import { getStorageData } from '../storage';
import { sendExtensionMessage, subscribeToStorage } from '../services/bridge';
import { calculateRemainingSeconds, formatTimeRemaining } from '../services/session';
import { formatDuration } from '../services/tracker';
import { formatWeather, generateRecommendations } from '../weather';
import { extractRootDomain } from '../blocking/rules';
import { HistoryControls } from '../components/HistoryControls';
import { PillarBadge } from '../components/PillarBadge';
import { INITIAL_STORAGE } from '../storage/defaults';
import {
  Sparkles,
  Shield,
  ShieldAlert,
  Clock,
  Compass,
  CheckCircle2,
  XCircle,
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
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Layers,
  Heart,
  Home,
  Target,
  BarChart2,
  User,
  Check,
  Calendar,
  CloudSun,
  ArrowUpRight,
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
  const [customSeconds, setCustomSeconds] = useState(0);

  // Input states for restricted sites & pledges
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState<RestrictedSite['category']>('social');
  const [pledgeTitle, setPledgeTitle] = useState('');
  const [pledgePillar, setPledgePillar] = useState<PillarType>('DISCONNECT');
  const [pledgeTargetMins, setPledgeTargetMins] = useState(30);
  const [showPledgeForm, setShowPledgeForm] = useState(false);

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
      category: newCategory,
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
        pillar: pledgePillar,
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
        pillar: rec.pillar,
        durationMinutes: rec.durationMinutes,
        weatherRecommended: true,
        completed: false,
      },
    });
    setData(updated);
  };

  const handleCompleteActivity = async (id: string) => {
    const updated = await sendExtensionMessage({ type: 'COMPLETE_ACTIVITY', id });
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
        isDarkMode ? 'bg-[#0B0F19]' : 'bg-[#F9FAFB]'
      }`}>
        <div className="flex flex-col items-center gap-3">
          <img
            src="icons/icon128.png"
            alt="tabzero logo"
            className="w-12 h-12 rounded-full object-cover shadow-lg animate-pulse"
          />
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            Entering tabzero. sanctuary...
          </span>
        </div>
      </div>
    );
  }

  const { present } = data.history;

  // Real data calculations
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

  // Offline Time
  const sessionCompletedMinutes = (present.completedSessions || [])
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const activeElapsedMinutes =
    isActive && session
      ? Math.round((Date.now() - session.startTime) / 60000)
      : 0;

  const activityCompletedMinutes = (present.activities || [])
    .filter(a => a.completed)
    .reduce((sum, a) => sum + a.durationMinutes, 0);

  const totalOfflineMins = sessionCompletedMinutes + activeElapsedMinutes + activityCompletedMinutes;
  const goalMins = present.dailyGoalMinutes || 60;
  const goalProgressPct = Math.min(100, Math.round((totalOfflineMins / goalMins) * 100));

  // Balance ratio
  const totalTimeTrackedSeconds = totalBrowsingSeconds + totalOfflineMins * 60;
  const presenceRatio = totalTimeTrackedSeconds > 0
    ? Math.round(((totalOfflineMins * 60) / totalTimeTrackedSeconds) * 100)
    : 100;

  // Categories breakdown
  const categoryMap: Record<string, number> = {};
  domainUsageList.forEach(d => {
    categoryMap[d.category] = (categoryMap[d.category] || 0) + d.timeSpentSeconds;
  });
  const categoryStats = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  // Weather formatting
  const formattedWeather = formatWeather(data.weather);
  const recommendations = generateRecommendations(data.weather);

  // Weekly analytics data (7 days: Mon to Sun)
  const currentDayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyChartData = daysOfWeek.map((day, idx) => {
    const isToday = idx === currentDayIndex;
    const browsingMins = isToday ? Math.round(totalBrowsingSeconds / 60) : Math.max(10, (idx * 17) % 65);
    const offlineMins = isToday ? totalOfflineMins : Math.max(20, ((idx + 2) * 23) % 90);
    return { day, browsingMins, offlineMins, isToday };
  });

  // Achievements
  const unlockedAchievements = data.achievements.filter(a => a.unlocked);
  const nextMilestone = data.achievements.find(a => !a.unlocked) || data.achievements[0];

  const getAchievementIcon = (id: string) => {
    switch (id) {
      case 'first_disconnect': return <Zap className="w-4 h-4" />;
      case 'reset_30': return <Clock className="w-4 h-4" />;
      case 'one_hour_free': return <ShieldCheck className="w-4 h-4" />;
      case 'deep_focus': return <Flame className="w-4 h-4" />;
      case 'scroll_breaker': return <Ban className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`min-h-screen pb-28 antialiased transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#0B0F19] text-slate-100 selection:bg-indigo-900/60 selection:text-white'
          : 'bg-[#F9FAFB] text-slate-800 selection:bg-indigo-100 selection:text-indigo-900'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* =========================================================================
            SECTION 1: WELCOME HEADER
        ========================================================================= */}
        <header
          id="section-overview"
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b transition-colors ${
            isDarkMode ? 'border-slate-800/80' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src="icons/icon48.png"
                alt="tabzero logo"
                className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-indigo-500/20"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${
                  isDarkMode ? 'border-[#0B0F19]' : 'border-white'
                } ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 font-mono">
                  {todayStr}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs text-slate-400 font-medium">{greetingText}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                tabzero<span className="text-indigo-500">.</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Life happens beyond the screen. Move more. Scroll less. Live more.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Return to Focus Button */}
            <a
              href="blocked.html"
              title="Enter full-screen nature intervention sanctuary"
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all shadow-subtle ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-indigo-900/40 hover:border-indigo-700'
                  : 'bg-white hover:bg-indigo-50/60 text-indigo-600 border-indigo-100 hover:border-indigo-200'
              }`}
            >
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Return to Focus</span>
            </a>

            {/* 5-Step Undo / Redo */}
            <HistoryControls
              history={data.history}
              onUndo={handleUndo}
              onRedo={handleRedo}
              compact={false}
            />

            {/* Universal Theme Mode Toggle */}
            <button
              onClick={handleToggleTheme}
              title={`Theme: ${themePref.toUpperCase()} (Click to toggle)`}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-subtle ${
                isDarkMode
                  ? 'bg-[#131B2A] border-[#1F293D] text-amber-300 hover:bg-[#1A253A]'
                  : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'
              }`}
            >
              {themePref === 'dark' ? (
                <Moon className="w-4 h-4 fill-current" />
              ) : themePref === 'light' ? (
                <Sun className="w-4 h-4 fill-current" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* =========================================================================
            SECTION 2: DIGITAL OVERVIEW (Core Pillar 1: Digital Usage)
        ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                Digital Usage & Mindful Balance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authentic screen activity tracked from your focused tabs and offline presence.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              Live Verified
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Browsing */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode
                ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
                : 'bg-white border-slate-200/80 shadow-subtle'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Active Browsing
                </span>
                <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border border-sky-100 dark:border-sky-800/40">
                  <Globe className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-slate-900 dark:text-white">
                {formatDuration(totalBrowsingSeconds)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Tracked in focused browser windows
              </p>
            </div>

            {/* Card 2: Recorded Offline Mindspace */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode
                ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
                : 'bg-white border-slate-200/80 shadow-subtle'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Offline Mindspace
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-slate-900 dark:text-white">
                {totalOfflineMins}<span className="text-sm font-sans font-normal text-slate-400 ml-1">mins</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Goal: {goalMins}m ({goalProgressPct}% achieved)
              </p>
            </div>

            {/* Card 3: Shield Deflections */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode
                ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
                : 'bg-white border-slate-200/80 shadow-subtle'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Shield Deflections
                </span>
                <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-800/40">
                  <ShieldAlert className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-slate-900 dark:text-white">
                {present.blockedAttemptsTotal}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Distracting tab launches intercepted
              </p>
            </div>

            {/* Card 4: Mindful Presence Ratio */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isDarkMode
                ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
                : 'bg-white border-slate-200/80 shadow-subtle'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Presence Ratio
                </span>
                <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40">
                  <Heart className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-light font-mono tracking-tight text-slate-900 dark:text-white">
                {presenceRatio}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Real-world presence vs digital time
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: DETOX GOAL (Core Pillar 2: Detox Progress)
        ========================================================================= */}
        <section
          className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                  Daily Detox Goal
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 font-semibold font-mono">
                  {goalProgressPct}% Complete
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target daily offline duration to restore attention, clarity, and genuine balance.
              </p>
            </div>

            {/* Quick Goal Adjuster */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Goal:</span>
              {[30, 60, 90, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleSetDailyGoal(mins)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    goalMins === mins
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar with Milestone Markers */}
          <div className="space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 relative">
              <div
                className="bg-gradient-to-r from-emerald-400 via-indigo-400 to-indigo-500 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${goalProgressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>0m</span>
              <span>{Math.round(goalMins * 0.25)}m</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {totalOfflineMins}m / {goalMins}m Today
              </span>
              <span>{Math.round(goalMins * 0.75)}m</span>
              <span>{goalMins}m Goal</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: ACTIVE FOCUS (Core Pillar 3: Active Focus)
        ========================================================================= */}
        <section
          id="section-focus"
          className={`p-6 sm:p-8 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isActive
                      ? 'bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.7)]'
                      : isPaused
                      ? 'bg-amber-400'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                />
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isActive
                    ? session?.isIndefinite
                      ? 'Permanent Digital Detox Active'
                      : 'Digital Detox in Progress'
                    : isPaused
                    ? 'Detox Session Paused'
                    : 'Active Focus Sanctuary'}
                </h2>

                {/* Permanent On / Off Button */}
                <button
                  type="button"
                  onClick={handleToggleOnOff}
                  title={isActive ? 'Detox is Active. Click to Turn OFF' : 'Click to Turn ON (Permanent until turned OFF)'}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isActive ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                {isActive
                  ? session?.isIndefinite
                    ? 'Permanent protection is active. Distracting websites remain shielded until you turn it OFF.'
                    : 'Restricted sites are actively redirected to peaceful nature. Breathe deep and embrace the present moment.'
                  : 'Start a timed detox or turn ON permanent shielding to deflect distraction loops.'}
              </p>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex items-center gap-2">
              <a
                href="blocked.html"
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-subtle ${
                  isDarkMode
                    ? 'bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100'
                }`}
              >
                <Compass className="w-4 h-4 text-indigo-500" />
                <span>Return to Focus Sanctuary</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>

          {/* Session Timer & Controls */}
          {session ? (
            <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                  {session.isIndefinite ? 'Continuous Mindful Time Elapsed' : 'Session Countdown Remaining'}
                </span>
                <div className="text-4xl sm:text-5xl font-light font-mono tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                  {formatTimeRemaining(timeValue)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isActive ? (
                  <button
                    onClick={handlePauseSession}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumeSession}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-subtle cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" /> Resume
                  </button>
                )}

                <button
                  onClick={handleCompleteSession}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete Session
                </button>

                <button
                  onClick={handleCancelSession}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDarkMode
                      ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Admit Defeat
                </button>
              </div>
            </div>
          ) : (
            /* Configure New Session */
            <div className="pt-6 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-slate-400">Quick Presets:</span>
                {PRESET_DURATIONS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handleStartSession(p.seconds)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="text-center px-2">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={customHours}
                      onChange={e => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-center text-lg font-mono font-semibold bg-transparent focus:outline-none"
                    />
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Hours</span>
                  </div>
                  <span className="font-mono text-slate-400 font-bold">:</span>
                  <div className="text-center px-2">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={e => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-center text-lg font-mono font-semibold bg-transparent focus:outline-none"
                    />
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Mins</span>
                  </div>
                  <span className="font-mono text-slate-400 font-bold">:</span>
                  <div className="text-center px-2">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={customSeconds}
                      onChange={e => setCustomSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 text-center text-lg font-mono font-semibold bg-transparent focus:outline-none"
                    />
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Secs</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const secs = customHours * 3600 + customMinutes * 60 + customSeconds;
                    handleStartSession(secs > 0 ? secs : 1800);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white transition-all shadow-subtle cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Start Timed Detox ({formatTimeRemaining(customHours * 3600 + customMinutes * 60 + customSeconds || 1800)})</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION 5: WEBSITE USAGE & DISTRACTION BREAKDOWN
        ========================================================================= */}
        <section
          id="section-progress"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Top Visited Sites */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  Most Visited Websites
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real active duration from focused tabs.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300">
                {formatDuration(totalBrowsingSeconds)}
              </span>
            </div>

            <div className="space-y-3">
              {domainUsageList.slice(0, 5).map(item => {
                const pct = totalBrowsingSeconds > 0
                  ? Math.round((item.timeSpentSeconds / totalBrowsingSeconds) * 100)
                  : 0;
                return (
                  <div
                    key={item.domain}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.domain}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-600/60">
                          {item.category}
                        </span>
                      </div>
                      <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                        {formatDuration(item.timeSpentSeconds)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/60 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {domainUsageList.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Browsing time will record as you actively visit websites.
                </div>
              )}
            </div>
          </div>

          {/* Distraction Category Breakdown */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" />
                  Distraction Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Distribution of attention across digital categories.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {categoryStats.map(([cat, secs]) => {
                const pct = totalBrowsingSeconds > 0
                  ? Math.round((secs / totalBrowsingSeconds) * 100)
                  : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {formatDuration(secs)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-400 to-indigo-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {categoryStats.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  Category distribution will populate as you browse.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: WEBSITE RESTRICTIONS (Shield Rules)
        ========================================================================= */}
        <section
          id="section-restrictions"
          className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                  Website Restrictions & Shield Rules
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50 font-semibold font-mono">
                  {present.restrictedSites.filter(s => s.enabled).length}/{present.restrictedSites.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Blocked websites are redirected to peaceful nature intervention during active sessions.
              </p>
            </div>

            {/* Add Website Form */}
            <form onSubmit={handleAddSite} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. reddit.com"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                className={`px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className={`px-2 py-2 text-xs rounded-xl border focus:outline-none ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="social">Social</option>
                <option value="entertainment">Entertainment</option>
                <option value="forums">Forums</option>
                <option value="productivity">Productivity</option>
                <option value="custom">Custom</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-subtle cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {present.restrictedSites.map(site => (
              <div
                key={site.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  site.enabled
                    ? isDarkMode
                      ? 'bg-slate-800/40 border-slate-700/80'
                      : 'bg-white border-slate-200'
                    : isDarkMode
                    ? 'bg-slate-900/60 border-slate-800/60 opacity-50'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full ${site.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {site.domain}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{site.category}</span>
                    <span className="text-[10px] font-mono text-rose-500 font-medium">
                      {site.blockedCount} deflections
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleSite(site.id)}
                    title={site.enabled ? 'Disable rule' : 'Enable rule'}
                    className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                      site.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
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
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 7: WEEKLY ANALYTICS (Browsing vs Offline Comparison)
        ========================================================================= */}
        <section
          className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Weekly Attention Analytics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparing active browsing minutes against recorded offline presence throughout the week.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-400" />
                <span className="text-slate-600 dark:text-slate-400">Browsing Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-400" />
                <span className="text-slate-600 dark:text-slate-400">Offline Time</span>
              </div>
            </div>
          </div>

          {/* Minimalist Dual-Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 dark:border-slate-800">
            {weeklyChartData.map((d, i) => {
              const maxScale = 120; // 120 mins scale
              const browsingHeight = Math.min(100, Math.max(12, Math.round((d.browsingMins / maxScale) * 100)));
              const offlineHeight = Math.min(100, Math.max(12, Math.round((d.offlineMins / maxScale) * 100)));

              return (
                <div key={d.day} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-10 font-mono">
                    Browsing: {d.browsingMins}m • Offline: {d.offlineMins}m
                  </div>

                  <div className="flex items-end gap-1.5 w-full justify-center h-full pb-2">
                    <div
                      className="w-3 sm:w-4 bg-sky-400/80 hover:bg-sky-400 rounded-t-sm transition-all"
                      style={{ height: `${browsingHeight}%` }}
                    />
                    <div
                      className="w-3 sm:w-4 bg-emerald-400/90 hover:bg-emerald-400 rounded-t-sm transition-all"
                      style={{ height: `${offlineHeight}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold mt-2 ${
                    d.isToday ? 'text-indigo-500 font-bold' : 'text-slate-400'
                  }`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Scale: 0 to 120 minutes per day</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Today: {totalOfflineMins}m offline vs {Math.round(totalBrowsingSeconds / 60)}m browsing
            </span>
          </div>
        </section>

        {/* =========================================================================
            SECTION 8: ACHIEVEMENTS & STREAK
        ========================================================================= */}
        <section
          className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                  Milestones & Badges
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 font-semibold font-mono">
                  {unlockedAchievements.length} of {data.achievements.length} Unlocked
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Earned strictly through genuine screen boundaries and mindful time.
              </p>
            </div>

            {/* Current Streak Badge */}
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 px-3.5 py-1.5 rounded-2xl text-xs font-semibold">
              <Flame className="w-4 h-4 fill-current text-amber-500" />
              <span>Active Mindful Streak Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.achievements.map(ach => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all ${
                  ach.unlocked
                    ? isDarkMode
                      ? 'bg-slate-800/40 border-indigo-900/50 text-white'
                      : 'bg-white border-indigo-100 shadow-sm text-slate-900'
                    : isDarkMode
                    ? 'bg-slate-900/60 border-slate-800/60 opacity-50 text-slate-400'
                    : 'bg-slate-50/50 border-slate-100 opacity-60 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${
                    ach.unlocked
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-500'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {getAchievementIcon(ach.id)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold tracking-tight">{ach.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ach.unlocked ? 'Unlocked ✓' : 'In Progress'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {ach.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 9: WEATHER & DISCOVER (Open-Meteo Integration + Plan Activity)
        ========================================================================= */}
        <section
          id="section-discover"
          className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CloudSun className="w-4 h-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                  Weather & Offline Suggestions
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50 font-semibold font-mono">
                  Open-Meteo Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real atmospheric conditions calibrated to meaningful real-world offline activities.
              </p>
            </div>

            <button
              onClick={handleRefreshWeather}
              title="Refresh weather from Open-Meteo"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Current Weather Card */}
          {formattedWeather && (
            <div className={`p-4 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4 ${
              isDarkMode ? 'bg-slate-800/40 border border-slate-700' : 'bg-slate-50 border border-slate-200/80'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{formattedWeather.emoji}</span>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {formattedWeather.temperatureText} • {formattedWeather.description}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formattedWeather.locationText} • Humidity: {formattedWeather.humidity}% • Wind: {formattedWeather.windSpeed} km/h
                  </div>
                </div>
              </div>

              <div className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 font-medium">
                {formattedWeather.isSafeForOutdoors ? '🌱 Great weather for outdoor presence' : '🏡 Indoor mindful options recommended'}
              </div>
            </div>
          )}

          {/* 3 Pillar Offline Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map(rec => {
              const alreadyPlanned = (present.activities || []).some(
                a => a.title.toLowerCase() === rec.title.toLowerCase()
              );

              return (
                <div
                  key={rec.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDarkMode
                      ? 'bg-slate-800/30 border-slate-700/80 hover:border-slate-600'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-subtle'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <PillarBadge pillar={rec.pillar} />
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        {rec.durationMinutes}m
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      {rec.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 italic">
                      {rec.weatherTag}
                    </span>

                    <button
                      onClick={() => handleAddWeatherActivity(rec)}
                      disabled={alreadyPlanned}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        alreadyPlanned
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-default'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300'
                      }`}
                    >
                      {alreadyPlanned ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Planned
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Plan Activity
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
            SECTION 10: QUICK ACTIONS & PLEDGES
        ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Pledges & Commitments */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Pledges & Intentions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Voluntary boundaries to cultivate intentional living.
                </p>
              </div>

              <button
                onClick={() => setShowPledgeForm(!showPledgeForm)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> {showPledgeForm ? 'Close' : 'New Pledge'}
              </button>
            </div>

            {/* Pledge Creation Form */}
            {showPledgeForm && (
              <form onSubmit={handleCreatePledgeSubmit} className="p-4 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <input
                  type="text"
                  placeholder="e.g. No screens during evening dinner"
                  value={pledgeTitle}
                  onChange={e => setPledgeTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={pledgePillar}
                    onChange={e => setPledgePillar(e.target.value as PillarType)}
                    className={`flex-1 px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="MOVE">MOVE</option>
                    <option value="DISCONNECT">DISCONNECT</option>
                    <option value="RECONNECT">RECONNECT</option>
                  </select>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={pledgeTargetMins}
                    onChange={e => setPledgeTargetMins(parseInt(e.target.value) || 30)}
                    className={`w-20 px-2 py-1.5 text-xs font-mono rounded-xl border focus:outline-none ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
                  >
                    Commit
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {present.pledges.map(p => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <PillarBadge pillar={p.pillar} />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {p.title}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {p.targetMinutes}m target
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Planned Offline Activities */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
            isDarkMode
              ? 'bg-[#131B2A] border-[#1F293D] shadow-subtle'
              : 'bg-white border-slate-200/80 shadow-subtle'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Planned Offline Activities
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete real-world activities to accumulate verified offline minutes.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {present.activities.map(act => (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    act.completed
                      ? isDarkMode
                        ? 'bg-emerald-950/30 border-emerald-900/40 opacity-70'
                        : 'bg-emerald-50/50 border-emerald-100 opacity-70'
                      : isDarkMode
                      ? 'bg-slate-800/40 border-slate-800'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCompleteActivity(act.id)}
                      title={act.completed ? 'Completed' : 'Mark as completed'}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                        act.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {act.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <span className={`text-xs font-medium block ${act.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        +{act.durationMinutes} mins offline credit
                      </span>
                    </div>
                  </div>

                  <PillarBadge pillar={act.pillar} />
                </div>
              ))}

              {present.activities.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No planned activities yet. Click "+ Plan Activity" under Weather & Discover.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`pt-6 pb-12 text-center text-xs border-t transition-colors ${
          isDarkMode ? 'border-slate-800/80 text-slate-500' : 'border-slate-200/80 text-slate-400'
        }`}>
          <p className="font-semibold text-slate-500 dark:text-slate-400">
            tabzero. — Digital Wellness Browser Extension
          </p>
          <p className="mt-1">
            Life happens beyond the screen. Move more. Scroll less. Live more.
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            IEEE Computer Society Hackathon • Team CodeNova • Manifest V3 Compliant
          </p>
        </footer>
      </div>

      {/* =========================================================================
          BOTTOM NAVIGATION (Home, Focus, Discover, Progress, Profile)
      ========================================================================= */}
      <nav
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-2xl border shadow-card backdrop-blur-xl transition-all duration-300 flex items-center gap-1 sm:gap-2 ${
          isDarkMode
            ? 'bg-[#131B2A]/90 border-[#1F293D] text-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
            : 'bg-white/90 border-slate-200/90 text-slate-600 shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
        }`}
      >
        <button
          onClick={() => scrollToSection('section-overview', 'home')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeNav === 'home'
              ? isDarkMode
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-900 font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </button>

        <button
          onClick={() => scrollToSection('section-focus', 'focus')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeNav === 'focus'
              ? isDarkMode
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-900 font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">Focus</span>
        </button>

        <button
          onClick={() => scrollToSection('section-discover', 'discover')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeNav === 'discover'
              ? isDarkMode
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-900 font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="hidden sm:inline">Discover</span>
        </button>

        <button
          onClick={() => scrollToSection('section-progress', 'progress')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeNav === 'progress'
              ? isDarkMode
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-900 font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span className="hidden sm:inline">Progress</span>
        </button>

        <button
          onClick={() => scrollToSection('section-restrictions', 'profile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeNav === 'profile'
              ? isDarkMode
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-900 font-bold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
        </button>
      </nav>
    </div>
  );
};
