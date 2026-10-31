import { CoreAppState, HistoryState } from '../types';
import { syncBlockingRules } from '../blocking/rules';

const MAX_HISTORY_STEPS = 5;

function cloneState(state: CoreAppState): CoreAppState {
  return JSON.parse(JSON.stringify(state));
}

export function canUndo(history: HistoryState): boolean {
  return history.past.length > 0;
}

export function canRedo(history: HistoryState): boolean {
  return history.future.length > 0;
}

/**
 * Execute an eligible state change action.
 * Records the current present into `past` (capped at MAX_HISTORY_STEPS=5).
 * Clears `future` (Redo branch is invalidated on new action).
 * Sets `present` to `newPresent`.
 */
export function recordAction(history: HistoryState, newPresent: CoreAppState): HistoryState {
  const past = [...history.past, cloneState(history.present)];
  // Enforce max 5 steps in past history
  if (past.length > MAX_HISTORY_STEPS) {
    past.splice(0, past.length - MAX_HISTORY_STEPS);
  }

  return {
    past,
    present: cloneState(newPresent),
    future: [], // New action clears redo
  };
}

/**
 * Undo the previous action:
 * Pops the last state from `past` and sets it as `present`.
 * Pushes the current `present` onto `future` (capped at 5).
 */
export function undo(history: HistoryState): HistoryState {
  if (history.past.length === 0) {
    return history;
  }

  const past = [...history.past];
  const previousState = past.pop()!;
  
  const future = [cloneState(history.present), ...history.future];
  if (future.length > MAX_HISTORY_STEPS) {
    future.splice(MAX_HISTORY_STEPS);
  }

  return {
    past,
    present: previousState,
    future,
  };
}

/**
 * Redo the undone action:
 * Pops the first state from `future` and sets it as `present`.
 * Pushes current `present` onto `past` (capped at 5).
 */
export function redo(history: HistoryState): HistoryState {
  if (history.future.length === 0) {
    return history;
  }

  const future = [...history.future];
  const nextState = future.shift()!;

  const past = [...history.past, cloneState(history.present)];
  if (past.length > MAX_HISTORY_STEPS) {
    past.splice(0, past.length - MAX_HISTORY_STEPS);
  }

  return {
    past,
    present: nextState,
    future,
  };
}

/**
 * Synchronizes browser blocking rules based on the active state
 */
export async function syncHistoryStateRules(history: HistoryState): Promise<void> {
  const isSessionActive = history.present.activeSession?.status === 'active';
  await syncBlockingRules(history.present.restrictedSites, isSessionActive);
}
