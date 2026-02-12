import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { getDb } from "../db.js";
import { renderMarkdown } from "../markdown.js";

export const adminRouter = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function extFromMime(mime) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return "";
}

function isLocalUploadUrl(url) {
  return typeof url === "string" && url.startsWith("/uploads/");
}

function removeLocalUpload(url) {
  if (!isLocalUploadUrl(url)) return;
  const fp = path.join(UPLOAD_DIR, path.basename(url));
  try {
    fs.unlinkSync(fp);
  } catch {
    // ignore
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const id = crypto.randomBytes(16).toString("hex");
      const ext = extFromMime(file.mimetype) || path.extname(file.originalname || "");
      cb(null, `${id}${ext.toLowerCase()}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.mimetype
    );
    cb(ok ? null : new Error("Unsupported image type"), ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

function normalizeKind(kind) {
  const k = String(kind || "").toLowerCase();
  if (["", "all"].includes(k)) return "all";
  if (["projects", "project"].includes(k)) return "project";
  if (["labs", "lab"].includes(k)) return "lab";
  if (["writing", "post", "posts"].includes(k)) return "writing";
  if (["component", "components"].includes(k)) return "component";
  return "all";
}

adminRouter.get("/", (req, res) => {
  const db = getDb();
  const kind = normalizeKind(req.query.kind);
  const q = String(req.query.q || "").trim();

  const where = ["1=1"];
  const params = [];
  if (["project", "lab", "writing", "component"].includes(kind)) {
    where.push("kind=?");
    params.push(kind);
  }
  if (q) {
    where.push("(title like ? or slug like ?)");
    params.push(`%${q}%`, `%${q}%`);
  }

  const projects = db
    .prepare(
      `select id,slug,title,kind,published,updated_at,created_at,date
       from projects
       where ${where.join(" and ")}
       order by coalesce(date, updated_at, created_at) desc`
    )
    .all(...params);

  const counts = db
    .prepare(
      `select kind,
              sum(case when published=1 then 1 else 0 end) as published,
              sum(case when published=0 then 1 else 0 end) as draft,
              count(*) as total
       from projects
       group by kind`
    )
    .all();

  const totals = counts.reduce(
    (acc, r) => {
      acc.published += r.published || 0;
      acc.draft += r.draft || 0;
      acc.total += r.total || 0;
      return acc;
    },
    { published: 0, draft: 0, total: 0 }
  );

  const homeViews =
    db.prepare("select count from analytics_page_views where key='home'").get()
      ?.count || 0;

  const itemViewsTotal = db
    .prepare(
      "select coalesce(sum(count),0) as c from analytics_page_views where type='item'"
    )
    .get().c;

  const outboundTotal = db
    .prepare("select coalesce(sum(count),0) as c from analytics_outbound_clicks")
    .get().c;

  const topItem = db
    .prepare(
      `select pv.slug, pv.count, coalesce(p.title, pv.slug) as title
       from analytics_page_views pv
       left join projects p on p.slug = pv.slug
       where pv.type='item'
       order by pv.count desc
       limit 1`
    )
    .get();

  res.render("admin/index", {
    projects,
    filters: { kind, q },
    counts: { totals, byKind: Object.fromEntries(counts.map((r) => [r.kind, r])) },
    stats: {
      homeViews,
      itemViewsTotal,
      outboundTotal,
      topItem: topItem || null,
    },
  });
});

adminRouter.get("/reports", (req, res) => {
  const db = getDb();

  const homeViews =
    db.prepare("select count from analytics_page_views where key='home'").get()
      ?.count || 0;

  const itemViewsTotal = db
    .prepare(
      "select coalesce(sum(count),0) as c from analytics_page_views where type='item'"
    )
    .get().c;

  const topItems = db
    .prepare(
      `select pv.slug, pv.count, coalesce(p.title, pv.slug) as title
       from analytics_page_views pv
       left join projects p on p.slug = pv.slug
       where pv.type='item'
       order by pv.count desc
       limit 10`
    )
    .all();

  const outboundTotal = db
    .prepare("select coalesce(sum(count),0) as c from analytics_outbound_clicks")
    .get().c;

  const topOutbound = db
    .prepare(
      `select slug, url, source, count
       from analytics_outbound_clicks
       order by count desc
       limit 10`
    )
    .all();

  const navClicks = db
    .prepare(
      `select section, href, count
       from analytics_nav_clicks
       order by count desc`
    )
    .all();

  res.render("admin/reports", {
    homeViews,
    itemViewsTotal,
    topItems,
    outboundTotal,
    topOutbound,
    navClicks,
  });
});

adminRouter.post("/markdown/preview", (req, res) => {
  const md = req.body?.markdown;
  const html = renderMarkdown(String(md || ""));
  res.json({ ok: true, html });
});

adminRouter.get("/new", (req, res) => {
  res.render("admin/edit", { project: null, error: null });
});

adminRouter.post("/new", (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const p = {
    slug: req.body.slug,
    title: req.body.title,
    subtitle: req.body.subtitle || "",
    summary: req.body.summary || "",
    role: req.body.role || "",
    timeframe: req.body.timeframe || "",
    tools: req.body.tools || "",
    tags: req.body.tags || "",
    hero_image: "",
    external_url: req.body.external_url || "",
    body_markdown: req.body.body_markdown || "",
    published: req.body.published ? 1 : 0,
    kind: req.body.kind || "project",
    date: req.body.date || "",
    created_at: now,
    updated_at: now,
  };

  try {
    db.prepare(
      `insert into projects (slug,title,subtitle,summary,role,timeframe,tools,tags,hero_image,external_url,body_markdown,published,created_at,updated_at,kind,date)
       values (@slug,@title,@subtitle,@summary,@role,@timeframe,@tools,@tags,@hero_image,@external_url,@body_markdown,@published,@created_at,@updated_at,@kind,@date)`
    ).run(p);
    res.redirect("/admin");
  } catch (e) {
    res.status(400).render("admin/edit", { project: p, error: String(e) });
  }
});

adminRouter.get("/edit/:id", (req, res) => {
  const db = getDb();
  const project = db
    .prepare("select * from projects where id=?")
    .get(req.params.id);
  if (!project) return res.status(404).render("404");
  res.render("admin/edit", { project, error: null });
});

adminRouter.post("/edit/:id", (req, res) => {
  const db = getDb();
  const now = new Date().toISOString();
  const id = Number(req.params.id);
  const p = {
    id,
    slug: req.body.slug,
    title: req.body.title,
    subtitle: req.body.subtitle || "",
    summary: req.body.summary || "",
    role: req.body.role || "",
    timeframe: req.body.timeframe || "",
    tools: req.body.tools || "",
    tags: req.body.tags || "",
    external_url: req.body.external_url || "",
    body_markdown: req.body.body_markdown || "",
    published: req.body.published ? 1 : 0,
    kind: req.body.kind || "project",
    date: req.body.date || "",
    updated_at: now,
  };

  try {
    db.prepare(
      `update projects set
        slug=@slug,title=@title,subtitle=@subtitle,summary=@summary,role=@role,timeframe=@timeframe,
        tools=@tools,tags=@tags,external_url=@external_url,body_markdown=@body_markdown,published=@published,updated_at=@updated_at,
        kind=@kind,date=@date
       where id=@id`
    ).run(p);
    res.redirect("/admin");
  } catch (e) {
    res
      .status(400)
      .render("admin/edit", { project: { ...req.body, id }, error: String(e) });
  }
});

adminRouter.post("/toggle-publish/:id", (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);

  db.prepare(
    `update projects
     set published = case when published=1 then 0 else 1 end,
         updated_at = ?
     where id=?`
  ).run(new Date().toISOString(), id);

  const redirectTo = String(req.body.redirect || "/admin");
  res.redirect(redirectTo);
});

adminRouter.post("/delete/:id", (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);

  const prev = db.prepare("select hero_image from projects where id=?").get(id);
  if (prev?.hero_image) removeLocalUpload(prev.hero_image);

  db.prepare("delete from projects where id=?").run(id);
  res.redirect("/admin");
});

adminRouter.post("/upload-hero/:id", upload.single("hero"), (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const file = req.file;
  if (!file) return res.status(400).send("No file");

  // Delete old hero file if it was a local upload
  const prev = db.prepare("select hero_image from projects where id=?").get(id);
  if (prev?.hero_image) removeLocalUpload(prev.hero_image);

  db.prepare("update projects set hero_image=?, updated_at=? where id=?").run(
    `/uploads/${path.basename(file.filename)}`,
    new Date().toISOString(),
    id
  );
  res.redirect(`/admin/edit/${id}`);
});

adminRouter.post("/remove-hero/:id", (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);

  const prev = db.prepare("select hero_image from projects where id=?").get(id);
  if (prev?.hero_image) removeLocalUpload(prev.hero_image);

  db.prepare("update projects set hero_image='', updated_at=? where id=?").run(
    new Date().toISOString(),
    id
  );
  res.redirect(`/admin/edit/${id}`);
});
