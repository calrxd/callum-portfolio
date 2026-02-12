# Callum Radmilovic — UI/UX Portfolio

Minimal portfolio site (HTML/CSS/JS) with a tiny backend so you can add/edit projects.

## Features
- Public portfolio pages (Home, Project detail, About)
- Admin panel to add/edit projects (Markdown body + hero image upload)
- Optional **password protection** for visitors

## Setup

```bash
cd Callum-Portfolio
cp .env.example .env

# Create password hashes
node scripts/hash-password.mjs "ADMIN_PASSWORD"   # paste into ADMIN_PASSWORD_HASH
node scripts/hash-password.mjs "SITE_PASSWORD"    # paste into SITE_PASSWORD_HASH (optional)

npm i
npm run dev
```

Open:
- Site: http://localhost:3020
- Admin: http://localhost:3020/admin

## Notes
- Data is stored in `data/portfolio.sqlite`.
- Uploaded images go to `uploads/`.
- For SEO (sitemap/canonicals), set `SITE_URL` (e.g. `https://callumrad.co.uk`).
- If deploying behind a reverse proxy, set `TRUST_PROXY=1`.
- If you deploy publicly behind HTTPS, set `COOKIE_SECURE=1` (or `NODE_ENV=production`).
