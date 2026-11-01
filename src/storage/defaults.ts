import { Achievement, CoreAppState, HistoryState, OfflineStorageSchema, RestrictedSite } from '../types';

export const DEFAULT_RESTRICTED_SITES: RestrictedSite[] = [
  { id: 'site_1', domain: 'instagram.com', enabled: true, category: 'social', blockedCount: 0, addedAt: Date.now() },
  { id: 'site_2', domain: 'youtube.com', enabled: true, category: 'entertainment', blockedCount: 0, addedAt: Date.now() },
  { id: 'site_3', domain: 'x.com', enabled: true, category: 'social', blockedCount: 0, addedAt: Date.now() },
  { id: 'site_4', domain: 'reddit.com', enabled: true, category: 'forums', blockedCount: 0, addedAt: Date.now() },
  { id: 'site_5', domain: 'tiktok.com', enabled: true, category: 'social', blockedCount: 0, addedAt: Date.now() },
  { id: 'site_6', domain: 'facebook.com', enabled: true, category: 'social', blockedCount: 0, addedAt: Date.now() },
  { id: 'site_7', domain: 'netflix.com', enabled: true, category: 'entertainment', blockedCount: 0, addedAt: Date.now() },
  { id: 'site_8', domain: 'twitch.tv', enabled: true, category: 'entertainment', blockedCount: 0, addedAt: Date.now() },
];

export const DEFAULT_CORE_STATE: CoreAppState = {
  restrictedSites: DEFAULT_RESTRICTED_SITES,
  activeSession: null,
  completedSessions: [],
  dailyGoalMinutes: 60,
  pledges: [
    { id: 'p_1', title: 'Screen-free morning routine', targetMinutes: 30, isActive: true, createdAt: Date.now() - 86400000 },
    { id: 'p_2', title: 'Deep focus without social feeds', targetMinutes: 60, isActive: true, createdAt: Date.now() - 43200000 },
    { id: 'p_3', title: 'Evening outdoor unwind', targetMinutes: 45, isActive: true, createdAt: Date.now() - 21600000 },
  ],
  activities: [],
  blockedAttemptsTotal: 0,
};

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_disconnect', name: 'First Disconnect', description: 'Complete your first digital detox session', unlocked: false, progress: 0, icon: 'Zap' },
  { id: 'reset_30', name: '30-Minute Reset', description: 'Reach 30 minutes of total offline focus time', unlocked: false, progress: 0, icon: 'Clock' },
  { id: 'one_hour_free', name: 'One Hour Free', description: 'Accumulate 60 minutes away from screens', unlocked: false, progress: 0, icon: 'ShieldCheck' },
  { id: 'deep_focus', name: 'Deep Focus', description: 'Complete a single 2-hour detox session', unlocked: false, progress: 0, icon: 'Flame' },
  { id: 'scroll_breaker', name: 'Scroll Breaker', description: 'Successfully deflect a restricted site during a session', unlocked: false, progress: 0, icon: 'Ban' },
  { id: 'consistency', name: 'Consistency Master', description: 'Achieve your daily offline goal', unlocked: false, progress: 0, icon: 'Award' },
];

export const DEFAULT_HISTORY_STATE: HistoryState = {
  past: [],
  present: DEFAULT_CORE_STATE,
  future: [],
};

export const INITIAL_STORAGE: OfflineStorageSchema = {
  history: DEFAULT_HISTORY_STATE,
  usage: {},
  weather: null,
  achievements: DEFAULT_ACHIEVEMENTS,
  userLocation: {
    city: 'Bangalore, IN',
    latitude: 12.9716,
    longitude: 77.5946,
  },
  lastActiveTimestamp: Date.now(),
  trackingActive: true,
  themePreference: 'light',
  lastBlockedDomain: '',
  tabDestinations: {},
};
