import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distDir = path.resolve(__dirname, 'dist');
const portfolioDist = path.resolve(__dirname, 'portfolio/dist');
const adminDist = path.resolve(__dirname, 'admin/dist');

// Ensure clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy portfolio dist to root of dist
if (fs.existsSync(portfolioDist)) {
  fs.cpSync(portfolioDist, distDir, { recursive: true });
  console.log('✓ Copied portfolio build to dist/');
}

// Copy admin dist to dist/admin
const distAdmin = path.join(distDir, 'admin');
if (fs.existsSync(adminDist)) {
  fs.cpSync(adminDist, distAdmin, { recursive: true });
  console.log('✓ Copied admin dashboard build to dist/admin/');
}

// Copy admin assets to dist/assets as well so root-relative asset paths resolve
const adminAssets = path.join(adminDist, 'assets');
const distAssets = path.join(distDir, 'assets');
if (fs.existsSync(adminAssets)) {
  fs.cpSync(adminAssets, distAssets, { recursive: true });
  console.log('✓ Merged admin assets into dist/assets/');
}

console.log('🎉 Frontend dist assembled successfully for Vercel!');
