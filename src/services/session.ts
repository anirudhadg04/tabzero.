import { CoreAppState, DetoxSession, HistoryState } from '../types';
import { recordAction, syncHistoryStateRules } from '../history';

export function calculateRemainingSeconds(session: DetoxSession | null): number {
  if (!session) return 0;
  if (session.status === 'paused') {
    return Math.max(0, Math.round(session.pausedRemainingMs / 1000));
  }
  if (session.status === 'active') {
    if (session.isIndefinite) {
      // Returns elapsed seconds for indefinite manual mode
      return Math.round((Date.now() - session.startTime) / 1000);
    }
    const diff = session.endTime - Date.now();
    return Math.max(0, Math.round(diff / 1000));
  }
  return 0;
}

export function formatTimeRemaining(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function startDetoxSession(
  history: HistoryState,
  durationInput: { totalSeconds?: number; durationMinutes?: number; isIndefinite?: boolean },
  selectedDomains?: string[]
): HistoryState {
  const now = Date.now();
  const isIndefinite = !!durationInput.isIndefinite;
  let totalSeconds = 30 * 60; // default 30 mins

  if (!isIndefinite) {
    if (durationInput.totalSeconds !== undefined && durationInput.totalSeconds > 0) {
      totalSeconds = durationInput.totalSeconds;
    } else if (durationInput.durationMinutes !== undefined && durationInput.durationMinutes > 0) {
      totalSeconds = Math.round(durationInput.durationMinutes * 60);
    }
  } else {
    totalSeconds = 0;
  }

  const durationMs = isIndefinite ? 86400000 * 365 : totalSeconds * 1000;
  const durationMinutes = isIndefinite ? 0 : Math.max(1, Math.round(totalSeconds / 60));
  const domains = selectedDomains || history.present.restrictedSites.filter(s => s.enabled).map(s => s.domain);

  const newSession: DetoxSession = {
    id: `session_${now}`,
    durationMinutes,
    durationSeconds: totalSeconds,
    isIndefinite,
    startTime: now,
    endTime: now + durationMs,
    status: 'active',
    pausedRemainingMs: 0,
    selectedDomains: domains,
  };

  const newPresent: CoreAppState = {
    ...history.present,
    activeSession: newSession,
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}

export function pauseDetoxSession(history: HistoryState): HistoryState {
  const session = history.present.activeSession;
  if (!session || session.status !== 'active') return history;

  const remainingMs = session.isIndefinite ? 0 : Math.max(0, session.endTime - Date.now());

  const updatedSession: DetoxSession = {
    ...session,
    status: 'paused',
    pausedRemainingMs: remainingMs,
  };

  const newPresent: CoreAppState = {
    ...history.present,
    activeSession: updatedSession,
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}

export function resumeDetoxSession(history: HistoryState): HistoryState {
  const session = history.present.activeSession;
  if (!session || session.status !== 'paused') return history;

  const now = Date.now();
  const remainingMs = session.pausedRemainingMs;

  const updatedSession: DetoxSession = {
    ...session,
    status: 'active',
    startTime: now,
    endTime: session.isIndefinite ? now + 86400000 * 365 : now + remainingMs,
    pausedRemainingMs: 0,
  };

  const newPresent: CoreAppState = {
    ...history.present,
    activeSession: updatedSession,
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}

export function completeDetoxSession(history: HistoryState): HistoryState {
  const session = history.present.activeSession;
  if (!session) return history;

  const elapsedMins = Math.max(1, Math.round((Date.now() - session.startTime) / (60 * 1000)));

  const completedSession: DetoxSession = {
    ...session,
    durationMinutes: session.isIndefinite ? elapsedMins : session.durationMinutes,
    status: 'completed',
    completedAt: Date.now(),
  };

  const newPresent: CoreAppState = {
    ...history.present,
    activeSession: null,
    completedSessions: [completedSession, ...history.present.completedSessions],
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}

export function cancelDetoxSession(history: HistoryState): HistoryState {
  const session = history.present.activeSession;
  if (!session) return history;

  const cancelledSession: DetoxSession = {
    ...session,
    status: 'cancelled',
    completedAt: Date.now(),
  };

  const newPresent: CoreAppState = {
    ...history.present,
    activeSession: null,
    completedSessions: [cancelledSession, ...history.present.completedSessions],
  };

  const updatedHistory = recordAction(history, newPresent);
  syncHistoryStateRules(updatedHistory);
  return updatedHistory;
}
