import { HistoryState, OfflineStorageSchema, CoreAppState } from '../types';
import { INITIAL_STORAGE } from './defaults';
import { getExtensionAPI } from '../services/browserApi';

const STORAGE_KEY = 'tabzero_extension_data';
const LEGACY_STORAGE_KEY = 'offline_extension_data';

/**
 * Helper to determine if extension storage (Chrome, Firefox, Safari, Edge) is available
 */
export function hasExtensionStorage(): boolean {
  const api = getExtensionAPI();
  return !!(api && api.storage && api.storage.local);
}

// Backward compatibility alias
export const hasChromeStorage = hasExtensionStorage;

export async function getStorageData(): Promise<OfflineStorageSchema> {
  const api = getExtensionAPI();

  if (api && api.storage && api.storage.local) {
    try {
      // 1. Try native Promise (standard in browser.*, modern Chrome MV3, Safari, Edge)
      const result: any = await api.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
      if (result && result[STORAGE_KEY]) {
        return result[STORAGE_KEY] as OfflineStorageSchema;
      } else if (result && result[LEGACY_STORAGE_KEY]) {
        const migrated = result[LEGACY_STORAGE_KEY] as OfflineStorageSchema;
        await setStorageData(migrated);
        return migrated;
      } else {
        await setStorageData(INITIAL_STORAGE);
        return INITIAL_STORAGE;
      }
    } catch {
      // 2. Fallback to callback style for older browser versions
      return new Promise((resolve) => {
        try {
          api.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY], (result: any) => {
            if (api.runtime?.lastError) {
              console.warn('[tabzero Storage] Error reading storage:', api.runtime.lastError);
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
              setStorageData(INITIAL_STORAGE).then(() => resolve(INITIAL_STORAGE));
            }
          });
        } catch {
          resolve(INITIAL_STORAGE);
        }
      });
    }
  }

  // 3. Browser localStorage fallback for standalone dev preview / unit test runners
  try {
    if (typeof localStorage !== 'undefined') {
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

export async function setStorageData(data: OfflineStorageSchema): Promise<void> {
  const api = getExtensionAPI();

  if (api && api.storage && api.storage.local) {
    try {
      // 1. Try native Promise
      await api.storage.local.set({ [STORAGE_KEY]: data });
      return;
    } catch {
      // 2. Fallback to callback style
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

  // 3. LocalStorage fallback
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tabzero_storage_updated', { detail: data }));
      }
    }
  } catch (e) {
    console.error('[tabzero Storage] LocalStorage write error:', e);
  }
}

export function subscribeToStorage(callback: (data: OfflineStorageSchema) => void): () => void {
  const api = getExtensionAPI();

  if (api && api.storage && api.storage.onChanged) {
    const listener = (changes: { [key: string]: any }, areaName: string) => {
      if (areaName === 'local' && (changes[STORAGE_KEY] || changes[LEGACY_STORAGE_KEY])) {
        callback((changes[STORAGE_KEY]?.newValue || changes[LEGACY_STORAGE_KEY]?.newValue) as OfflineStorageSchema);
      }
    };
    api.storage.onChanged.addListener(listener);
    return () => {
      try {
        api.storage.onChanged.removeListener(listener);
      } catch {}
    };
  } else if (typeof window !== 'undefined') {
    const listener = (e: Event) => {
      const customEvent = e as CustomEvent<OfflineStorageSchema>;
      callback(customEvent.detail);
    };
    window.addEventListener('tabzero_storage_updated', listener);
    return () => window.removeEventListener('tabzero_storage_updated', listener);
  }

  return () => {};
}
