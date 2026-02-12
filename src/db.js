import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db;

export function getDb() {
  if (!db) throw new Error("DB not initialized");
  return db;
}

function ensureColumn(table, colName, colDefSql) {
  const cols = db.pragma(`table_info(${table})`);
  const has = cols.some((c) => c.name === colName);
  if (!has) {
    db.exec(`alter table ${table} add column ${colDefSql};`);
  }
}

export function initDb() {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "portfolio.sqlite");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    create table if not exists projects (
      id integer primary key,
      slug text unique not null,
      title text not null,
      subtitle text,
      summary text,
      role text,
      timeframe text,
      tools text,
      tags text,
      hero_image text,
      body_markdown text,
      published integer default 0,
      created_at text not null,
      updated_at text not null
    );
  `);

  // Mixed feed support (simple migration)
  ensureColumn("projects", "kind", "kind text default 'project'");
  ensureColumn("projects", "date", "date text");
  ensureColumn("projects", "external_url", "external_url text");

  db.exec(`
    create table if not exists analytics_page_views (
      key text primary key,
      type text not null,          -- 'home' | 'item'
      slug text,
      path text,
      count integer not null default 0,
      updated_at text not null
    );

    create table if not exists analytics_outbound_clicks (
      key text primary key,        -- out:<slug>:<url>
      slug text,
      url text not null,
      source text,
      count integer not null default 0,
      updated_at text not null
    );

    create table if not exists analytics_nav_clicks (
      key text primary key,        -- nav:<section>
      section text not null,
      href text,
      count integer not null default 0,
      updated_at text not null
    );
  `);

  // Seed: if empty, create a draft example
  const count = db.prepare("select count(*) as c from projects").get().c;
  if (count === 0) {
    const now = new Date().toISOString();
    db.prepare(
      `insert into projects (slug,title,subtitle,summary,role,timeframe,tools,tags,hero_image,body_markdown,published,created_at,updated_at,kind,date)
       values (@slug,@title,@subtitle,@summary,@role,@timeframe,@tools,@tags,@hero_image,@body_markdown,@published,@created_at,@updated_at,@kind,@date)`
    ).run({
      slug: "design-system-overhaul",
      title: "Design system & UI consistency overhaul",
      subtitle: "Scaling a B2B HR platform with a component-first approach",
      summary:
        "Built a reusable component library and patterns to improve consistency, accessibility, and speed of delivery.",
      role: "UI/UX Designer (Product)",
      timeframe: "2024",
      tools: "Figma, Design tokens, Component library",
      tags: "Design System, UI, Accessibility",
      hero_image: "",
      body_markdown:
        "## Context\nActiv People HR is a complex B2B HR platform. Over time, inconsistency and duplicated UI patterns increased design + dev effort.\n\n## What I did\n- Audited UI patterns and documented inconsistencies\n- Created core components (buttons, inputs, tables, modals)\n- Defined typography/spacing and interaction patterns\n\n## Outcome\n- Faster design → dev handoff\n- Cleaner UI and fewer edge-case bugs\n",
      published: 0,
      created_at: now,
      updated_at: now,
      kind: "project",
      date: "2024-06-01",
    });

    db.prepare(
      `insert into projects (slug,title,subtitle,summary,role,timeframe,tools,tags,hero_image,body_markdown,published,created_at,updated_at,kind,date)
       values (@slug,@title,@subtitle,@summary,@role,@timeframe,@tools,@tags,@hero_image,@body_markdown,@published,@created_at,@updated_at,@kind,@date)`
    ).run({
      slug: "building-a-drawer-component",
      title: "Building a Drawer Component",
      subtitle: "A reusable pattern for dense B2B workflows",
      summary: "A practical breakdown of the UX decisions behind a robust drawer pattern.",
      role: "",
      timeframe: "",
      tools: "",
      tags: "Components, UX",
      hero_image: "",
      body_markdown:
        "## Why drawers?\nDrawers are great for keeping context while editing details.\n\n## Key decisions\n- Focus management\n- Escape/backdrop behaviour\n- Scroll handling\n\n## Notes\nWrite-up goes here.\n",
      published: 0,
      created_at: now,
      updated_at: now,
      kind: "component",
      date: "2025-12-01",
    });
  }
}
