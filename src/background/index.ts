import { getStorageData, setStorageData } from '../storage';
import { syncBlockingRules, extractRootDomain, isDomainBlocked } from '../blocking/rules';
import { undo, redo, syncHistoryStateRules } from '../history';
import {
  startDetoxSession,
  pauseDetoxSession,
  resumeDetoxSession,
  completeDetoxSession,
  cancelDetoxSession,
} from '../services/session';
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
import { evaluateAchievements } from '../services/achievements';
import { recordDomainVisit } from '../services/tracker';
import { fetchOpenMeteoWeather, detectLocationWithoutPermission } from '../weather';
import { ExtensionMessage, RestrictedSite } from '../types';

let currentActiveUrl: string = '';
let lastTrackedTimestamp: number = Date.now();
let isBrowserIdle: boolean = false;

/**
 * Scan all currently open browser tabs and redirect any tabs matching restricted domains
 */
async function purgeRestrictedTabs(sites: RestrictedSite[]) {
  if (typeof chrome === 'undefined' || !chrome.tabs) return;
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      if (tab.url.startsWith('chrome-extension://') || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) continue;

      const matchedSite = sites.find(s => s.enabled && isDomainBlocked(tab.url!, s.domain));
      if (matchedSite) {
        const rootDomain = extractRootDomain(matchedSite.domain);
        console.log(`[tabzero Purge] Immediately redirecting active tab ${tab.id} on ${tab.url}`);
        const blockedUrl = chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(rootDomain)}`);
        chrome.tabs.update(tab.id, { url: blockedUrl });
      }
    }
  } catch (e) {
    console.warn('[tabzero ServiceWorker] Tab purge error:', e);
  }
}

/**
 * Scan all open tabs and restore any currently blocked tabs back to their original websites
 */
async function unblockAndRefreshTabs() {
  if (typeof chrome === 'undefined' || !chrome.tabs) return;
  try {
    const data = await getStorageData();
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;
      if (tab.url.includes('blocked.html')) {
        let domain: string | null = null;
        try {
          const parsed = new URL(tab.url);
          domain = parsed.searchParams.get('domain');
        } catch {
          // ignore parse error
        }

        if (!domain && tab.id && data.tabDestinations && data.tabDestinations[tab.id]) {
          domain = data.tabDestinations[tab.id];
        }

        if (!domain && data.lastBlockedDomain) {
          domain = data.lastBlockedDomain;
        }

        if (!domain && data.history.present.restrictedSites.length > 0) {
          domain = data.history.present.restrictedSites[0].domain;
        }

        if (domain) {
          const clean = extractRootDomain(domain);
          const targetUrl = `https://${clean}`;
          console.log(`[tabzero Restore] Restoring blocked tab ${tab.id} to ${targetUrl}`);
          chrome.tabs.update(tab.id, { url: targetUrl });
        } else {
          // If no specific domain found, navigate back in browser history
          chrome.tabs.goBack(tab.id).catch(() => {
            chrome.tabs.update(tab.id!, { url: 'https://google.com' });
          });
        }
      }
    }
  } catch (e) {
    console.warn('[tabzero ServiceWorker] Unblock and refresh error:', e);
  }
}

// 1. Initialize Extension on install or start
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[tabzero ServiceWorker] Extension installed / initialized.');
  const data = await getStorageData();
  const isSessionActive = data.history.present.activeSession?.status === 'active';
  await syncBlockingRules(data.history.present.restrictedSites, isSessionActive);

  if (isSessionActive) {
    await purgeRestrictedTabs(data.history.present.restrictedSites);
  }

  // Set periodic alarms
  chrome.alarms.create('check_session_tick', { periodInMinutes: 0.5 });
  chrome.alarms.create('refresh_weather_alarm', { periodInMinutes: 60 });

  // Initial weather fetch with auto location detection without permissions
  try {
    const loc = await detectLocationWithoutPermission();
    data.userLocation = loc;
    const weather = await fetchOpenMeteoWeather(
      loc.latitude,
      loc.longitude,
      loc.city
    );
    data.weather = weather;
    await setStorageData(data);
  } catch (err) {
    console.warn('[tabzero ServiceWorker] Initial weather fetch failed:', err);
  }
});

// 2. Alarms listener (auto-complete session, weather refresh)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'check_session_tick') {
    const data = await getStorageData();
    const session = data.history.present.activeSession;
    if (session && session.status === 'active' && !session.isIndefinite) {
      const now = Date.now();
      if (now >= session.endTime) {
        console.log('[tabzero ServiceWorker] Active session time reached. Completing session and refreshing blocked tabs.');
        data.history = completeDetoxSession(data.history);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        await unblockAndRefreshTabs();
      }
    }
  } else if (alarm.name === 'refresh_weather_alarm') {
    const data = await getStorageData();
    try {
      const weather = await fetchOpenMeteoWeather(
        data.userLocation.latitude,
        data.userLocation.longitude,
        data.userLocation.city,
        data.weather
      );
      data.weather = weather;
      await setStorageData(data);
    } catch (e) {
      console.warn('[tabzero ServiceWorker] Weather alarm update failed:', e);
    }
  }
});

