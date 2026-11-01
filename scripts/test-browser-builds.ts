import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING INDEPENDENT CHROME & FIREFOX MV3 BUILDS ===\n');

let allPassed = true;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
  } else {
    console.error(`✗ FAIL: ${message}`);
    allPassed = false;
  }
}

// -------------------------------------------------------------
// 1. Chrome Build Verification (dist/)
// -------------------------------------------------------------
console.log('[1/2] Verifying Chrome MV3 Build in dist/ ...');

const chromeManifestPath = path.resolve('dist/manifest.json');
assert(fs.existsSync(chromeManifestPath), 'dist/manifest.json exists');

const chromeManifest = JSON.parse(fs.readFileSync(chromeManifestPath, 'utf-8'));
assert(chromeManifest.manifest_version === 3, 'Chrome manifest_version is 3');
assert(chromeManifest.background?.service_worker === 'background.js', 'Chrome background uses service_worker: "background.js"');
assert(!chromeManifest.background?.scripts, 'Chrome background does NOT have background.scripts');
assert(chromeManifest.permissions?.includes('sidePanel'), 'Chrome permissions includes sidePanel');
assert(!!chromeManifest.side_panel?.default_path, 'Chrome side_panel configuration is present');
assert(chromeManifest.permissions?.includes('declarativeNetRequest'), 'Chrome permissions includes declarativeNetRequest');
assert(chromeManifest.permissions?.includes('storage'), 'Chrome permissions includes storage');

const chromeBgPath = path.resolve('dist/background.js');
assert(fs.existsSync(chromeBgPath), 'dist/background.js exists');
const chromeBgContent = fs.readFileSync(chromeBgPath, 'utf-8');
assert(!chromeBgContent.startsWith('import ') && !chromeBgContent.includes('\nimport '), 'dist/background.js is self-contained (no top-level ESM imports)');
assert(fs.existsSync(path.resolve('dist/popup.html')), 'dist/popup.html exists');
assert(fs.existsSync(path.resolve('dist/dashboard.html')), 'dist/dashboard.html exists');
assert(fs.existsSync(path.resolve('dist/blocked.html')), 'dist/blocked.html exists');

console.log('\n[2/2] Verifying Firefox MV3 Build in dist-firefox/ ...');

const firefoxManifestPath = path.resolve('dist-firefox/manifest.json');
assert(fs.existsSync(firefoxManifestPath), 'dist-firefox/manifest.json exists');

const firefoxManifest = JSON.parse(fs.readFileSync(firefoxManifestPath, 'utf-8'));
assert(firefoxManifest.manifest_version === 3, 'Firefox manifest_version is 3');
assert(Array.isArray(firefoxManifest.background?.scripts) && firefoxManifest.background.scripts[0] === 'background.js',
  'Firefox background uses "scripts": ["background.js"]');
assert(!firefoxManifest.background?.service_worker,
  'Firefox background has NO service_worker (prevents "background.service_worker is currently disabled" error)');
assert(!!firefoxManifest.browser_specific_settings?.gecko?.id,
  `Firefox has valid Gecko ID: ${firefoxManifest.browser_specific_settings?.gecko?.id}`);
assert(!firefoxManifest.permissions?.includes('sidePanel'),
  'Firefox permissions does NOT contain Chrome-specific sidePanel (prevents AMO warnings)');
assert(!!firefoxManifest.sidebar_action?.default_panel,
  'Firefox uses native sidebar_action pointing to popup.html');
assert(firefoxManifest.permissions?.includes('declarativeNetRequest'), 'Firefox permissions includes declarativeNetRequest');
assert(firefoxManifest.permissions?.includes('storage'), 'Firefox permissions includes storage');
assert(firefoxManifest.permissions?.includes('tabs'), 'Firefox permissions includes tabs');
assert(firefoxManifest.permissions?.includes('webNavigation'), 'Firefox permissions includes webNavigation');
assert(firefoxManifest.permissions?.includes('alarms'), 'Firefox permissions includes alarms');

const firefoxBgPath = path.resolve('dist-firefox/background.js');
assert(fs.existsSync(firefoxBgPath), 'dist-firefox/background.js exists');
const firefoxBgContent = fs.readFileSync(firefoxBgPath, 'utf-8');
assert(!firefoxBgContent.startsWith('import ') && !firefoxBgContent.includes('\nimport '),
  'dist-firefox/background.js is self-contained IIFE (no top-level ESM imports, safe for classic event page)');

assert(fs.existsSync(path.resolve('dist-firefox/popup.html')), 'dist-firefox/popup.html exists');
assert(fs.existsSync(path.resolve('dist-firefox/dashboard.html')), 'dist-firefox/dashboard.html exists');
assert(fs.existsSync(path.resolve('dist-firefox/blocked.html')), 'dist-firefox/blocked.html exists');

// -------------------------------------------------------------
// 3. Syntax Execution Verification in Mock WebExtension Environment
// -------------------------------------------------------------
console.log('\n[3/3] Testing background script execution in simulated browser sandbox...');

try {
  // Test loading the IIFE bundle in a VM context
  const mockStorage: Record<string, any> = {};
  const mockBrowser = {
    runtime: {
      onInstalled: { addListener: () => {} },
      onMessage: { addListener: () => {} },
      getURL: (p: string) => `moz-extension://test-id/${p}`,
    },
    tabs: {
      query: async () => [],
      update: async () => {},
      onActivated: { addListener: () => {} },
      onUpdated: { addListener: () => {} },
    },
    alarms: {
      create: () => {},
      onAlarm: { addListener: () => {} },
    },
    storage: {
      local: {
        get: async () => mockStorage,
        set: async (d: any) => Object.assign(mockStorage, d),
      },
      onChanged: { addListener: () => {}, removeListener: () => {} },
    },
    webNavigation: {
      onBeforeNavigate: { addListener: () => {} },
    },
    windows: {
      onFocusChanged: { addListener: () => {} },
      WINDOW_ID_NONE: -1,
    },
    idle: {
      onStateChanged: { addListener: () => {} },
    },
  };

  const fn = new Function('browser', 'chrome', 'globalThis', firefoxBgContent);
  fn(mockBrowser, mockBrowser, { browser: mockBrowser, chrome: mockBrowser });
  assert(true, 'Firefox background script runs without syntax errors or unhandled exceptions');
} catch (err) {
  assert(false, `Firefox background script execution failed: ${(err as Error).message}`);
}

console.log('\n-------------------------------------------------------------');
if (allPassed) {
  console.log('🎉 ALL CHROME & FIREFOX CROSS-BROWSER MV3 VERIFICATIONS PASSED 100%!');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
