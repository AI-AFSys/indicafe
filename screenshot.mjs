// Puppeteer screenshot helper — saves to ./temporary screenshots/screenshot-N[-label].png
// Usage:  node screenshot.mjs http://localhost:3000 [label]

import { createRequire } from 'module';
import { pathToFileURL  } from 'url';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require   = createRequire(import.meta.url);
const ROOT      = path.dirname(fileURLToPath(import.meta.url));
const PPTR_PATH = 'C:\\Users\\Work\\AppData\\Local\\Temp\\puppeteer-test\\node_modules\\puppeteer';
const puppeteer = require(PPTR_PATH);

const outDir = path.join(ROOT, 'temporary screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function nextN() {
  const files = fs.readdirSync(outDir).filter(f => /^screenshot-\d+/.test(f));
  if (!files.length) return 1;
  return Math.max(...files.map(f => parseInt(f.match(/\d+/)[0], 10))) + 1;
}

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const file  = path.join(outDir, `screenshot-${nextN()}${label}.png`);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
await page.screenshot({ path: file, fullPage: false });
await browser.close();

console.log(`Screenshot saved → ${file}`);