// 3. Tab and Domain Tracking
async function commitTrackedTime() {
  if (!currentActiveUrl || isBrowserIdle) return;
  const now = Date.now();
  const elapsedSeconds = Math.max(0, (now - lastTrackedTimestamp) / 1000);
  lastTrackedTimestamp = now;

  if (elapsedSeconds > 1 && elapsedSeconds < 3600) {
    const data = await getStorageData();
    data.usage = recordDomainVisit(data.usage, currentActiveUrl, elapsedSeconds);
    await setStorageData(data);
  }
}

// 4. WebNavigation Early Interceptor (catches navigation before DOM begins loading)
if (chrome.webNavigation && chrome.webNavigation.onBeforeNavigate) {
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return; // Only main frame
    if (!details.url) return;
    if (details.url.startsWith('chrome-extension://') || details.url.startsWith('chrome://') || details.url.startsWith('about:')) return;

    const data = await getStorageData();
    const session = data.history.present.activeSession;
    if (!session || session.status !== 'active') return;

    const matchedSite = data.history.present.restrictedSites.find(
      s => s.enabled && isDomainBlocked(details.url, s.domain)
    );

    if (matchedSite) {
      const rootDomain = extractRootDomain(matchedSite.domain);
      console.log(`[tabzero webNavigation] Intercepted navigation to restricted domain: ${rootDomain} (URL: ${details.url})`);

      matchedSite.blockedCount += 1;
      data.history.present.blockedAttemptsTotal += 1;
      data.tabDestinations = { ...(data.tabDestinations || {}), [details.tabId]: rootDomain };
      data.lastBlockedDomain = rootDomain;
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      await setStorageData(data);

      const blockedUrl = chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(rootDomain)}`);
      chrome.tabs.update(details.tabId, { url: blockedUrl });
    }
  });
}

// 5. Tabs Listeners for Tracking and Navigation Verification
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await commitTrackedTime();
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      currentActiveUrl = tab.url;
      lastTrackedTimestamp = Date.now();
      checkRestrictedNavigation(tab.url, tab.id);
    }
  } catch {
    // Tab might have been closed immediately
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    await commitTrackedTime();
    currentActiveUrl = changeInfo.url;
    lastTrackedTimestamp = Date.now();
    checkRestrictedNavigation(changeInfo.url, tabId);

    // If redirected by declarativeNetRequest to blocked.html without domain param, enrich with domain
    if (changeInfo.url.includes('blocked.html') && !changeInfo.url.includes('?domain=')) {
      const data = await getStorageData();
      const domain = data.tabDestinations?.[tabId] || data.lastBlockedDomain || data.history.present.restrictedSites[0]?.domain;
      if (domain) {
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(extractRootDomain(domain))}`)
        });
      }
    }
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await commitTrackedTime();
    isBrowserIdle = true;
  } else {
    isBrowserIdle = false;
    lastTrackedTimestamp = Date.now();
  }
});

if (chrome.idle) {
  chrome.idle.onStateChanged.addListener(async (state) => {
    if (state === 'idle' || state === 'locked') {
      await commitTrackedTime();
      isBrowserIdle = true;
    } else if (state === 'active') {
      isBrowserIdle = false;
      lastTrackedTimestamp = Date.now();
    }
  });
}

