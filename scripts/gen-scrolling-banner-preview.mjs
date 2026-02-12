import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { execSync } from 'child_process';

// Generates an animated GIF preview for the scrolling banner card.
// Usage:
//   node scripts/gen-scrolling-banner-preview.mjs [outBaseName]

const outBase = process.argv[2] || 'scrolling-banner-preview';
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const htmlPath = path.join(uploadsDir, `${outBase}.html`);
const videoDir = path.join(uploadsDir, `${outBase}-video`);
fs.mkdirSync(videoDir, { recursive: true });

const width = 1200;
const height = 630;

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Scrolling Banner Preview</title>
  <style>
    :root{
      --bg:#060b0c;
      --pill:#0c1415;
      --border:#1a2728;
      --ink:#eaf2f2;
      --muted:#a3b0b2;
      --accent:#47b8af;
    }
    *{box-sizing:border-box}
    html,body{margin:0;height:100%;background:var(--bg);font-family:system-ui,-apple-system,Segoe UI,Inter,Roboto,Helvetica,Arial;}
    .wrap{width:${width}px;height:${height}px;display:grid;place-items:center;margin:0 auto;}
    .card{width:980px;border-radius:26px;border:1px solid var(--border);background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
      box-shadow:0 22px 90px rgba(0,0,0,.65);padding:26px;}
    .title{color:var(--ink);font-weight:700;letter-spacing:-.02em;font-size:22px;margin:0 0 12px}
    .sub{color:var(--muted);font-size:14px;line-height:1.5;margin:0 0 18px}

    .banner{
      height:64px;
      border-radius:999px;
      border:1px solid color-mix(in oklab, var(--border) 70%, #fff 30%);
      background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.02));
      box-shadow:0 18px 60px rgba(0,0,0,.45);
      overflow:hidden;
      display:flex;
      align-items:center;
      padding:0 18px;
      gap:14px;
    }
    .badge{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:12px}
    .dot{width:8px;height:8px;border-radius:99px;background:var(--accent);box-shadow:0 0 0 4px rgba(71,184,175,.14)}

    .marquee{position:relative;flex:1;overflow:hidden;}
    .track{display:inline-flex;gap:56px;white-space:nowrap;will-change:transform;animation: scroll 6s linear infinite;}
    .msg{color:var(--ink);font-size:18px;font-weight:650;letter-spacing:-.01em;opacity:.95}
    .sep{color:color-mix(in oklab, var(--muted) 75%, #fff 25%);}

    @keyframes scroll{
      from{ transform: translateX(0); }
      to{ transform: translateX(-50%); }
    }

    /* make it loop cleanly by duplicating content */
    .track > * { flex:0 0 auto; }

    .footer{display:flex;justify-content:space-between;margin-top:16px;color:var(--muted);font-size:12px}
    .kbd{border:1px solid var(--border);border-bottom-color:color-mix(in oklab, var(--border) 50%, #fff 50%);
      padding:4px 8px;border-radius:10px;background:rgba(255,255,255,.03);color:var(--ink);font-weight:650}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1 class="title">Scrolling Banner Card</h1>
      <p class="sub">A fixed top status marquee for Home Assistant — designed to stay readable, subtle, and always-on.</p>

      <div class="banner">
        <div class="badge"><span class="dot"></span><span>Live status</span></div>
        <div class="marquee">
          <div class="track" id="track">
            <span class="msg">Back door: locked</span><span class="sep">•</span>
            <span class="msg">Outside 18.3°C</span><span class="sep">•</span>
            <span class="msg">Lights: 2 on</span><span class="sep">•</span>
            <span class="msg">Washer: done</span><span class="sep">•</span>
            <span class="msg">Next meeting in 15 min</span><span class="sep">•</span>
            <span class="msg">Back door: locked</span><span class="sep">•</span>
            <span class="msg">Outside 18.3°C</span><span class="sep">•</span>
            <span class="msg">Lights: 2 on</span><span class="sep">•</span>
            <span class="msg">Washer: done</span><span class="sep">•</span>
            <span class="msg">Next meeting in 15 min</span><span class="sep">•</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <span>TypeScript • Home Assistant</span>
        <span><span class="kbd">Marquee</span> <span class="kbd">Sticky</span> <span class="kbd">Calm UI</span></span>
      </div>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html);

// Record a short video of the animation
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width, height },
  recordVideo: { dir: videoDir, size: { width, height } },
});
const page = await context.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.waitForTimeout(4200);
await context.close();
await browser.close();

const vid = fs
  .readdirSync(videoDir)
  .find((f) => f.endsWith('.webm') || f.endsWith('.mp4'));
if (!vid) throw new Error('No recorded video found in ' + videoDir);

const inVideo = path.join(videoDir, vid);
const outGif = path.join(uploadsDir, `${outBase}.gif`);

// Convert to GIF with palette for quality
const palette = path.join(uploadsDir, `${outBase}-palette.png`);
execSync(`ffmpeg -y -i "${inVideo}" -vf "fps=20,scale=${width}:-1:flags=lanczos,palettegen" "${palette}"`, { stdio: 'inherit' });
execSync(`ffmpeg -y -i "${inVideo}" -i "${palette}" -lavfi "fps=20,scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5" "${outGif}"`, { stdio: 'inherit' });

console.log('Saved', outGif);
