import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dir, 'og-image.html');
const outPath  = join(__dir, '..', 'public', 'og-image.png');

const browser = await puppeteer.launch({ headless: 'new' });
const page    = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.goto(`file://${htmlPath}`);
await page.waitForTimeout(300);
await page.screenshot({ path: outPath, type: 'png', clip: { x:0, y:0, width:1200, height:630 } });
await browser.close();

console.log('✓ OG image saved to public/og-image.png');
