import fs from "fs";
import path from "path";
import { chromium } from "playwright";

// Usage:
//   node scripts/screenshot.mjs https://example.com out.png
//   node scripts/screenshot.mjs https://example.com out.png --full
//
const [url, out, ...rest] = process.argv.slice(2);

if (!url || !out) {
  console.error("Usage: node scripts/screenshot.mjs <url> <out.png> [--full]");
  process.exit(1);
}

const full = rest.includes("--full");

fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(500);

await page.screenshot({ path: out, fullPage: full });

await browser.close();
console.log(`Saved: ${out}`);
