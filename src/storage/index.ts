import { HistoryState, OfflineStorageSchema, CoreAppState } from '../types';
import { INITIAL_STORAGE } from './defaults';

const STORAGE_KEY = 'tabzero_extension_data';
const LEGACY_STORAGE_KEY = 'offline_extension_data';

// Helper to determine if chrome.storage.local is available
export function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
}

export async function getStorageData(): Promise<OfflineStorageSchema> {
  if (hasChromeStorage()) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.warn('[tabzero Storage] Error reading storage:', chrome.runtime.lastError);
          resolve(INITIAL_STORAGE);
          return;
        }
        if (result && result[STORAGE_KEY]) {
          resolve(result[STORAGE_KEY] as OfflineStorageSchema);
        } else if (result && result[LEGACY_STORAGE_KEY]) {
          const migrated = result[LEGACY_STORAGE_KEY] as OfflineStorageSchema;
          setStorageData(migrated);
          resolve(migrated);
        } else {
          // Initialize storage with defaults
          setStorageData(INITIAL_STORAGE).then(() => resolve(INITIAL_STORAGE));
        }
      });
    });
  } else {
    // Browser localStorage fallback for standalone dev preview
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STORAGE));
      return INITIAL_STORAGE;
    } catch {
      return INITIAL_STORAGE;
    }
  }
}

export async function setStorageData(data: OfflineStorageSchema): Promise<void> {
  if (hasChromeStorage()) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('tabzero_storage_updated', { detail: data }));
    } catch (e) {
      console.error('[tabzero Storage] LocalStorage write error:', e);
    }
  }
}

export function subscribeToStorage(callback: (data: OfflineStorageSchema) => void): () => void {
  if (hasChromeStorage()) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && (changes[STORAGE_KEY] || changes[LEGACY_STORAGE_KEY])) {
        callback((changes[STORAGE_KEY]?.newValue || changes[LEGACY_STORAGE_KEY]?.newValue) as OfflineStorageSchema);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  } else {
    const listener = (e: Event) => {
      const customEvent = e as CustomEvent<OfflineStorageSchema>;
      callback(customEvent.detail);
    };
    window.addEventListener('tabzero_storage_updated', listener);
    return () => window.removeEventListener('tabzero_storage_updated', listener);
  }
}
