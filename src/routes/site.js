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

function loadOtherTopicCategories(db) {
  return db
    .prepare(
      `select key, label, order_index
       from other_topic_categories
       order by order_index asc, label asc`
    )
    .all();
}

siteRouter.get("/", requireSiteAccess, (req, res) => {
  try {
    trackHomeView(req);
  } catch {}

  const db = getDb();
  const categories = loadOtherTopicCategories(db);
  const requested = String(req.query.topic || "").toLowerCase();
  const activeTopic = requested && categories.some((c) => c.key === requested) ? requested : "all";

  const where = activeTopic === "all" ? "" : "and category=?";
  const params = activeTopic === "all" ? [] : [activeTopic];

  const items = db
    .prepare(
      `select slug,title,subtitle,summary,tags,hero_image,kind,category,date,created_at
       from projects
       where published=1 and kind='other' ${where}
       order by coalesce(date, created_at) desc`
    )
    .all(...params);

  const labelByKey = new Map(categories.map((c) => [c.key, c.label]));
  const itemsWithLabel = items.map((it) => ({
    ...it,
    kindLabel: labelByKey.get(it.category) || "Other",
  }));

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
      `select category, count(*) as c
       from projects
       where published=1 and kind='other'
       group by category`
    )
    .all();
  const countMap = new Map(counts.map((r) => [r.category || "", r.c]));
  const total = counts.reduce((acc, r) => acc + (r.c || 0), 0);

  const topics = [
    { key: "all", label: "All", count: total, href: "/?topic=all#topics" },
    ...(categories || []).map((c) => ({
      key: c.key,
      label: c.label,
      count: countMap.get(c.key) || 0,
      href: `/?topic=${encodeURIComponent(c.key)}#topics`,
    })),
  ];

  const baseUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const canonical = baseUrl ? `${baseUrl}/` : "/";

  res.render("home", {
    meta: {
      title: "Callum Radmilovic — UI/UX Portfolio",
      description:
        "UI/UX Product Designer in London. Calm SaaS for complex workflows — case studies, blogs, components.",
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
    items: itemsWithLabel,
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
        title: "Research",
        items: [
          { key: "interviews", label: "Interviews" },
          { key: "heuristics", label: "Heuristics" },
          { key: "testing", label: "Usability testing" },
        ],
      },
      {
        title: "Delivery",
        items: [
          { key: "handoff", label: "Handoff" },
          { key: "docs", label: "Documentation" },
          { key: "qa", label: "QA" },
        ],
      },
    ],
  });
});

siteRouter.get("/about", requireSiteAccess, (req, res) => {
  const baseUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const canonical = baseUrl ? `${baseUrl}/about` : "/about";

  res.render("about", {
    meta: {
      title: "About — Callum Radmilovic",
      description: "Background, approach, and what I care about.",
      canonical,
      ogImage: baseUrl ? `${baseUrl}/public/avatar.jpg` : "/public/avatar.jpg",
    },
  });
});

siteRouter.get("/project/:slug", requireSiteAccess, (req, res) => {
  const db = getDb();
  const slug = String(req.params.slug || "");

  const project = db
    .prepare(
      `select * from projects
       where slug=? and kind in ('project','lab') and published=1
       limit 1`
    )
    .get(slug);

  if (!project) return res.status(404).render("404");

  try {
    trackItemView(req, { slug, kind: project.kind });
  } catch {}

  const html = renderMarkdown(String(project.body_markdown || ""));

  const baseUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const canonical = baseUrl ? `${baseUrl}/project/${project.slug}` : `/project/${project.slug}`;

  res.render("project", {
    meta: {
      title: `${project.title} — Callum Radmilovic`,
      description: project.summary || "",
      canonical,
      ogImage: baseUrl
        ? `${baseUrl}${project.hero_image || "/public/avatar.jpg"}`
        : project.hero_image || "/public/avatar.jpg",
    },
    name: "Callum Radmilovic",
    item: {
      ...project,
      kindLabel: project.kind === "lab" ? "Lab" : "Projects",
    },
    bodyHtml: html,
  });
});

siteRouter.get("/item/:slug", requireSiteAccess, (req, res) => {
  const db = getDb();
  const slug = String(req.params.slug || "");

  const item = db
    .prepare(
      `select * from projects
       where slug=? and published=1
       limit 1`
    )
    .get(slug);

  if (!item) return res.status(404).render("404");

  try {
    trackItemView(req, { slug, kind: item.kind });
  } catch {}

  const html = renderMarkdown(String(item.body_markdown || ""));

  const baseUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const canonical = baseUrl
    ? `${baseUrl}/${["project", "lab"].includes(item.kind) ? "project" : "item"}/${item.slug}`
    : `/${["project", "lab"].includes(item.kind) ? "project" : "item"}/${item.slug}`;

  const categories = loadOtherTopicCategories(db);
  const labelByKey = new Map(categories.map((c) => [c.key, c.label]));

  res.render("project", {
    meta: {
      title: `${item.title} — Callum Radmilovic`,
      description: item.summary || "",
      canonical,
      ogImage: baseUrl
        ? `${baseUrl}${item.hero_image || "/public/avatar.jpg"}`
        : item.hero_image || "/public/avatar.jpg",
    },
    name: "Callum Radmilovic",
    item: {
      ...item,
      kindLabel:
        item.kind === "lab"
          ? "Lab"
          : item.kind === "project"
            ? "Projects"
            : item.kind === "other"
              ? (labelByKey.get(item.category) || "Other")
              : "Other",
    },
    bodyHtml: html,
  });
});
