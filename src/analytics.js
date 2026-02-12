import { getDb } from "./db.js";

function nowIso() {
  return new Date().toISOString();
}

function isProbablyBot(req) {
  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  // very lightweight bot heuristic; keep minimal to avoid false negatives
  return /(bot|spider|crawl|slurp|facebookexternalhit|preview)/.test(ua);
}

function upsertCounter(table, key, fields = {}) {
  const db = getDb();
  const updated_at = nowIso();

  const cols = ["key", ...Object.keys(fields), "count", "updated_at"];
  const placeholders = cols.map((c) => `@${c}`).join(",");
  const setFields = [...Object.keys(fields).map((c) => `${c}=excluded.${c}`), "updated_at=excluded.updated_at"].join(",");

  const stmt = db.prepare(
    `insert into ${table} (${cols.join(",")}) values (${placeholders})\n     on conflict(key) do update set\n       count = count + 1,\n       ${setFields}`
  );

  stmt.run({ key, ...fields, count: 1, updated_at });
}

export function trackHomeView(req) {
  if (isProbablyBot(req)) return;
  upsertCounter("analytics_page_views", "home", { type: "home", path: "/" });
}

export function trackItemView(req, slug) {
  if (isProbablyBot(req)) return;
  upsertCounter("analytics_page_views", `item:${slug}`, {
    type: "item",
    slug,
    path: `/item/${slug}`,
  });
}

export function trackOutboundClick(req, { slug, url, source = "" } = {}) {
  if (isProbablyBot(req)) return;
  if (!url) return;
  const safeSlug = slug || "";
  const key = `out:${safeSlug}:${url}`;
  upsertCounter("analytics_outbound_clicks", key, {
    slug: safeSlug,
    url,
    source,
  });
}

export function trackNavClick(req, { section, href = "" } = {}) {
  if (isProbablyBot(req)) return;
  if (!section) return;
  const key = `nav:${section}`;
  upsertCounter("analytics_nav_clicks", key, { section, href });
}
