import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

const distDir = path.resolve('dist');
const distFirefoxDir = path.resolve('dist-firefox');
const distChromeDir = path.resolve('dist-chrome');

const chromeManifestSrc = path.resolve('public/manifest.chrome.json');
const firefoxManifestSrc = path.resolve('public/manifest.firefox.json');
const iconsSrc = path.resolve('public/icons');
const assetsSrc = path.resolve('public/assets');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Bundle standalone background.js as IIFE
// Crucial: Classic background scripts in Firefox MV3 do not support top-level ES module imports.
// Generating a bundled IIFE script guarantees 100% compatibility in both Firefox and Chrome.
const bgEntry = path.resolve('src/background/index.ts');
const bgOutDist = path.join(distDir, 'background.js');

esbuild.buildSync({
  entryPoints: [bgEntry],
  bundle: true,
  outfile: bgOutDist,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  minify: false,
  sourcemap: false,
});
console.log('✓ Compiled self-contained background.js (IIFE bundle, zero external imports)');

// 2. Setup Chrome / Universal build (dist/)
fs.copyFileSync(chromeManifestSrc, path.join(distDir, 'manifest.json'));
copyDirRecursive(iconsSrc, path.join(distDir, 'icons'));
copyDirRecursive(assetsSrc, path.join(distDir, 'assets'));

// Clean up extra manifest templates from dist/
const distChromeManifest = path.join(distDir, 'manifest.chrome.json');
const distFirefoxManifest = path.join(distDir, 'manifest.firefox.json');
if (fs.existsSync(distChromeManifest)) fs.unlinkSync(distChromeManifest);
if (fs.existsSync(distFirefoxManifest)) fs.unlinkSync(distFirefoxManifest);
console.log('✓ Created Chrome production build in dist/ with manifest.chrome.json');

// 3. Setup Firefox dedicated build (dist-firefox/)
copyDirRecursive(distDir, distFirefoxDir);
fs.copyFileSync(firefoxManifestSrc, path.join(distFirefoxDir, 'manifest.json'));
const ffChromeManifest = path.join(distFirefoxDir, 'manifest.chrome.json');
const ffFirefoxManifest = path.join(distFirefoxDir, 'manifest.firefox.json');
if (fs.existsSync(ffChromeManifest)) fs.unlinkSync(ffChromeManifest);
if (fs.existsSync(ffFirefoxManifest)) fs.unlinkSync(ffFirefoxManifest);
console.log('✓ Created Firefox production build in dist-firefox/ with manifest.firefox.json');

// 4. Setup Chrome dedicated build (dist-chrome/)
copyDirRecursive(distDir, distChromeDir);
fs.copyFileSync(chromeManifestSrc, path.join(distChromeDir, 'manifest.json'));
const chChromeManifest = path.join(distChromeDir, 'manifest.chrome.json');
const chFirefoxManifest = path.join(distChromeDir, 'manifest.firefox.json');
if (fs.existsSync(chChromeManifest)) fs.unlinkSync(chChromeManifest);
if (fs.existsSync(chFirefoxManifest)) fs.unlinkSync(chFirefoxManifest);
console.log('✓ Created Chrome dedicated build in dist-chrome/ with manifest.chrome.json');
