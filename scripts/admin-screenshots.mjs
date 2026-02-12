import { chromium } from "playwright";
import path from "path";
import fs from "fs";

// Usage:
//   node scripts/admin-screenshots.mjs \
//     --base http://127.0.0.1:3020 \
//     --password "<admin password>" \
//     --outDir public

const args = process.argv.slice(2);
function arg(name, fallback = null) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const base = arg("--base", "http://127.0.0.1:3020");
const password = arg("--password");
const outDir = arg("--outDir", "public");

if (!password) {
  console.error("Missing --password");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

// Go to admin -> redirected to login
await page.goto(`${base}/admin`, { waitUntil: "domcontentloaded" });

// Fill login
await page.waitForSelector('input[name="password"]', { timeout: 15000 });
await page.fill('input[name="password"]', password);

// Submit
await Promise.all([
  page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  page.click('button[type="submit"], button.btn.primary, button')
]);

// Admin dashboard screenshot
await page.waitForURL(new RegExp(`${base.replaceAll('/', '\\/')}/admin.*`));
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, "admin-dashboard-loggedin.png"), fullPage: true });

// Reports page screenshot
await page.goto(`${base}/admin/reports`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, "admin-reports-loggedin.png"), fullPage: true });

await browser.close();
console.log(`Saved: ${path.join(outDir, 'admin-dashboard-loggedin.png')}`);
console.log(`Saved: ${path.join(outDir, 'admin-reports-loggedin.png')}`);
