import { CoreAppState, HistoryState, OfflineActivity, Pledge, RestrictedSite } from '../types';
import { recordAction, syncHistoryStateRules } from './index';
import { cleanDomain } from '../blocking/rules';

// 1. Add website to restriction list
export function addRestrictedSite(
  history: HistoryState,
  domain: string,
  category: RestrictedSite['category'] = 'custom'
): HistoryState {
  const cleaned = cleanDomain(domain);
  if (!cleaned) return history;

  // Prevent duplicates
  const exists = history.present.restrictedSites.some(s => cleanDomain(s.domain) === cleaned);
  if (exists) return history;

  const newSite: RestrictedSite = {
    id: `site_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    domain: cleaned,
    enabled: true,
    category,
    blockedCount: 0,
    addedAt: Date.now(),
  };

  const newPresent: CoreAppState = {
    ...history.present,
    restrictedSites: [...history.present.restrictedSites, newSite],
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}

// 2. Remove website from restriction list
export function removeRestrictedSite(history: HistoryState, siteId: string): HistoryState {
  const newPresent: CoreAppState = {
    ...history.present,
    restrictedSites: history.present.restrictedSites.filter(s => s.id !== siteId),
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}

// 3. Toggle restriction site status
export function toggleRestrictedSite(history: HistoryState, siteId: string): HistoryState {
  const newPresent: CoreAppState = {
    ...history.present,
    restrictedSites: history.present.restrictedSites.map(s =>
      s.id === siteId ? { ...s, enabled: !s.enabled } : s
    ),
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}

// 4. Create a pledge
export function createPledge(
  history: HistoryState,
  pledge: Omit<Pledge, 'id' | 'createdAt'>
): HistoryState {
  const newPledge: Pledge = {
    ...pledge,
    id: `pledge_${Date.now()}`,
    createdAt: Date.now(),
  };

  const newPresent: CoreAppState = {
    ...history.present,
    pledges: [newPledge, ...history.present.pledges],
  };

  return recordAction(history, newPresent);
}

// 5. Edit a pledge
export function editPledge(
  history: HistoryState,
  pledgeId: string,
  updates: Partial<Pledge>
): HistoryState {
  const newPresent: CoreAppState = {
    ...history.present,
    pledges: history.present.pledges.map(p =>
      p.id === pledgeId ? { ...p, ...updates } : p
    ),
  };

  return recordAction(history, newPresent);
}

// 6. Change daily goal
export function changeDailyGoal(history: HistoryState, minutes: number): HistoryState {
  if (minutes <= 0) return history;

  const newPresent: CoreAppState = {
    ...history.present,
    dailyGoalMinutes: minutes,
  };

  return recordAction(history, newPresent);
}

// 7. Add a planned activity
export function addPlannedActivity(
  history: HistoryState,
  activity: Omit<OfflineActivity, 'id' | 'createdAt'>
): HistoryState {
  const newActivity: OfflineActivity = {
    ...activity,
    id: `act_${Date.now()}`,
    createdAt: Date.now(),
  };

  const newPresent: CoreAppState = {
    ...history.present,
    activities: [newActivity, ...history.present.activities],
  };

  return recordAction(history, newPresent);
}

// 8. Complete or Untick a planned activity (toggle completion)
export function completePlannedActivity(history: HistoryState, activityId: string): HistoryState {
  const newPresent: CoreAppState = {
    ...history.present,
    activities: history.present.activities.map(a => {
      if (a.id === activityId) {
        const nextCompleted = !a.completed;
        return {
          ...a,
          completed: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
      }
      return a;
    }),
  };

  return recordAction(history, newPresent);
}

// 9. Remove a planned activity
export function removePlannedActivity(history: HistoryState, activityId: string): HistoryState {
  const newPresent: CoreAppState = {
    ...history.present,
    activities: history.present.activities.filter(a => a.id !== activityId),
  };

  return recordAction(history, newPresent);
}
