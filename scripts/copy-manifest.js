import fs from 'fs';
import path from 'path';

const srcManifest = path.resolve('public/manifest.json');
const destManifest = path.resolve('dist/manifest.json');

if (fs.existsSync(srcManifest)) {
  fs.copyFileSync(srcManifest, destManifest);
  console.log('Copied manifest.json to dist/');
}

// Also ensure icons directory is in dist
const srcIcons = path.resolve('public/icons');
const destIcons = path.resolve('dist/icons');
if (fs.existsSync(srcIcons)) {
  if (!fs.existsSync(destIcons)) {
    fs.mkdirSync(destIcons, { recursive: true });
  }
  fs.readdirSync(srcIcons).forEach(file => {
    fs.copyFileSync(path.join(srcIcons, file), path.join(destIcons, file));
  });
  console.log('Copied icons to dist/');
}

// Also ensure public/assets directory is in dist
const srcAssets = path.resolve('public/assets');
const destAssets = path.resolve('dist/assets');
if (fs.existsSync(srcAssets)) {
  if (!fs.existsSync(destAssets)) {
    fs.mkdirSync(destAssets, { recursive: true });
  }
  fs.readdirSync(srcAssets).forEach(file => {
    fs.copyFileSync(path.join(srcAssets, file), path.join(destAssets, file));
  });
  console.log('Copied public/assets to dist/assets/');
}
