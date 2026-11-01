import fs from 'fs';
import path from 'path';

const srcManifestPath = path.resolve('public/manifest.json');
const srcIconsPath = path.resolve('public/icons');
const srcAssetsPath = path.resolve('public/assets');

if (!fs.existsSync(srcManifestPath)) {
  console.error('Source manifest not found at:', srcManifestPath);
  process.exit(1);
}

const rawManifest = fs.readFileSync(srcManifestPath, 'utf-8');
const baseManifest = JSON.parse(rawManifest);

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

// 1. Copy to Universal dist/ (compatible with Chrome, Edge, Brave, Opera, Vivaldi, Arc, Safari, Firefox 121+)
const distDir = path.resolve('dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(baseManifest, null, 2), 'utf-8');
  console.log('✓ Created Universal manifest.json in dist/');

  copyDirRecursive(srcIconsPath, path.join(distDir, 'icons'));
  console.log('✓ Copied icons to dist/icons/');

  copyDirRecursive(srcAssetsPath, path.join(distDir, 'assets'));
  console.log('✓ Copied assets to dist/assets/');
}

// Helper to populate target directory from dist
function syncTargetDistribution(targetName, manifestModifier) {
  const targetDir = path.resolve(targetName);
  if (!fs.existsSync(distDir)) return;

  // Copy dist build output into target
  copyDirRecursive(distDir, targetDir);

  // Apply manifest modifications
  const targetManifest = manifestModifier(JSON.parse(JSON.stringify(baseManifest)));
  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(targetManifest, null, 2), 'utf-8');
  console.log(`✓ Synchronized ${targetName}/ with customized manifest`);
}

// 2. Target: Firefox Add-ons (AMO) optimized distribution
syncTargetDistribution('dist-firefox', (m) => {
  // Firefox doesn't support 'sidePanel' permission in MV3, uses 'sidebar_action'
  m.permissions = (m.permissions || []).filter(p => p !== 'sidePanel');
  delete m.side_panel;
  m.sidebar_action = {
    default_panel: 'popup.html',
    default_title: 'tabzero.',
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  };
  return m;
});

// 3. Target: Chrome Web Store & Chromium optimized distribution
syncTargetDistribution('dist-chrome', (m) => {
  // Chrome doesn't require browser_specific_settings
  delete m.browser_specific_settings;
  return m;
});
