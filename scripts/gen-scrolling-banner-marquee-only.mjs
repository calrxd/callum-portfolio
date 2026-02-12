import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { execSync } from 'child_process';

// Animated pill-buttons that move horizontally (marquee-like). No right-side text.
// Usage: node scripts/gen-scrolling-banner-marquee-only.mjs [outBaseName]

const outBase = process.argv[2] || 'scrolling-banner-preview';
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const htmlPath = path.join(uploadsDir, `${outBase}.html`);
const videoDir = path.join(uploadsDir, `${outBase}-video`);
fs.rmSync(videoDir, { recursive: true, force: true });
fs.mkdirSync(videoDir, { recursive: true });

const width = 1200;
const height = 220;

const iconThermo = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0zM12 3a2 2 0 0 1 2 2v10.3l.36.23a3 3 0 1 1-4.72 0l.36-.23V5a2 2 0 0 1 2-2z"/></svg>`;
const iconHome = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 3 10v11h6v-7h6v7h6V10l-9-7zm3 6.5h-6V8h6v1.5z"/></svg>`;
const iconBulb = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 21h6v-1H9v1zm3-20a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.26A7 7 0 0 0 12 1zm3 11.62-.5.38V16H9v-2.99l-.5-.39A5 5 0 1 1 15 12.62z"/></svg>`;

const pills = `
  <div class="pill">${iconThermo}<span class="label">Outside</span><span class="value">18.3°C</span></div>
  <div class="pill">${iconHome}<span class="label">Inside</span><span class="value">18.3°C</span></div>
  <div class="pill">${iconBulb}<span class="label">Lights</span></div>
`;

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root{
      --bg:#060b0c;
      --ink:#eaf2f2;
      --muted:#a3b0b2;
      --border:#1a2728;
    }
    *{box-sizing:border-box}
    html,body{margin:0;height:100%;background:var(--bg);font-family:system-ui,-apple-system,Segoe UI,Inter,Roboto,Helvetica,Arial;}
    .wrap{width:${width}px;height:${height}px;display:grid;place-items:center;margin:0 auto;}

    .banner{
      width:1120px;
      height:74px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.10);
      background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
      box-shadow:0 22px 90px rgba(0,0,0,.65);
      overflow:hidden;
      display:flex;
      align-items:center;
      padding:0 14px;
    }

    .marquee{position:relative;flex:1;overflow:hidden;}
    .track{display:flex;width:max-content;gap:14px;white-space:nowrap;will-change:transform;animation: scroll 14s linear infinite;}
    .block{display:inline-flex;gap:14px;white-space:nowrap;}

    .pill{
      display:inline-flex;
      align-items:center;
      gap:10px;
      padding:0 16px;
      height:50px;
      border-radius:999px;
      background:linear-gradient(180deg, rgba(0,0,0,.40), rgba(0,0,0,.25));
      border:1px solid rgba(255,255,255,.10);
      color:var(--ink);
      font-weight:650;
      letter-spacing:-.01em;
      flex:0 0 auto;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
    }
    .pill svg{width:18px;height:18px;opacity:.92}
    .pill .label{font-size:16px;opacity:.92}
    .pill .value{font-size:16px;opacity:.92}

    @keyframes scroll{
      from{ transform: translateX(0); }
      to{ transform: translateX(-50%); }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="banner">
      <div class="marquee">
        <div class="track">
          <div class="block">${pills}</div>
          <div class="block" aria-hidden="true">${pills}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width, height },
  recordVideo: { dir: videoDir, size: { width, height } },
});
const page = await context.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(9000);
await context.close();
await browser.close();

const vid = fs.readdirSync(videoDir).find((f) => f.endsWith('.webm') || f.endsWith('.mp4'));
if (!vid) throw new Error('No recorded video found in ' + videoDir);

const inVideo = path.join(videoDir, vid);
const outGif = path.join(uploadsDir, `${outBase}.gif`);
const palette = path.join(uploadsDir, `${outBase}-palette.png`);

execSync(`ffmpeg -y -i "${inVideo}" -vf "fps=16,scale=${width}:-1:flags=lanczos,palettegen" "${palette}"`, { stdio: 'inherit' });
execSync(`ffmpeg -y -i "${inVideo}" -i "${palette}" -lavfi "fps=16,scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" "${outGif}"`, { stdio: 'inherit' });

console.log('Saved', outGif);
