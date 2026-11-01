export type PillarType = 'MOVE' | 'DISCONNECT' | 'RECONNECT' | string;

export interface RestrictedSite {
  id: string;
  domain: string;
  enabled: boolean;
  category?: 'social' | 'entertainment' | 'forums' | 'productivity' | 'custom' | string;
  blockedCount: number;
  addedAt: number;
}

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface DetoxSession {
  id: string;
  durationMinutes: number;
  durationSeconds?: number;
  isIndefinite?: boolean;
  startTime: number;
  endTime: number;
  status: SessionStatus;
  pausedRemainingMs: number;
  selectedDomains: string[];
  completedAt?: number;
}

export interface Pledge {
  id: string;
  title: string;
  pillar?: PillarType;
  targetMinutes: number;
  isActive: boolean;
  createdAt: number;
}

export interface OfflineActivity {
  id: string;
  title: string;
  pillar?: PillarType;
  durationMinutes: number;
  weatherRecommended?: boolean;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number; // 0 to 100
  icon: string;
}

export interface DomainUsage {
  domain: string;
  timeSpentSeconds: number;
  lastActive: number;
  category: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  condition: string;
  city: string;
  latitude: number;
  longitude: number;
  fetchedAt: number;
  isDay?: boolean;
  time?: string;
  isCached?: boolean;
}

export type WeatherCategory =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'very_hot'
  | 'pleasant'
  | 'cold'
  | 'fog';

export interface FormattedWeather {
  temperatureText: string;
  temperatureValue: number;
  description: string;
  emoji: string;
  displayText: string;
  locationText: string;
  observationTimeText: string;
  isDay: boolean;
  isCached: boolean;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  isSafeForOutdoors: boolean;
  weatherCategory: WeatherCategory;
}

export interface ActivityRecommendation {
  id: string;
  title: string;
  description: string;
  pillar?: PillarType;
  durationMinutes: number;
  weatherTag: string;
  icon: string;
}

// Full Core State that is snapshot-managed for 5-Step Undo/Redo
export interface CoreAppState {
  restrictedSites: RestrictedSite[];
  activeSession: DetoxSession | null;
  completedSessions: DetoxSession[];
  dailyGoalMinutes: number;
  pledges: Pledge[];
  activities: OfflineActivity[];
  blockedAttemptsTotal: number;
}

// Persistent History Structure (Past [max 5], Present, Future [max 5])
export interface HistoryState {
  past: CoreAppState[];
  present: CoreAppState;
  future: CoreAppState[];
}

// Complete Storage Model
export interface OfflineStorageSchema {
  history: HistoryState;
  usage: Record<string, DomainUsage>;
  weather: WeatherData | null;
  achievements: Achievement[];
  userLocation: {
    city: string;
    latitude: number;
    longitude: number;
  };
  lastActiveTimestamp: number;
  trackingActive: boolean;
  themePreference?: 'system' | 'light' | 'dark';
  lastBlockedDomain?: string;
  tabDestinations?: Record<number, string>;
}

// Message types between UI & Background
export type ExtensionMessage =
  | { type: 'GET_STATE' }
  | { type: 'STATE_UPDATED'; state: HistoryState }
  | { type: 'TRIGGER_UNDO' }
  | { type: 'TRIGGER_REDO' }
  | { type: 'SESSION_START'; durationMinutes?: number; durationSeconds?: number; isIndefinite?: boolean; domains?: string[] }
  | { type: 'TOGGLE_SHIELD'; enabled?: boolean }
  | { type: 'SESSION_PAUSE' }
  | { type: 'SESSION_RESUME' }
  | { type: 'SESSION_COMPLETE' }
  | { type: 'SESSION_CANCEL' }
  | { type: 'ADD_SITE'; domain: string; category?: RestrictedSite['category'] }
  | { type: 'REMOVE_SITE'; id: string }
  | { type: 'TOGGLE_SITE'; id: string }
  | { type: 'INCREMENT_BLOCKED_COUNT'; domain: string }
  | { type: 'SET_DAILY_GOAL'; minutes: number }
  | { type: 'CREATE_PLEDGE'; pledge: Omit<Pledge, 'id' | 'createdAt'> }
  | { type: 'EDIT_PLEDGE'; id: string; updates: Partial<Pledge> }
  | { type: 'ADD_ACTIVITY'; activity: Omit<OfflineActivity, 'id' | 'createdAt'> }
  | { type: 'COMPLETE_ACTIVITY'; id: string }
  | { type: 'REMOVE_ACTIVITY'; id: string }
  | { type: 'REFRESH_WEATHER' }
  | { type: 'SET_THEME'; theme: 'system' | 'light' | 'dark' }
  | { type: 'RECORD_BLOCKED_TAB'; tabId: number; domain: string }
  | { type: 'OPEN_DASHBOARD' };