// Check and handle restricted navigation during active session
async function checkRestrictedNavigation(url: string, tabId?: number) {
  if (!url) return;
  if (url.startsWith('chrome-extension://') || url.startsWith('chrome://') || url.startsWith('about:')) return;

  const data = await getStorageData();
  const session = data.history.present.activeSession;
  if (!session || session.status !== 'active') return;

  const matchedSite = data.history.present.restrictedSites.find(
    s => s.enabled && isDomainBlocked(url, s.domain)
  );

  if (matchedSite) {
    const rootDomain = extractRootDomain(matchedSite.domain);
    console.log(`[tabzero ServiceWorker] Tab check: restricted domain visited: ${rootDomain}`);

    matchedSite.blockedCount += 1;
    data.history.present.blockedAttemptsTotal += 1;
    data.achievements = evaluateAchievements(data.achievements, data.history.present);
    await setStorageData(data);

    if (tabId) {
      const blockedUrl = chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(rootDomain)}`);
      chrome.tabs.update(tabId, { url: blockedUrl });
    }
  }
}

// 6. Runtime Message Dispatcher
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  (async () => {
    const data = await getStorageData();

    switch (message.type) {
      case 'GET_STATE': {
        sendResponse({ success: true, data });
        break;
      }

      case 'OPEN_DASHBOARD': {
        const dashboardUrl = chrome.runtime.getURL('dashboard.html');
        chrome.tabs.create({ url: dashboardUrl });
        sendResponse({ success: true });
        break;
      }

      case 'TRIGGER_UNDO': {
        data.history = undo(data.history);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await syncHistoryStateRules(data.history);
        if (data.history.present.activeSession?.status === 'active') {
          await purgeRestrictedTabs(data.history.present.restrictedSites);
        } else {
          await unblockAndRefreshTabs();
        }
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'TRIGGER_REDO': {
        data.history = redo(data.history);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await syncHistoryStateRules(data.history);
        if (data.history.present.activeSession?.status === 'active') {
          await purgeRestrictedTabs(data.history.present.restrictedSites);
        } else {
          await unblockAndRefreshTabs();
        }
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'SESSION_START': {
        data.history = startDetoxSession(data.history, {
          totalSeconds: message.durationSeconds,
          durationMinutes: message.durationMinutes,
          isIndefinite: message.isIndefinite,
        }, message.domains);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        // Purge currently open tabs immediately!
        await purgeRestrictedTabs(data.history.present.restrictedSites);
        sendResponse({ success: true, data });
        break;
      }

      case 'TOGGLE_SHIELD': {
        const isCurrentlyActive = data.history.present.activeSession?.status === 'active';
        const shouldEnable = message.enabled !== undefined ? message.enabled : !isCurrentlyActive;

        if (shouldEnable) {
          data.history = startDetoxSession(data.history, { isIndefinite: true });
          data.achievements = evaluateAchievements(data.achievements, data.history.present);
          await setStorageData(data);
          await purgeRestrictedTabs(data.history.present.restrictedSites);
        } else {
          data.history = cancelDetoxSession(data.history);
          data.achievements = evaluateAchievements(data.achievements, data.history.present);
          await setStorageData(data);
          await unblockAndRefreshTabs();
        }
        sendResponse({ success: true, data });
        break;
      }

      case 'SESSION_PAUSE': {
        data.history = pauseDetoxSession(data.history);
        await setStorageData(data);
        await unblockAndRefreshTabs();
        sendResponse({ success: true, data });
        break;
      }

      case 'SESSION_RESUME': {
        data.history = resumeDetoxSession(data.history);
        await setStorageData(data);
        await purgeRestrictedTabs(data.history.present.restrictedSites);
        sendResponse({ success: true, data });
        break;
      }

      case 'SESSION_COMPLETE': {
        data.history = completeDetoxSession(data.history);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        await unblockAndRefreshTabs();
        sendResponse({ success: true, data });
        break;
      }

      case 'SESSION_CANCEL': {
        data.history = cancelDetoxSession(data.history);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        await unblockAndRefreshTabs();
        sendResponse({ success: true, data });
        break;
      }

      case 'ADD_SITE': {
        data.history = addRestrictedSite(data.history, message.domain, message.category);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        if (data.history.present.activeSession?.status === 'active') {
          await purgeRestrictedTabs(data.history.present.restrictedSites);
        }
        sendResponse({ success: true, data });
        break;
      }

      case 'REMOVE_SITE': {
        data.history = removeRestrictedSite(data.history, message.id);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'TOGGLE_SITE': {
        data.history = toggleRestrictedSite(data.history, message.id);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        if (data.history.present.activeSession?.status === 'active') {
          await purgeRestrictedTabs(data.history.present.restrictedSites);
        }
        sendResponse({ success: true, data });
        break;
      }

      case 'INCREMENT_BLOCKED_COUNT': {
        data.history.present.blockedAttemptsTotal += 1;
        const targetSite = data.history.present.restrictedSites.find(
          s => extractRootDomain(s.domain) === extractRootDomain(message.domain)
        );
        if (targetSite) {
          targetSite.blockedCount += 1;
        }
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'SET_DAILY_GOAL': {
        data.history = changeDailyGoal(data.history, message.minutes);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'CREATE_PLEDGE': {
        data.history = createPledge(data.history, message.pledge);
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'EDIT_PLEDGE': {
        data.history = editPledge(data.history, message.id, message.updates);
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'ADD_ACTIVITY': {
        data.history = addPlannedActivity(data.history, message.activity);
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'COMPLETE_ACTIVITY': {
        data.history = completePlannedActivity(data.history, message.id);
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'REFRESH_WEATHER': {
        try {
          const loc = await detectLocationWithoutPermission();
          data.userLocation = loc;
          const weather = await fetchOpenMeteoWeather(
            loc.latitude,
            loc.longitude,
            loc.city
          );
          data.weather = weather;
          await setStorageData(data);
          sendResponse({ success: true, data });
        } catch (e: any) {
          sendResponse({ success: false, error: e.message, data });
        }
        break;
      }

      case 'SET_THEME': {
        data.themePreference = message.theme;
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      case 'RECORD_BLOCKED_TAB': {
        data.tabDestinations = { ...(data.tabDestinations || {}), [message.tabId]: message.domain };
        data.lastBlockedDomain = message.domain;
        await setStorageData(data);
        sendResponse({ success: true, data });
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  })();

  return true;
});
