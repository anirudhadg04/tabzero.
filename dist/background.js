"use strict";
(() => {
  // src/storage/defaults.ts
  var DEFAULT_RESTRICTED_SITES = [
    { id: "site_1", domain: "instagram.com", enabled: true, category: "social", blockedCount: 0, addedAt: Date.now() },
    { id: "site_2", domain: "youtube.com", enabled: true, category: "entertainment", blockedCount: 0, addedAt: Date.now() },
    { id: "site_3", domain: "x.com", enabled: true, category: "social", blockedCount: 0, addedAt: Date.now() },
    { id: "site_4", domain: "reddit.com", enabled: true, category: "forums", blockedCount: 0, addedAt: Date.now() },
    { id: "site_5", domain: "tiktok.com", enabled: true, category: "social", blockedCount: 0, addedAt: Date.now() },
    { id: "site_6", domain: "facebook.com", enabled: true, category: "social", blockedCount: 0, addedAt: Date.now() },
    { id: "site_7", domain: "netflix.com", enabled: true, category: "entertainment", blockedCount: 0, addedAt: Date.now() },
    { id: "site_8", domain: "twitch.tv", enabled: true, category: "entertainment", blockedCount: 0, addedAt: Date.now() }
  ];
  var DEFAULT_CORE_STATE = {
    restrictedSites: DEFAULT_RESTRICTED_SITES,
    activeSession: null,
    completedSessions: [],
    dailyGoalMinutes: 60,
    pledges: [
      { id: "p_1", title: "Screen-free morning routine", targetMinutes: 30, isActive: true, createdAt: Date.now() - 864e5 },
      { id: "p_2", title: "Deep focus without social feeds", targetMinutes: 60, isActive: true, createdAt: Date.now() - 432e5 },
      { id: "p_3", title: "Evening outdoor unwind", targetMinutes: 45, isActive: true, createdAt: Date.now() - 216e5 }
    ],
    activities: [],
    blockedAttemptsTotal: 0
  };
  var DEFAULT_ACHIEVEMENTS = [
    { id: "first_disconnect", name: "First Disconnect", description: "Complete your first digital detox session", unlocked: false, progress: 0, icon: "Zap" },
    { id: "reset_30", name: "30-Minute Reset", description: "Reach 30 minutes of total offline focus time", unlocked: false, progress: 0, icon: "Clock" },
    { id: "one_hour_free", name: "One Hour Free", description: "Accumulate 60 minutes away from screens", unlocked: false, progress: 0, icon: "ShieldCheck" },
    { id: "deep_focus", name: "Deep Focus", description: "Complete a single 2-hour detox session", unlocked: false, progress: 0, icon: "Flame" },
    { id: "scroll_breaker", name: "Scroll Breaker", description: "Successfully deflect a restricted site during a session", unlocked: false, progress: 0, icon: "Ban" },
    { id: "consistency", name: "Consistency Master", description: "Achieve your daily offline goal", unlocked: false, progress: 0, icon: "Award" }
  ];
  var DEFAULT_HISTORY_STATE = {
    past: [],
    present: DEFAULT_CORE_STATE,
    future: []
  };
  var INITIAL_STORAGE = {
    history: DEFAULT_HISTORY_STATE,
    usage: {},
    weather: null,
    achievements: DEFAULT_ACHIEVEMENTS,
    userLocation: {
      city: "Bangalore, IN",
      latitude: 12.9716,
      longitude: 77.5946
    },
    lastActiveTimestamp: Date.now(),
    trackingActive: true,
    themePreference: "light",
    lastBlockedDomain: "",
    tabDestinations: {}
  };

  // src/services/browserApi.ts
  function getExtensionAPI() {
    if (typeof globalThis !== "undefined" && globalThis.browser?.runtime) {
      return globalThis.browser;
    }
    if (typeof chrome !== "undefined" && chrome?.runtime) {
      return chrome;
    }
    if (typeof window !== "undefined" && window.browser?.runtime) {
      return window.browser;
    }
    return null;
  }
  var extensionApi = getExtensionAPI();

  // src/storage/index.ts
  var STORAGE_KEY = "tabzero_extension_data";
  var LEGACY_STORAGE_KEY = "offline_extension_data";
  async function getStorageData() {
    const api = getExtensionAPI();
    if (api && api.storage && api.storage.local) {
      try {
        const result = await api.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
        if (result && result[STORAGE_KEY]) {
          return result[STORAGE_KEY];
        } else if (result && result[LEGACY_STORAGE_KEY]) {
          const migrated = result[LEGACY_STORAGE_KEY];
          await setStorageData(migrated);
          return migrated;
        } else {
          await setStorageData(INITIAL_STORAGE);
          return INITIAL_STORAGE;
        }
      } catch {
        return new Promise((resolve) => {
          try {
            api.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY], (result) => {
              if (api.runtime?.lastError) {
                console.warn("[tabzero Storage] Error reading storage:", api.runtime.lastError);
                resolve(INITIAL_STORAGE);
                return;
              }
              if (result && result[STORAGE_KEY]) {
                resolve(result[STORAGE_KEY]);
              } else if (result && result[LEGACY_STORAGE_KEY]) {
                const migrated = result[LEGACY_STORAGE_KEY];
                setStorageData(migrated);
                resolve(migrated);
              } else {
                setStorageData(INITIAL_STORAGE).then(() => resolve(INITIAL_STORAGE));
              }
            });
          } catch {
            resolve(INITIAL_STORAGE);
          }
        });
      }
    }
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STORAGE));
      }
      return INITIAL_STORAGE;
    } catch {
      return INITIAL_STORAGE;
    }
  }
  async function setStorageData(data) {
    const api = getExtensionAPI();
    if (api && api.storage && api.storage.local) {
      try {
        await api.storage.local.set({ [STORAGE_KEY]: data });
        return;
      } catch {
        return new Promise((resolve, reject) => {
          try {
            api.storage.local.set({ [STORAGE_KEY]: data }, () => {
              if (api.runtime?.lastError) {
                reject(api.runtime.lastError);
              } else {
                resolve();
              }
            });
          } catch (e) {
            reject(e);
          }
        });
      }
    }
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("tabzero_storage_updated", { detail: data }));
        }
      }
    } catch (e) {
      console.error("[tabzero Storage] LocalStorage write error:", e);
    }
  }

  // src/blocking/rules.ts
  var BASE_RULE_ID = 1e3;
  function isInternalBrowserUrl(url) {
    if (!url) return true;
    const lower = url.trim().toLowerCase();
    return lower.startsWith("chrome-extension://") || lower.startsWith("moz-extension://") || lower.startsWith("safari-web-extension://") || lower.startsWith("safari-extension://") || lower.startsWith("chrome://") || lower.startsWith("edge://") || lower.startsWith("brave://") || lower.startsWith("opera://") || lower.startsWith("vivaldi://") || lower.startsWith("about:") || lower.startsWith("safari:") || lower.startsWith("view-source:") || lower.startsWith("data:") || lower.startsWith("blob:") || lower.startsWith("devtools://");
  }
  function extractRootDomain(domain) {
    if (!domain) return "";
    let cleaned = domain.trim().toLowerCase();
    cleaned = cleaned.replace(/^[a-zA-Z]+:\/\//, "");
    cleaned = cleaned.split("/")[0].split("?")[0].split("#")[0];
    cleaned = cleaned.split(":")[0];
    cleaned = cleaned.replace(/^www\d*\./, "");
    return cleaned;
  }
  function cleanDomain(domain) {
    return extractRootDomain(domain);
  }
  function isDomainBlocked(targetUrlOrHostname, siteDomain) {
    if (!targetUrlOrHostname || !siteDomain) return false;
    let host = targetUrlOrHostname.trim().toLowerCase();
    try {
      if (host.includes("://")) {
        host = new URL(host).hostname.toLowerCase();
      }
    } catch {
    }
    host = host.split("/")[0].split("?")[0].split(":")[0];
    const rootRestricted = extractRootDomain(siteDomain);
    if (!rootRestricted) return false;
    if (host === rootRestricted) return true;
    if (host.endsWith("." + rootRestricted)) return true;
    return false;
  }
  async function syncBlockingRules(sites, isSessionActive) {
    const api = getExtensionAPI();
    const dnr = api?.declarativeNetRequest;
    if (!dnr || typeof dnr.updateDynamicRules !== "function") {
      console.log("[tabzero Rules] declarativeNetRequest not available in this environment (standalone/unsupported mode).");
      return;
    }
    try {
      const existingRules = await dnr.getDynamicRules();
      const existingRuleIds = (existingRules || []).map((r) => r.id);
      if (!isSessionActive) {
        if (existingRuleIds.length > 0) {
          await dnr.updateDynamicRules({
            removeRuleIds: existingRuleIds,
            addRules: []
          });
          console.log(`[tabzero Rules] Detox inactive: Removed ${existingRuleIds.length} dynamic blocking rules.`);
        }
        return;
      }
      const enabledSites = sites.filter((s) => s.enabled);
      const newRules = [];
      let ruleCounter = 0;
      const actionRedirect = dnr.RuleActionType?.REDIRECT || "redirect";
      const resourceMainFrame = dnr.ResourceType?.MAIN_FRAME || "main_frame";
      enabledSites.forEach((site) => {
        const rootDomain = extractRootDomain(site.domain);
        if (!rootDomain) return;
        const ruleId = BASE_RULE_ID + ++ruleCounter;
        newRules.push({
          id: ruleId,
          priority: 1,
          action: {
            type: actionRedirect,
            redirect: {
              // NOTE: extensionPath MUST NOT contain query params '?' or '#' per MV3 specifications
              extensionPath: "/blocked.html"
            }
          },
          condition: {
            urlFilter: `||${rootDomain}`,
            resourceTypes: [resourceMainFrame]
          }
        });
      });
      await dnr.updateDynamicRules({
        removeRuleIds: existingRuleIds,
        addRules: newRules
      });
      console.log(`[tabzero Rules] Detox ACTIVE: Successfully installed ${newRules.length} dynamic declarativeNetRequest rules.`);
    } catch (error) {
      console.error("[tabzero Rules] Error updating dynamic rules:", error);
    }
  }

  // src/history/index.ts
  var MAX_HISTORY_STEPS = 5;
  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }
  function recordAction(history, newPresent) {
    const past = [...history.past, cloneState(history.present)];
    if (past.length > MAX_HISTORY_STEPS) {
      past.splice(0, past.length - MAX_HISTORY_STEPS);
    }
    return {
      past,
      present: cloneState(newPresent),
      future: []
      // New action clears redo
    };
  }
  function undo(history) {
    if (history.past.length === 0) {
      return history;
    }
    const past = [...history.past];
    const previousState = past.pop();
    const future = [cloneState(history.present), ...history.future];
    if (future.length > MAX_HISTORY_STEPS) {
      future.splice(MAX_HISTORY_STEPS);
    }
    return {
      past,
      present: previousState,
      future
    };
  }
  function redo(history) {
    if (history.future.length === 0) {
      return history;
    }
    const future = [...history.future];
    const nextState = future.shift();
    const past = [...history.past, cloneState(history.present)];
    if (past.length > MAX_HISTORY_STEPS) {
      past.splice(0, past.length - MAX_HISTORY_STEPS);
    }
    return {
      past,
      present: nextState,
      future
    };
  }
  async function syncHistoryStateRules(history) {
    const isSessionActive = history.present.activeSession?.status === "active";
    await syncBlockingRules(history.present.restrictedSites, isSessionActive);
  }

  // src/services/session.ts
  function startDetoxSession(history, durationInput, selectedDomains) {
    const now = Date.now();
    const isIndefinite = !!durationInput.isIndefinite;
    let totalSeconds = 30 * 60;
    if (!isIndefinite) {
      if (durationInput.totalSeconds !== void 0 && durationInput.totalSeconds > 0) {
        totalSeconds = durationInput.totalSeconds;
      } else if (durationInput.durationMinutes !== void 0 && durationInput.durationMinutes > 0) {
        totalSeconds = Math.round(durationInput.durationMinutes * 60);
      }
    } else {
      totalSeconds = 0;
    }
    const durationMs = isIndefinite ? 864e5 * 365 : totalSeconds * 1e3;
    const durationMinutes = isIndefinite ? 0 : Math.max(1, Math.round(totalSeconds / 60));
    const domains = selectedDomains || history.present.restrictedSites.filter((s) => s.enabled).map((s) => s.domain);
    const newSession = {
      id: `session_${now}`,
      durationMinutes,
      durationSeconds: totalSeconds,
      isIndefinite,
      startTime: now,
      endTime: now + durationMs,
      status: "active",
      pausedRemainingMs: 0,
      selectedDomains: domains
    };
    const newPresent = {
      ...history.present,
      activeSession: newSession
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }
  function pauseDetoxSession(history) {
    const session = history.present.activeSession;
    if (!session || session.status !== "active") return history;
    const remainingMs = session.isIndefinite ? 0 : Math.max(0, session.endTime - Date.now());
    const updatedSession = {
      ...session,
      status: "paused",
      pausedRemainingMs: remainingMs
    };
    const newPresent = {
      ...history.present,
      activeSession: updatedSession
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }
  function resumeDetoxSession(history) {
    const session = history.present.activeSession;
    if (!session || session.status !== "paused") return history;
    const now = Date.now();
    const remainingMs = session.pausedRemainingMs;
    const updatedSession = {
      ...session,
      status: "active",
      startTime: now,
      endTime: session.isIndefinite ? now + 864e5 * 365 : now + remainingMs,
      pausedRemainingMs: 0
    };
    const newPresent = {
      ...history.present,
      activeSession: updatedSession
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }
  function completeDetoxSession(history) {
    const session = history.present.activeSession;
    if (!session) return history;
    const elapsedMins = Math.max(1, Math.round((Date.now() - session.startTime) / (60 * 1e3)));
    const completedSession = {
      ...session,
      durationMinutes: session.isIndefinite ? elapsedMins : session.durationMinutes,
      status: "completed",
      completedAt: Date.now()
    };
    const newPresent = {
      ...history.present,
      activeSession: null,
      completedSessions: [completedSession, ...history.present.completedSessions]
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }
  function cancelDetoxSession(history) {
    const session = history.present.activeSession;
    if (!session) return history;
    const cancelledSession = {
      ...session,
      status: "cancelled",
      completedAt: Date.now()
    };
    const newPresent = {
      ...history.present,
      activeSession: null,
      completedSessions: [cancelledSession, ...history.present.completedSessions]
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }

  // src/history/actions.ts
  function addRestrictedSite(history, domain, category = "custom") {
    const cleaned = cleanDomain(domain);
    if (!cleaned) return history;
    const exists = history.present.restrictedSites.some((s) => cleanDomain(s.domain) === cleaned);
    if (exists) return history;
    const newSite = {
      id: `site_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      domain: cleaned,
      enabled: true,
      category,
      blockedCount: 0,
      addedAt: Date.now()
    };
    const newPresent = {
      ...history.present,
      restrictedSites: [...history.present.restrictedSites, newSite]
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }
  function removeRestrictedSite(history, siteId) {
    const newPresent = {
      ...history.present,
      restrictedSites: history.present.restrictedSites.filter((s) => s.id !== siteId)
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }
  function toggleRestrictedSite(history, siteId) {
    const newPresent = {
      ...history.present,
      restrictedSites: history.present.restrictedSites.map(
        (s) => s.id === siteId ? { ...s, enabled: !s.enabled } : s
      )
    };
    const updatedHistory = recordAction(history, newPresent);
    syncHistoryStateRules(updatedHistory);
    return updatedHistory;
  }
  function createPledge(history, pledge) {
    const newPledge = {
      ...pledge,
      id: `pledge_${Date.now()}`,
      createdAt: Date.now()
    };
    const newPresent = {
      ...history.present,
      pledges: [newPledge, ...history.present.pledges]
    };
    return recordAction(history, newPresent);
  }
  function editPledge(history, pledgeId, updates) {
    const newPresent = {
      ...history.present,
      pledges: history.present.pledges.map(
        (p) => p.id === pledgeId ? { ...p, ...updates } : p
      )
    };
    return recordAction(history, newPresent);
  }
  function changeDailyGoal(history, minutes) {
    if (minutes <= 0) return history;
    const newPresent = {
      ...history.present,
      dailyGoalMinutes: minutes
    };
    return recordAction(history, newPresent);
  }
  function addPlannedActivity(history, activity) {
    const newActivity = {
      ...activity,
      id: `act_${Date.now()}`,
      createdAt: Date.now()
    };
    const newPresent = {
      ...history.present,
      activities: [newActivity, ...history.present.activities]
    };
    return recordAction(history, newPresent);
  }
  function completePlannedActivity(history, activityId) {
    const newPresent = {
      ...history.present,
      activities: history.present.activities.map((a) => {
        if (a.id === activityId) {
          const nextCompleted = !a.completed;
          return {
            ...a,
            completed: nextCompleted,
            completedAt: nextCompleted ? Date.now() : void 0
          };
        }
        return a;
      })
    };
    return recordAction(history, newPresent);
  }
  function removePlannedActivity(history, activityId) {
    const newPresent = {
      ...history.present,
      activities: history.present.activities.filter((a) => a.id !== activityId)
    };
    return recordAction(history, newPresent);
  }

  // src/services/achievements.ts
  function evaluateAchievements(currentAchievements, state) {
    const { completedSessions, blockedAttemptsTotal, dailyGoalMinutes, activities } = state;
    const totalSessionMinutes = completedSessions.filter((s) => s.status === "completed").reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalActivityMinutes = activities.filter((a) => a.completed).reduce((acc, a) => acc + a.durationMinutes, 0);
    const totalOfflineMinutes = totalSessionMinutes + totalActivityMinutes;
    return currentAchievements.map((ach) => {
      let unlocked = ach.unlocked;
      let progress = ach.progress;
      const now = Date.now();
      switch (ach.id) {
        case "first_disconnect": {
          const completedCount = completedSessions.filter((s) => s.status === "completed").length;
          progress = Math.min(100, Math.round(completedCount / 1 * 100));
          if (completedCount >= 1 && !unlocked) {
            unlocked = true;
          }
          break;
        }
        case "reset_30": {
          progress = Math.min(100, Math.round(totalOfflineMinutes / 30 * 100));
          if (totalOfflineMinutes >= 30 && !unlocked) {
            unlocked = true;
          }
          break;
        }
        case "one_hour_free": {
          progress = Math.min(100, Math.round(totalOfflineMinutes / 60 * 100));
          if (totalOfflineMinutes >= 60 && !unlocked) {
            unlocked = true;
          }
          break;
        }
        case "deep_focus": {
          const has2HourSession = completedSessions.some(
            (s) => s.status === "completed" && s.durationMinutes >= 120
          );
          progress = has2HourSession ? 100 : 0;
          if (has2HourSession && !unlocked) {
            unlocked = true;
          }
          break;
        }
        case "scroll_breaker": {
          progress = blockedAttemptsTotal > 0 ? 100 : 0;
          if (blockedAttemptsTotal > 0 && !unlocked) {
            unlocked = true;
          }
          break;
        }
        case "consistency": {
          progress = Math.min(100, Math.round(totalOfflineMinutes / dailyGoalMinutes * 100));
          if (totalOfflineMinutes >= dailyGoalMinutes && !unlocked) {
            unlocked = true;
          }
          break;
        }
      }
      return {
        ...ach,
        progress,
        unlocked,
        unlockedAt: unlocked ? ach.unlockedAt || now : void 0
      };
    });
  }

  // src/services/tracker.ts
  function categorizeDomain(domain) {
    const d = domain.toLowerCase();
    if (d.includes("instagram") || d.includes("facebook") || d.includes("twitter") || d.includes("x.com") || d.includes("tiktok") || d.includes("threads")) {
      return "Social Media";
    }
    if (d.includes("youtube") || d.includes("netflix") || d.includes("twitch") || d.includes("spotify") || d.includes("primevideo")) {
      return "Entertainment";
    }
    if (d.includes("reddit") || d.includes("quora") || d.includes("stack") || d.includes("forum")) {
      return "Forums & Discussion";
    }
    if (d.includes("github") || d.includes("docs") || d.includes("google") || d.includes("notion") || d.includes("linear") || d.includes("slack")) {
      return "Work & Productivity";
    }
    if (d.includes("news") || d.includes("medium") || d.includes("nytimes") || d.includes("bbc")) {
      return "News & Reading";
    }
    return "Other";
  }
  function recordDomainVisit(usageRecord, rawUrl, durationSeconds) {
    if (!rawUrl || durationSeconds <= 0) return usageRecord;
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return usageRecord;
      }
      const domain = cleanDomain(url.hostname);
      if (!domain) return usageRecord;
      const existing = usageRecord[domain] || {
        domain,
        timeSpentSeconds: 0,
        lastActive: Date.now(),
        category: categorizeDomain(domain)
      };
      return {
        ...usageRecord,
        [domain]: {
          ...existing,
          timeSpentSeconds: existing.timeSpentSeconds + durationSeconds,
          lastActive: Date.now()
        }
      };
    } catch {
      return usageRecord;
    }
  }

  // src/weather/index.ts
  function interpretWmoWeatherCode(code, isDay = true) {
    switch (code) {
      case 0:
        return {
          condition: "Clear",
          emoji: isDay ? "\u2600\uFE0F" : "\u{1F319}",
          isRain: false,
          isStorm: false,
          isClear: true,
          isFog: false,
          isSnow: false
        };
      case 1:
        return {
          condition: "Mainly Clear",
          emoji: isDay ? "\u2600\uFE0F" : "\u{1F319}",
          isRain: false,
          isStorm: false,
          isClear: true,
          isFog: false,
          isSnow: false
        };
      case 2:
        return {
          condition: "Partly Cloudy",
          emoji: isDay ? "\u26C5" : "\u2601\uFE0F",
          isRain: false,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: false
        };
      case 3:
        return {
          condition: "Overcast",
          emoji: "\u2601\uFE0F",
          isRain: false,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: false
        };
      case 45:
      case 48:
        return {
          condition: "Fog",
          emoji: "\u{1F32B}\uFE0F",
          isRain: false,
          isStorm: false,
          isClear: false,
          isFog: true,
          isSnow: false
        };
      case 51:
      case 53:
      case 55:
        return {
          condition: "Drizzle",
          emoji: isDay ? "\u{1F326}\uFE0F" : "\u{1F327}\uFE0F",
          isRain: true,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: false
        };
      case 56:
      case 57:
        return {
          condition: "Freezing Drizzle",
          emoji: "\u{1F328}\uFE0F",
          isRain: true,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: true
        };
      case 61:
      case 63:
      case 65:
        return {
          condition: "Rain",
          emoji: "\u{1F327}\uFE0F",
          isRain: true,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: false
        };
      case 66:
      case 67:
        return {
          condition: "Freezing Rain",
          emoji: "\u{1F327}\uFE0F",
          isRain: true,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: true
        };
      case 71:
      case 73:
      case 75:
        return {
          condition: "Snowfall",
          emoji: "\u{1F328}\uFE0F",
          isRain: false,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: true
        };
      case 77:
        return {
          condition: "Snow Grains",
          emoji: "\u{1F328}\uFE0F",
          isRain: false,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: true
        };
      case 80:
      case 81:
      case 82:
        return {
          condition: "Rain Showers",
          emoji: isDay ? "\u{1F326}\uFE0F" : "\u{1F327}\uFE0F",
          isRain: true,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: false
        };
      case 85:
      case 86:
        return {
          condition: "Snow Showers",
          emoji: "\u{1F328}\uFE0F",
          isRain: false,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: true
        };
      case 95:
        return {
          condition: "Thunderstorm",
          emoji: "\u26C8\uFE0F",
          isRain: true,
          isStorm: true,
          isClear: false,
          isFog: false,
          isSnow: false
        };
      case 96:
      case 99:
        return {
          condition: "Thunderstorm with Hail",
          emoji: "\u26C8\uFE0F",
          isRain: true,
          isStorm: true,
          isClear: false,
          isFog: false,
          isSnow: false
        };
      default:
        return {
          condition: "Cloudy",
          emoji: "\u2601\uFE0F",
          isRain: false,
          isStorm: false,
          isClear: false,
          isFog: false,
          isSnow: false
        };
    }
  }
  var CACHE_DURATION_MS = 15 * 60 * 1e3;
  async function detectLocationWithoutPermission() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4e3);
      const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const city = data.city ? `${data.city}, ${data.country_code || data.country_name || ""}`.trim() : "Local";
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city
          };
        }
      }
    } catch (e) {
      console.warn("[tabzero Weather] ipapi.co lookup failed, trying fallback:", e);
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4e3);
      const res = await fetch("https://freeipapi.com/api/json", { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const city = data.cityName ? `${data.cityName}, ${data.countryCode || ""}`.trim() : "Local";
          return {
            latitude: data.latitude,
            longitude: data.longitude,
            city
          };
        }
      }
    } catch (e) {
      console.warn("[tabzero Weather] freeipapi lookup failed:", e);
    }
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      city: "Bengaluru, IN"
    };
  }
  async function fetchOpenMeteoWeather(latitude, longitude, cityName, cachedData = null) {
    const now = Date.now();
    if (cachedData && now - cachedData.fetchedAt < CACHE_DURATION_MS && latitude && longitude) {
      return {
        ...cachedData,
        isCached: true
      };
    }
    let finalLat = latitude;
    let finalLon = longitude;
    let finalCity = cityName;
    if (!finalLat || !finalLon || finalCity === "Bangalore, IN" || finalCity === "Bengaluru, IN") {
      try {
        const detected = await detectLocationWithoutPermission();
        finalLat = detected.latitude;
        finalLon = detected.longitude;
        finalCity = detected.city;
      } catch {
        finalLat = finalLat || 12.9716;
        finalLon = finalLon || 77.5946;
        finalCity = finalCity || "Bengaluru, IN";
      }
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${finalLat}&longitude=${finalLon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&forecast_days=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8e3);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP error: ${res.status}`);
      }
      const json = await res.json();
      const current = json.current;
      if (!current) {
        throw new Error("Invalid Open-Meteo response structure");
      }
      const isDay = current.is_day === 1;
      const interp = interpretWmoWeatherCode(current.weather_code ?? 0, isDay);
      const weatherData = {
        temperature: Math.round(current.temperature_2m),
        humidity: Math.round(current.relative_humidity_2m ?? 0),
        precipitation: current.precipitation ?? 0,
        weatherCode: current.weather_code ?? 0,
        windSpeed: Math.round(current.wind_speed_10m ?? 0),
        condition: interp.condition,
        city: finalCity || "Bengaluru, IN",
        latitude: finalLat,
        longitude: finalLon,
        fetchedAt: now,
        isDay,
        time: current.time,
        isCached: false
      };
      return weatherData;
    } catch (err) {
      clearTimeout(timeoutId);
      if (cachedData) {
        return {
          ...cachedData,
          isCached: true
        };
      }
      throw err;
    }
  }

  // src/background/index.ts
  var ext = getExtensionAPI();
  var tabsApi = ext?.tabs || (typeof chrome !== "undefined" ? chrome.tabs : null);
  var runtimeApi = ext?.runtime || (typeof chrome !== "undefined" ? chrome.runtime : null);
  var alarmsApi = ext?.alarms || (typeof chrome !== "undefined" ? chrome.alarms : null);
  var webNavApi = ext?.webNavigation || (typeof chrome !== "undefined" ? chrome.webNavigation : null);
  var windowsApi = ext?.windows || (typeof chrome !== "undefined" ? chrome.windows : null);
  var idleApi = ext?.idle || (typeof chrome !== "undefined" ? chrome.idle : null);
  var currentActiveUrl = "";
  var lastTrackedTimestamp = Date.now();
  var isBrowserIdle = false;
  async function purgeRestrictedTabs(sites) {
    if (!tabsApi || !runtimeApi) return;
    try {
      const tabs = await tabsApi.query({});
      for (const tab of tabs) {
        if (!tab.id || !tab.url) continue;
        if (isInternalBrowserUrl(tab.url)) continue;
        const matchedSite = sites.find((s) => s.enabled && isDomainBlocked(tab.url, s.domain));
        if (matchedSite) {
          const rootDomain = extractRootDomain(matchedSite.domain);
          console.log(`[tabzero Purge] Immediately redirecting active tab ${tab.id} on ${tab.url}`);
          const blockedUrl = runtimeApi.getURL(`blocked.html?domain=${encodeURIComponent(rootDomain)}`);
          tabsApi.update(tab.id, { url: blockedUrl });
        }
      }
    } catch (e) {
      console.warn("[tabzero ServiceWorker] Tab purge error:", e);
    }
  }
  async function unblockAndRefreshTabs() {
    if (!tabsApi) return;
    try {
      const data = await getStorageData();
      const tabs = await tabsApi.query({});
      for (const tab of tabs) {
        if (!tab.id || !tab.url) continue;
        if (tab.url.includes("blocked.html")) {
          let domain = null;
          try {
            const parsed = new URL(tab.url);
            domain = parsed.searchParams.get("domain");
          } catch {
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
            tabsApi.update(tab.id, { url: targetUrl });
          } else {
            tabsApi.goBack(tab.id).catch(() => {
              tabsApi.update(tab.id, { url: "https://google.com" });
            });
          }
        }
      }
    } catch (e) {
      console.warn("[tabzero ServiceWorker] Unblock and refresh error:", e);
    }
  }
  if (runtimeApi?.onInstalled?.addListener) {
    runtimeApi.onInstalled.addListener(async () => {
      console.log("[tabzero ServiceWorker] Extension installed / initialized.");
      const data = await getStorageData();
      const isSessionActive = data.history.present.activeSession?.status === "active";
      await syncBlockingRules(data.history.present.restrictedSites, isSessionActive);
      if (isSessionActive) {
        await purgeRestrictedTabs(data.history.present.restrictedSites);
      }
      if (alarmsApi?.create) {
        alarmsApi.create("check_session_tick", { periodInMinutes: 0.5 });
        alarmsApi.create("refresh_weather_alarm", { periodInMinutes: 60 });
      }
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
        console.warn("[tabzero ServiceWorker] Initial weather fetch failed:", err);
      }
    });
  }
  if (alarmsApi?.onAlarm?.addListener) {
    alarmsApi.onAlarm.addListener(async (alarm) => {
      if (alarm.name === "check_session_tick") {
        const data = await getStorageData();
        const session = data.history.present.activeSession;
        if (session && session.status === "active" && !session.isIndefinite) {
          const now = Date.now();
          if (now >= session.endTime) {
            console.log("[tabzero ServiceWorker] Active session time reached. Completing session and refreshing blocked tabs.");
            data.history = completeDetoxSession(data.history);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            await unblockAndRefreshTabs();
          }
        }
      } else if (alarm.name === "refresh_weather_alarm") {
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
          console.warn("[tabzero ServiceWorker] Weather alarm update failed:", e);
        }
      }
    });
  }
  async function commitTrackedTime() {
    if (!currentActiveUrl || isBrowserIdle) return;
    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - lastTrackedTimestamp) / 1e3);
    lastTrackedTimestamp = now;
    if (elapsedSeconds > 1 && elapsedSeconds < 3600) {
      const data = await getStorageData();
      data.usage = recordDomainVisit(data.usage, currentActiveUrl, elapsedSeconds);
      await setStorageData(data);
    }
  }
  if (webNavApi?.onBeforeNavigate?.addListener) {
    webNavApi.onBeforeNavigate.addListener(async (details) => {
      if (details.frameId !== 0) return;
      if (!details.url) return;
      if (isInternalBrowserUrl(details.url)) return;
      const data = await getStorageData();
      const session = data.history.present.activeSession;
      if (!session || session.status !== "active") return;
      const matchedSite = data.history.present.restrictedSites.find(
        (s) => s.enabled && isDomainBlocked(details.url, s.domain)
      );
      if (matchedSite) {
        const rootDomain = extractRootDomain(matchedSite.domain);
        console.log(`[tabzero webNavigation] Intercepted navigation to restricted domain: ${rootDomain} (URL: ${details.url})`);
        matchedSite.blockedCount += 1;
        data.history.present.blockedAttemptsTotal += 1;
        data.tabDestinations = { ...data.tabDestinations || {}, [details.tabId]: rootDomain };
        data.lastBlockedDomain = rootDomain;
        data.achievements = evaluateAchievements(data.achievements, data.history.present);
        await setStorageData(data);
        if (runtimeApi?.getURL && tabsApi?.update) {
          const blockedUrl = runtimeApi.getURL(`blocked.html?domain=${encodeURIComponent(rootDomain)}`);
          tabsApi.update(details.tabId, { url: blockedUrl });
        }
      }
    });
  }
  if (tabsApi?.onActivated?.addListener) {
    tabsApi.onActivated.addListener(async (activeInfo) => {
      await commitTrackedTime();
      try {
        const tab = await tabsApi.get(activeInfo.tabId);
        if (tab && tab.url) {
          currentActiveUrl = tab.url;
          lastTrackedTimestamp = Date.now();
          checkRestrictedNavigation(tab.url, tab.id);
        }
      } catch {
      }
    });
  }
  if (tabsApi?.onUpdated?.addListener) {
    tabsApi.onUpdated.addListener(async (tabId, changeInfo) => {
      if (changeInfo.url) {
        await commitTrackedTime();
        currentActiveUrl = changeInfo.url;
        lastTrackedTimestamp = Date.now();
        checkRestrictedNavigation(changeInfo.url, tabId);
        if (changeInfo.url.includes("blocked.html") && !changeInfo.url.includes("?domain=")) {
          const data = await getStorageData();
          const domain = data.tabDestinations?.[tabId] || data.lastBlockedDomain || data.history.present.restrictedSites[0]?.domain;
          if (domain && runtimeApi?.getURL && tabsApi?.update) {
            tabsApi.update(tabId, {
              url: runtimeApi.getURL(`blocked.html?domain=${encodeURIComponent(extractRootDomain(domain))}`)
            });
          }
        }
      }
    });
  }
  if (windowsApi?.onFocusChanged?.addListener) {
    const NONE_WINDOW = windowsApi.WINDOW_ID_NONE ?? -1;
    windowsApi.onFocusChanged.addListener(async (windowId) => {
      if (windowId === NONE_WINDOW) {
        await commitTrackedTime();
        isBrowserIdle = true;
      } else {
        isBrowserIdle = false;
        lastTrackedTimestamp = Date.now();
      }
    });
  }
  if (idleApi?.onStateChanged?.addListener) {
    idleApi.onStateChanged.addListener(async (state) => {
      if (state === "idle" || state === "locked") {
        await commitTrackedTime();
        isBrowserIdle = true;
      } else if (state === "active") {
        isBrowserIdle = false;
        lastTrackedTimestamp = Date.now();
      }
    });
  }
  async function checkRestrictedNavigation(url, tabId) {
    if (!url) return;
    if (isInternalBrowserUrl(url)) return;
    const data = await getStorageData();
    const session = data.history.present.activeSession;
    if (!session || session.status !== "active") return;
    const matchedSite = data.history.present.restrictedSites.find(
      (s) => s.enabled && isDomainBlocked(url, s.domain)
    );
    if (matchedSite) {
      const rootDomain = extractRootDomain(matchedSite.domain);
      console.log(`[tabzero ServiceWorker] Tab check: restricted domain visited: ${rootDomain}`);
      matchedSite.blockedCount += 1;
      data.history.present.blockedAttemptsTotal += 1;
      data.achievements = evaluateAchievements(data.achievements, data.history.present);
      await setStorageData(data);
      if (tabId && runtimeApi?.getURL && tabsApi?.update) {
        const blockedUrl = runtimeApi.getURL(`blocked.html?domain=${encodeURIComponent(rootDomain)}`);
        tabsApi.update(tabId, { url: blockedUrl });
      }
    }
  }
  if (runtimeApi?.onMessage?.addListener) {
    runtimeApi.onMessage.addListener((message, sender, sendResponse) => {
      (async () => {
        const data = await getStorageData();
        switch (message.type) {
          case "GET_STATE": {
            sendResponse({ success: true, data });
            break;
          }
          case "OPEN_DASHBOARD": {
            const dashboardUrl = runtimeApi.getURL ? runtimeApi.getURL("dashboard.html") : "dashboard.html";
            if (tabsApi?.create) {
              tabsApi.create({ url: dashboardUrl });
            }
            sendResponse({ success: true });
            break;
          }
          case "TRIGGER_UNDO": {
            data.history = undo(data.history);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await syncHistoryStateRules(data.history);
            if (data.history.present.activeSession?.status === "active") {
              await purgeRestrictedTabs(data.history.present.restrictedSites);
            } else {
              await unblockAndRefreshTabs();
            }
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "TRIGGER_REDO": {
            data.history = redo(data.history);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await syncHistoryStateRules(data.history);
            if (data.history.present.activeSession?.status === "active") {
              await purgeRestrictedTabs(data.history.present.restrictedSites);
            } else {
              await unblockAndRefreshTabs();
            }
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "SESSION_START": {
            data.history = startDetoxSession(data.history, {
              totalSeconds: message.durationSeconds,
              durationMinutes: message.durationMinutes,
              isIndefinite: message.isIndefinite
            }, message.domains);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            await purgeRestrictedTabs(data.history.present.restrictedSites);
            sendResponse({ success: true, data });
            break;
          }
          case "TOGGLE_SHIELD": {
            const isCurrentlyActive = data.history.present.activeSession?.status === "active";
            const shouldEnable = message.enabled !== void 0 ? message.enabled : !isCurrentlyActive;
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
          case "SESSION_PAUSE": {
            data.history = pauseDetoxSession(data.history);
            await setStorageData(data);
            await unblockAndRefreshTabs();
            sendResponse({ success: true, data });
            break;
          }
          case "SESSION_RESUME": {
            data.history = resumeDetoxSession(data.history);
            await setStorageData(data);
            await purgeRestrictedTabs(data.history.present.restrictedSites);
            sendResponse({ success: true, data });
            break;
          }
          case "SESSION_COMPLETE": {
            data.history = completeDetoxSession(data.history);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            await unblockAndRefreshTabs();
            sendResponse({ success: true, data });
            break;
          }
          case "SESSION_CANCEL": {
            data.history = cancelDetoxSession(data.history);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            await unblockAndRefreshTabs();
            sendResponse({ success: true, data });
            break;
          }
          case "ADD_SITE": {
            data.history = addRestrictedSite(data.history, message.domain, message.category);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            if (data.history.present.activeSession?.status === "active") {
              await purgeRestrictedTabs(data.history.present.restrictedSites);
            }
            sendResponse({ success: true, data });
            break;
          }
          case "REMOVE_SITE": {
            data.history = removeRestrictedSite(data.history, message.id);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "TOGGLE_SITE": {
            data.history = toggleRestrictedSite(data.history, message.id);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            if (data.history.present.activeSession?.status === "active") {
              await purgeRestrictedTabs(data.history.present.restrictedSites);
            }
            sendResponse({ success: true, data });
            break;
          }
          case "INCREMENT_BLOCKED_COUNT": {
            data.history.present.blockedAttemptsTotal += 1;
            const targetSite = data.history.present.restrictedSites.find(
              (s) => extractRootDomain(s.domain) === extractRootDomain(message.domain)
            );
            if (targetSite) {
              targetSite.blockedCount += 1;
            }
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "SET_DAILY_GOAL": {
            data.history = changeDailyGoal(data.history, message.minutes);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "CREATE_PLEDGE": {
            data.history = createPledge(data.history, message.pledge);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "EDIT_PLEDGE": {
            data.history = editPledge(data.history, message.id, message.updates);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "ADD_ACTIVITY": {
            data.history = addPlannedActivity(data.history, message.activity);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "COMPLETE_ACTIVITY": {
            data.history = completePlannedActivity(data.history, message.id);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "REMOVE_ACTIVITY": {
            data.history = removePlannedActivity(data.history, message.id);
            data.achievements = evaluateAchievements(data.achievements, data.history.present);
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "REFRESH_WEATHER": {
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
            } catch (e) {
              sendResponse({ success: false, error: e.message, data });
            }
            break;
          }
          case "SET_THEME": {
            data.themePreference = message.theme;
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          case "RECORD_BLOCKED_TAB": {
            data.tabDestinations = { ...data.tabDestinations || {}, [message.tabId]: message.domain };
            data.lastBlockedDomain = message.domain;
            await setStorageData(data);
            sendResponse({ success: true, data });
            break;
          }
          default:
            sendResponse({ success: false, error: "Unknown message type" });
        }
      })();
      return true;
    });
  }
})();
