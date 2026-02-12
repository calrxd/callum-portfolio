import express from "express";
import bcrypt from "bcryptjs";

export const authRouter = express.Router();

function getAdminHash() {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error(
      "Missing ADMIN_PASSWORD_HASH. Create one with: node scripts/hash-password.mjs <password>"
    );
  }
  return hash;
}

export function requireAuth(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.redirect(`/auth/login?next=${encodeURIComponent(req.originalUrl)}`);
}

function safeNext(next, fallback) {
  const n = String(next || "");
  if (n.startsWith("/") && !n.startsWith("//")) return n;
  return fallback;
}

// Very small brute-force throttle (memory-only)
const loginAttempts = new Map();
function bumpAttempt(ip) {
  const now = Date.now();
  const row = loginAttempts.get(ip) || { count: 0, first: now };
  if (now - row.first > 15 * 60 * 1000) {
    row.count = 0;
    row.first = now;
  }
  row.count += 1;
  loginAttempts.set(ip, row);
  return row;
}
function isLocked(ip) {
  const row = loginAttempts.get(ip);
  if (!row) return false;
  if (Date.now() - row.first > 15 * 60 * 1000) return false;
  return row.count >= 25;
}

authRouter.get("/login", (req, res) => {
  const next = safeNext(req.query.next, "/admin");
  res.render("login", { error: null, next });
});

authRouter.post("/login", async (req, res) => {
  const { password } = req.body;
  const next = safeNext(req.body.next, "/admin");

  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  if (isLocked(ip)) {
    return res
      .status(429)
      .render("login", { error: "Too many attempts. Try again later.", next });
  }

  try {
    const ok = await bcrypt.compare(password || "", getAdminHash());
    if (!ok) {
      bumpAttempt(ip);
      return res.status(401).render("login", { error: "Wrong password", next });
    }

    // success: reset attempts for this ip
    loginAttempts.delete(ip);

    req.session.isAdmin = true;
    res.redirect(next);
  } catch (e) {
    res.status(500).render("login", { error: String(e), next });
  }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// Optional: site gate (viewer password)
export function isSiteGated() {
  return !!process.env.SITE_PASSWORD_HASH;
}

export async function checkSitePassword(pass) {
  const hash = process.env.SITE_PASSWORD_HASH;
  if (!hash) return true;
  return bcrypt.compare(pass || "", hash);
}

export function requireSiteAccess(req, res, next) {
  if (!isSiteGated()) return next();
  if (req.session?.siteAccess) return next();
  return res.redirect(`/auth/site-login?next=${encodeURIComponent(req.originalUrl)}`);
}

authRouter.get("/site-login", (req, res) => {
  const next = safeNext(req.query.next, "/");
  res.render("site-login", { error: null, next });
});

authRouter.post("/site-login", async (req, res) => {
  const { password } = req.body;
  const next = safeNext(req.body.next, "/");

  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  if (isLocked(ip)) {
    return res
      .status(429)
      .render("site-login", { error: "Too many attempts. Try again later.", next });
  }

  try {
    const ok = await checkSitePassword(password);
    if (!ok) {
      bumpAttempt(ip);
      return res.status(401).render("site-login", { error: "Wrong password", next });
    }

    loginAttempts.delete(ip);

    req.session.siteAccess = true;
    res.redirect(next);
  } catch (e) {
    res.status(500).render("site-login", { error: String(e), next });
  }
});
