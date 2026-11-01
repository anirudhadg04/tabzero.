/**
 * Cross-Browser Extension API Abstraction Layer
 * Provides unified access to WebExtension APIs across:
 * - Google Chrome & Chromium
 * - Microsoft Edge
 * - Brave Browser
 * - Opera / Opera GX
 * - Vivaldi
 * - Arc Browser
 * - Mozilla Firefox (Desktop & Android)
 * - Apple Safari (macOS & iOS)
 */

export function getExtensionAPI(): any {
  if (typeof globalThis !== 'undefined' && (globalThis as any).browser?.runtime) {
    return (globalThis as any).browser;
  }
  if (typeof chrome !== 'undefined' && chrome?.runtime) {
    return chrome;
  }
  if (typeof window !== 'undefined' && (window as any).browser?.runtime) {
    return (window as any).browser;
  }
  return null;
}

export const extensionApi: any = getExtensionAPI();

/**
 * Returns true if running within any active WebExtension browser context
 */
export function isExtensionEnvironment(): boolean {
  const api = getExtensionAPI();
  return !!(api && (api.runtime || api.storage));
}

/**
 * Detect current browser vendor/engine for optional platform-tailored tweaks
 */
export function detectBrowserVendor(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'brave' | 'opera' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('firefox') || ua.includes('fxios')) return 'firefox';
  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'opera';
  if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') return 'brave';
  if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android')) return 'safari';
  if (ua.includes('chrome') || ua.includes('chromium')) return 'chrome';

  return 'unknown';
}
