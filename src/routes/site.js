import express from "express";
import { getDb } from "../db.js";
import { requireSiteAccess } from "../auth.js";
import { renderMarkdown } from "../markdown.js";
import {
  trackHomeView,
  trackItemView,
  trackOutboundClick,
  trackNavClick,
} from "../analytics.js";

export const siteRouter = express.Router();

// --- SEO helpers ---
siteRouter.get("/robots.txt", (req, res) => {
  const gated = !!process.env.SITE_PASSWORD_HASH;
  res.type("text/plain");
  if (gated) {
    return res.send("User-agent: *\nDisallow: /\n");
  }
  return res.send("User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n");
});

siteRouter.get("/sitemap.xml", (req, res) => {
  const gated = !!process.env.SITE_PASSWORD_HASH;
  if (gated) {
    // Don't leak private URLs when gated
    res.type("application/xml");
    return res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`
    );
  }

  const baseUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  if (!baseUrl) {
    return res.status(500).type("text/plain").send("Missing SITE_URL");
  }

  const db = getDb();
  const rows = db
    .prepare(
      `select slug, kind, updated_at, created_at
       from projects
       where published=1`
    )
    .all();

  const urls = [
    { loc: `${baseUrl}/`, lastmod: new Date().toISOString() },
    { loc: `${baseUrl}/about`, lastmod: new Date().toISOString() },
  ];

  rows.forEach((r) => {
    const path = ["project", "lab"].includes(r.kind) ? `/project/${r.slug}` : `/item/${r.slug}`;
    urls.push({
      loc: `${baseUrl}${path}`,
      lastmod: r.updated_at || r.created_at || new Date().toISOString(),
    });
  });

  res.type("application/xml");
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${u.loc}</loc><lastmod>${String(u.lastmod).slice(0, 10)}</lastmod></url>`
      )
      .join("\n") +
    `\n</urlset>`;
  res.send(body);
});

// Lightweight analytics endpoint (uses same site access gate as the UI)
siteRouter.post("/analytics/event", requireSiteAccess, (req, res) => {
  const { type } = req.body || {};

  try {
    if (type === "outbound") {
      trackOutboundClick(req, {
        slug: req.body.slug,
        url: req.body.url,
        source: req.body.source,
      });
    } else if (type === "nav") {
      trackNavClick(req, { section: req.body.section, href: req.body.href });
    }
  } catch (e) {
    // swallow errors; analytics should never break UX
    console.warn("analytics event failed", e);
  }

  res.json({ ok: true });
});

function normalizeKind(kind) {
  const k = (kind || "").toLowerCase();
  if (["all", ""].includes(k)) return "all";
  if (["writing", "post", "posts"].includes(k)) return "writing";
  if (["components", "component"].includes(k)) return "component";
  if (["ux", "case-study", "casestudy", "case studies"].includes(k)) return "ux";
  if (["projects", "project"].includes(k)) return "project";
  return "all";
}

function kindLabel(kind) {
  if (kind === "project") return "Projects";
  if (kind === "lab") return "Lab";
  if (kind === "writing") return "Writing";
  if (kind === "component") return "Components";
  if (kind === "ux") return "UX";
  return "Other";
}

