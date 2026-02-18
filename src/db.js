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
  // Other-topics categories (used when kind='other')
  ensureColumn("projects", "category", "category text");

  db.exec(`
    create table if not exists other_topic_categories (
      key text primary key,
      label text not null,
      order_index integer not null default 0
    );

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

  // Seed default Other Topics categories
  const catCount = db.prepare("select count(*) as c from other_topic_categories").get().c;
  if (catCount === 0) {
    db.prepare(
      "insert into other_topic_categories (key,label,order_index) values (?,?,?)"
    ).run("ux", "UX", 10);
    db.prepare(
      "insert into other_topic_categories (key,label,order_index) values (?,?,?)"
    ).run("blogs", "Blogs", 20);
    db.prepare(
      "insert into other_topic_categories (key,label,order_index) values (?,?,?)"
    ).run("components", "Components", 30);
  }

  // Migration: old kinds (ux/writing/component) now become kind='other' with a category
  // (idempotent)
  db.prepare(
    `update projects
     set kind='other',
         category=case
           when kind='writing' then 'blogs'
           when kind='component' then 'components'
           else kind
         end
     where kind in ('ux','writing','component') and (category is null or category='')`
  ).run();

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
        "## Context\nActiv People HR is a complex B2B HR platform. Over time, inconsistency and duplicated UI patterns increased design + dev effort.\n\n## What I did\n1 Audit UI patterns and document inconsistencies\n2 Create core components such as buttons inputs tables modals\n3 Define typography spacing and interaction patterns\n\n## Outcome\n1 Faster design to dev handoff\n2 Cleaner UI and fewer edge case bugs\n",
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
        "## Why drawers\nDrawers are great for keeping context while editing details\n\n## Key decisions\n1 Focus management\n2 Escape and backdrop behaviour\n3 Scroll handling\n\n## Notes\nWrite up goes here\n",
      published: 0,
      created_at: now,
      updated_at: now,
      kind: "component",
      date: "2025-12-01",
    });
  }

  // Calendar UI lab entry
  // You already have a Calendar UI lab item in the database.
  // Keep it as the single source of truth and ensure it has the right content.

  // Remove any accidental duplicate created by older code
  db.prepare("delete from projects where slug = ?").run("calendarui");

  const calendarSlug = "calendar-ui";
  const hasCalendar = db
    .prepare("select 1 as ok from projects where slug = ? limit 1")
    .get(calendarSlug);

  const now = new Date().toISOString();

  const calendarPayload = {
    title: "Calendar UI",
    subtitle: "Responsive calendar components and outcomes",
    summary: "A component focused calendar UI explored in Figma with responsive outcomes.",
    role: "UI UX design and component system",
    timeframe: "2026",
    tools: "Figma components variants and constraints",
    tags: "Lab Components",
    hero_image: "",
    body_markdown:
      "## Overview\nCalendar UI is a lab project built in Figma to explore a component driven calendar that starts mobile first and becomes desktop ready without changing the underlying system\n\nThe intent was to prove that a calendar can stay calm and touch friendly on small screens and still support dense planning on larger screens\n\n## Problem framing\nCalendars fail when density increases\nThey become visually noisy\nThey hide important states\nThey rely on tiny click targets\n\nThis work focuses on building a component set that can absorb complexity while keeping the interface readable\n\n## Mobile first foundations\nMobile was the starting point because it forces clarity\n\nPrinciples\n\n1. One primary action at a time\n2. Large hit targets and predictable gestures\n3. Strong typographic hierarchy for scanning\n4. Controlled overflow so the layout does not collapse\n\n## Component exports\nEach export below includes the reason the component exists and what it protects in the system\n\n### Typography\nTypography sets the reading order\nIt keeps time labels and event titles legible at small sizes\nIt also ensures headings do not overpower dense grid content\n\n<div class=\"typographyScale\">\n  <div class=\"tsRow\">\n    <div class=\"tsMeta\">Display</div>\n    <div class=\"tsSample tsDisplay\">Responsive calendar</div>\n  </div>\n  <div class=\"tsRow\">\n    <div class=\"tsMeta\">Heading</div>\n    <div class=\"tsSample tsH2\">Week view</div>\n  </div>\n  <div class=\"tsRow\">\n    <div class=\"tsMeta\">Body</div>\n    <div class=\"tsSample tsBody\">Event title with supporting detail</div>\n  </div>\n  <div class=\"tsRow\">\n    <div class=\"tsMeta\">Label</div>\n    <div class=\"tsSample tsLabel\">Today</div>\n  </div>\n</div>\n\n### Calendar buttons\nButtons are built for touch first\nThey use consistent sizing and spacing so actions remain reliable across views\n\n![Calendar buttons](/public/calendarui/calendar_buttons.png)\n\n### Tool bar\nThe tool bar groups navigation view switching and filtering\nIt is designed to collapse cleanly on mobile and expand on desktop without redesign\n\n![Tool bar](/public/calendarui/tool_bar.png)\n\n### Sidebar\nThe sidebar holds supporting context such as filters and quick actions\nOn mobile it becomes secondary so the main timeline stays readable\n\n![Sidebar](/public/calendarui/sidebar.png)\n\n### Grid\nThe grid is the structural backbone\nIt defines rhythm alignment and spacing so events feel predictable\n\n![Grid](/public/calendarui/grid.png)\n\n### Column\nColumns control layout at higher density\nThey allow parallel context without losing the time axis\n\n![Column](/public/calendarui/column.png)\n\n### Slot\nSlots define interactive areas for placing and reading events\nThey also manage hover and selection states on desktop while remaining touch friendly\n\n![Slot](/public/calendarui/slot.png)\n\n### Event types\nEvent types communicate category and priority\nThey reduce cognitive load by making scanning faster\n\n![Event types](/public/calendarui/event_types.png)\n\n### Calendar day small\nThe small day component supports compact surfaces\nIt keeps the calendar usable when space is limited\n\n![Calendar day small](/public/calendarui/calendar_day_small.png)\n\n### Label type\nLabels create a consistent language for metadata\nThey keep the interface calm by reducing bespoke styling\n\n![Label type](/public/calendarui/label_type.png)\n\n### Label left group\nThis label group supports left aligned layouts and stacked contexts\nIt prevents alignment drift when components wrap\n\n![Label left group](/public/calendarui/label_left_group.png)\n\n## Variants and states\nEach component is designed with variants so it can be reused across views and breakpoints\n\n### State coverage\n\n1. Default selected and disabled\n2. Today indicator\n3. Busy conflict and unavailable\n4. Hover where relevant on desktop\n\n## Responsive scaling\nDesktop increases density and parallel context but uses the same building blocks\n\n### How it scales\n\n1. The grid gains space and metadata\n2. The sidebar becomes more useful rather than more noisy\n3. Controls move from stacked to inline without redesigning components\n4. Constraints preserve alignment and spacing across sizes\n\n## Final outcome\nThis is the final responsive calendar layout\nIt is built from the same components shown above\n\n![Responsive calendar](/public/calendarui/responsive_calendar.png)\n\n## Learnings\n\n1. Mobile first work makes the component system more intentional\n2. Variants reduce rework and keep behaviour consistent\n3. Responsive outcomes are easier when constraints are planned early\n",
    published: 1,
    updated_at: now,
  };

  if (!hasCalendar) {
    db.prepare(
      `insert into projects (slug,title,subtitle,summary,role,timeframe,tools,tags,hero_image,body_markdown,published,created_at,updated_at,kind,date)
       values (@slug,@title,@subtitle,@summary,@role,@timeframe,@tools,@tags,@hero_image,@body_markdown,@published,@created_at,@updated_at,@kind,@date)`
    ).run({
      slug: calendarSlug,
      kind: "lab",
      date: null,
      created_at: now,
      ...calendarPayload,
    });
  } else {
    db.prepare(
      `update projects
       set title=@title,
           subtitle=@subtitle,
           summary=@summary,
           role=@role,
           timeframe=@timeframe,
           tools=@tools,
           tags=@tags,
           hero_image=@hero_image,
           body_markdown=@body_markdown,
           published=@published,
           updated_at=@updated_at,
           kind='lab'
       where slug=@slug`
    ).run({ slug: calendarSlug, ...calendarPayload });
  }
}
