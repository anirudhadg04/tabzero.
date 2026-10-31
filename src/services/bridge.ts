import { ExtensionMessage, OfflineStorageSchema } from '../types';
import { getStorageData, setStorageData, subscribeToStorage } from '../storage';
import { undo, redo, syncHistoryStateRules } from '../history';
import {
  startDetoxSession,
  pauseDetoxSession,
  resumeDetoxSession,
  completeDetoxSession,
  cancelDetoxSession,
} from './session';
import {
  addRestrictedSite,
  removeRestrictedSite,
  toggleRestrictedSite,
  createPledge,
  editPledge,
  changeDailyGoal,
  addPlannedActivity,
  completePlannedActivity,
} from '../history/actions';
import { evaluateAchievements } from './achievements';

/**
 * Dispatch message to Chrome background worker or fallback locally
 */
export async function sendExtensionMessage(message: ExtensionMessage): Promise<OfflineStorageSchema> {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[tabzero Bridge] Runtime message fallback:', chrome.runtime.lastError.message);
          handleLocalFallback(message).then(resolve);
        } else if (response && response.data) {
          resolve(response.data);
        } else {
          getStorageData().then(resolve);
        }
      });
    });
  } else {
    return handleLocalFallback(message);
  }
}

/**
 * Standalone Local Fallback when testing in dev server / regular browser tab
 */
async function handleLocalFallback(message: ExtensionMessage): Promise<OfflineStorageSchema> {
  const data = await getStorageData();

  switch (message.type) {
    case 'TRIGGER_UNDO':
      data.history = undo(data.history);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      await syncHistoryStateRules(data.history);
      break;

    case 'TRIGGER_REDO':
      data.history = redo(data.history);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      await syncHistoryStateRules(data.history);
      break;

    case 'SESSION_START':
      data.history = startDetoxSession(data.history, {
        totalSeconds: message.durationSeconds,
        durationMinutes: message.durationMinutes,
      }, message.domains);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'SESSION_PAUSE':
      data.history = pauseDetoxSession(data.history);
      break;

    case 'SESSION_RESUME':
      data.history = resumeDetoxSession(data.history);
      break;

    case 'SESSION_COMPLETE':
      data.history = completeDetoxSession(data.history);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'SESSION_CANCEL':
      data.history = cancelDetoxSession(data.history);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'ADD_SITE':
      data.history = addRestrictedSite(data.history, message.domain, message.category);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'REMOVE_SITE':
      data.history = removeRestrictedSite(data.history, message.id);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'TOGGLE_SITE':
      data.history = toggleRestrictedSite(data.history, message.id);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'SET_DAILY_GOAL':
      data.history = changeDailyGoal(data.history, message.minutes);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'CREATE_PLEDGE':
      data.history = createPledge(data.history, message.pledge);
      break;

    case 'EDIT_PLEDGE':
      data.history = editPledge(data.history, message.id, message.updates);
      break;

    case 'ADD_ACTIVITY':
      data.history = addPlannedActivity(data.history, message.activity);
      break;

    case 'COMPLETE_ACTIVITY':
      data.history = completePlannedActivity(data.history, message.id);
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      break;

    case 'OPEN_DASHBOARD':
      if (typeof window !== 'undefined') {
        window.open('dashboard.html', '_blank');
      }
      break;
  }

  await setStorageData(data);
  return data;
}

export { subscribeToStorage };