siteRouter.get("/", requireSiteAccess, (req, res) => {
  try { trackHomeView(req); } catch {}
  const db = getDb();
  const activeTopic = normalizeKind(req.query.topic);

  const where =
    activeTopic === "all"
      ? "and kind in ('writing','component','ux')"
      : "and kind=?";
  const params = activeTopic === "all" ? [] : [activeTopic];

  const items = db
    .prepare(
      `select slug,title,subtitle,summary,tags,hero_image,kind,date,created_at
       from projects
       where published=1 ${where}
       order by coalesce(date, created_at) desc`
    )
    .all(...params)
    .map((it) => ({ ...it, kindLabel: kindLabel(it.kind) }));

  const work = db
    .prepare(
      `select slug,title,subtitle,summary,hero_image,external_url,date,created_at
       from projects
       where published=1 and kind='project'
       order by coalesce(date, created_at) desc
       limit 4`
    )
    .all();

  const lab = db
    .prepare(
      `select slug,title,subtitle,summary,hero_image,external_url,date,created_at
       from projects
       where published=1 and kind='lab'
       order by coalesce(date, created_at) desc
       limit 4`
    )
    .all();

  const counts = db
    .prepare(
      `select kind, count(*) as c from projects where published=1 group by kind`
    )
    .all();
  const countMap = new Map(counts.map((r) => [r.kind, r.c]));
  const total = counts.reduce((acc, r) => acc + r.c, 0);

  const topics = [
    // Keep the user in the "Other topics" section when switching tabs.
    { key: "all", label: "All", count: total, href: "/?topic=all#topics" },
    {
      key: "ux",
      label: "UX",
      count: countMap.get("ux") || 0,
      href: "/?topic=ux#topics",
    },
    {
      key: "writing",
      label: "Writing",
      count: countMap.get("writing") || 0,
      href: "/?topic=writing#topics",
    },
    {
      key: "component",
      label: "Components",
      count: countMap.get("component") || 0,
      href: "/?topic=component#topics",
    },
    {
      key: "project",
      label: "Projects",
      count: countMap.get("project") || 0,
      href: "/?topic=project#topics",
    },
  ];

  const baseUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const canonical = baseUrl ? `${baseUrl}/` : "/";

  res.render("home", {
    meta: {
      title: "Callum Radmilovic — UI/UX Portfolio",
      description:
        "UI/UX Product Designer in London. Calm SaaS for complex workflows — case studies, writing, components.",
      canonical,
      ogImage: baseUrl ? `${baseUrl}/public/avatar.jpg` : "/public/avatar.jpg",
    },
    name: "Callum Radmilovic",
    role: "UI/UX Designer at Activ People HR",
    location: "London, UK",
    availability: "Available for work",
    headline: "Designing calm SaaS\nfor complex workflows",
    tagline:
      "UI/UX Product Designer with 4+ years’ experience across HR, compliance, and complex systems — focused on usability, accessibility, and outcomes.",
    aboutParas: [
      "I’m a UI/UX Product Designer with 4+ years’ experience designing and shipping SaaS products, with a focus on HR, compliance, and workflow-heavy systems.",
      "At Activ People HR, I’ve led UI/UX initiatives used by 200,000+ users globally, bringing consistency across modules and improving end-to-end journeys on web and mobile.",
      "I collaborate closely with Product, Engineering, and leadership to deliver accessible, intuitive interfaces, using research and data to guide decisions and refine the details that matter.",
    ],
    bookingUrl: "https://cal.com/",
    links: [
      { label: "X", href: "https://x.com/" },
      { label: "Dribbble", href: "https://dribbble.com/" },
      { label: "GitHub", href: "https://github.com/calrxd" },
      { label: "LinkedIn", href: "https://www.linkedin.com/" },
    ],
    activeTopic,
    topics,
    items,
    work,
    lab,
    timeline: [
      {
        range: "Apr 2022 — Present",
        title: "Lead UI/UX Designer",
        org: "Activ People HR",
      },
      {
        range: "Mar 2021 — Apr 2022",
        title: "UI/UX Designer",
        org: "Activ People HR",
      },
      {
        range: "May 2020 — Mar 2021",
        title: "Lead Technical Analyst",
        org: "CGI",
      },
      {
        range: "Jan 2020 — May 2020",
        title: "Technical Analyst",
        org: "CGI",
      },
    ],
    toolkit: [
      {
        title: "Design",
        items: [
          { key: "figma", label: "Figma" },
          { key: "adobe", label: "Adobe" },
          { key: "tokens", label: "Design tokens" },
        ],
      },
      {
        title: "Development",
        items: [
          { key: "vscode", label: "VS Code" },
          { key: "github", label: "GitHub" },
          { key: "ts", label: "TypeScript" },
          { key: "antigravity", label: "Antigravity" },
        ],
      },
      {
        title: "AI & Assistive Tools",
        items: [
          { key: "openclaw", label: "OpenClaw" },
          { key: "chatgpt", label: "ChatGPT" },
        ],
      },
    ],
  });
});

function renderItem(req, res, item) {
  const bodyHtml = renderMarkdown(item.body_markdown || "");

  // Basic SEO meta
  const baseUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const urlPath = item.kind === "project" || item.kind === "lab" ? `/project/${item.slug}` : `/item/${item.slug}`;
  const canonical = baseUrl ? `${baseUrl}${urlPath}` : urlPath;

  const desc = (item.summary || item.subtitle || "").trim();
  const ogImage = item.hero_image && baseUrl && item.hero_image.startsWith("/")
    ? `${baseUrl}${item.hero_image}`
    : (item.hero_image || "");

  return res.render("project", {
    name: "Callum Radmilovic",
    item: { ...item, kindLabel: kindLabel(item.kind) },
    bodyHtml,
    meta: {
      title: `${item.title} — Callum Radmilovic`,
      description: desc,
      canonical,
      ogImage,
    },
  });
}

// Projects / Work items
siteRouter.get("/project/:slug", requireSiteAccess, (req, res) => {
  try { trackItemView(req, req.params.slug); } catch {}
  const db = getDb();
  const item = db
    .prepare(
      "select * from projects where slug=? and published=1 and kind in ('project','lab')"
    )
    .get(req.params.slug);
  if (!item) return res.status(404).render("404");
  return renderItem(req, res, item);
});

// Other topics item page (and back-compat)
siteRouter.get("/item/:slug", requireSiteAccess, (req, res) => {
  try { trackItemView(req, req.params.slug); } catch {}
  const db = getDb();
  const item = db
    .prepare("select * from projects where slug=? and published=1")
    .get(req.params.slug);
  if (!item) return res.status(404).render("404");

  // Keep URLs consistent: work items should live under /project/
  if (["project", "lab"].includes(item.kind)) {
    return res.redirect(302, `/project/${encodeURIComponent(item.slug)}`);
  }

  return renderItem(req, res, item);
});

siteRouter.get("/about", requireSiteAccess, (req, res) => {
  res.render("about", { name: "Callum Radmilovic" });
});

// Placeholder contact page (simple)
siteRouter.get("/contact", requireSiteAccess, (req, res) => {
  res.redirect(302, "mailto:you@example.com");
});
