import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "portfolio.sqlite");
const db = new Database(dbPath);

const now = new Date().toISOString();

const slug = "activ-people-hr-platform-redesign";

const body = `## Overview
Activ People HR is a full HR platform used day-to-day by Employees, Managers, and HR teams. Over time the platform grew fast — new modules, new settings, new edge cases — and the UI started to show it. Patterns drifted, key tasks took too many steps, and some areas (especially admin and reporting settings) became hard to navigate.

This was a year-long redesign and rebuild of the platform experience across every module — not just new screens, but a more consistent UI foundation that could actually scale.

> **[UI PREVIEW — Hero montage]**  
> Replace with: a clean montage (Dashboard hub + table + workflow screen)  
> Suggested: \`aphr-hero-montage.png\`


## Project snapshot
**Timeframe:** 12 months  
**Scope:** End-to-end redesign across all modules  
**Modules redesigned:** Absence Management, Training Records, Performance Management, Employee Documents, Policies & Procedures, Timesheets  
**Shipped alongside redesign:** Live notifications, new widget system + widgets, integrations (ZKBio, Xero, Wonde, XPorter), role-based hubs, new tables, restructured admin + report settings, redesigned login


## The challenge
A lot of the friction wasn’t one “big” problem — it was hundreds of small cuts:
- Different modules solved the same UI problems in different ways
- Dense screens made it hard to scan, especially in tables and settings
- Core workflows had too many steps and too much repeated input
- Admin and report settings had grown into a cluttered catch‑all area
- Shipping improvements was slower than it needed to be because we kept re-solving patterns


## Goals
- Reduce time-on-task for the common journeys customers do every day  
- Cut unnecessary steps (and the “Where is that again?” moments)  
- Make navigation make sense for different roles, not just “one dashboard for everyone”  
- Standardise patterns so delivery is faster and quality is more predictable  
- Leave the platform in a better place for future features and integrations


## Outcomes
After deployment, customers reported a **10% increase in time saved** on common tasks.

Internally, we calculated an average of **124 reduced clicks** across key workflows once the redesigned patterns and streamlined journeys were in place.

<div class="stats">
  <div class="stat">
    <div class="stat-kicker">Time saved</div>
    <div class="stat-value"><span class="accent">10%</span></div>
    <p class="stat-desc">Customers reported an increase in time saved on common tasks after the platform redesign was deployed.</p>
  </div>
  <div class="stat">
    <div class="stat-kicker">Reduced clicks</div>
    <div class="stat-value"><span class="accent">124</span></div>
    <p class="stat-desc">Average reduction in clicks across key workflows after streamlining journeys and standardising patterns.</p>
  </div>
</div>


## Role-based dashboards (Hubs)
One of the biggest changes was moving away from a “one-size” dashboard. Different roles come to the system for different reasons, so we built dedicated hubs:
- **Employee Hub** — personal actions, tasks, and quick access
- **Manager Hub** — team oversight, approvals, people actions
- **HR Hub** — operational control, reporting, configuration entry points

This immediately improved relevance: fewer distractions, clearer priorities, and faster entry into the workflows that mattered.

> **[UI PREVIEW — Hubs overview]**  
> Replace with: 3 hub screenshots side-by-side (Employee / Manager / HR)  
> Suggested: \`aphr-hubs-overview.png\`

### Employee Hub
> **[UI PREVIEW — Employee Hub]**  
> Suggested: \`aphr-hub-employee.png\`

### Manager Hub
> **[UI PREVIEW — Manager Hub]**  
> Suggested: \`aphr-hub-manager.png\`

### HR Hub
> **[UI PREVIEW — HR Hub]**  
> Suggested: \`aphr-hub-hr.png\`


## Widgets (new designs + new widgets)
We redesigned the widget library and introduced additional widgets so hubs could be genuinely useful — not just a landing page.

New and expanded widgets included:
- Tasks
- Objectives
- CPD records
- Quick links
- (plus other role-specific widgets to support daily work)

> **[UI PREVIEW — Widget library grid]**  
> Replace with: a UI kit frame showing the widget set in a grid  
> Suggested: \`aphr-widgets-grid.png\`

### Widget anatomy
To keep things consistent, widgets follow the same internal structure (title, key metric or content, clear actions, and predictable states).

> **[UI PREVIEW — Widget anatomy callouts]**  
> Replace with: a single widget + labelled callouts  
> Suggested: \`aphr-widget-anatomy.png\`


## Tables (platform-wide redesign)
Tables are everywhere in HR software — and they’re usually where frustration builds. We redesigned tables as a system, not as one-off screens:
- clearer hierarchy and spacing for scanability
- consistent filtering + sorting patterns
- predictable pagination behaviour
- better empty states and no-results states
- cleaner bulk actions where relevant

> **[UI PREVIEW — Table system]**  
> Replace with: table + filters + pagination in one screenshot  
> Suggested: \`aphr-table-system.png\`

### Table states
> **[UI PREVIEW — Table states]**  
> Replace with: loading / empty / no-results / error examples (4-up)  
> Suggested: \`aphr-table-states.png\`


## Workflow redesigns (complex journeys)
A lot of the measurable improvement came from reworking complex flows so users weren’t repeating steps or second-guessing what to do next.

Key workflows redesigned:
- Shift patterns
- Document workflows
- Time recording
- Overall setup
- Public profile

> **[UI PREVIEW — Workflow before/after map]**  
> Replace with: simple journey map for ONE workflow (before vs after)  
> Suggested: \`aphr-workflow-map.png\`

### Shift patterns
> **[UI PREVIEW — Shift patterns]**  
> Suggested: \`aphr-shift-patterns.png\`

### Document workflows
> **[UI PREVIEW — Document workflows]**  
> Suggested: \`aphr-document-workflows.png\`

### Time recording
> **[UI PREVIEW — Time recording]**  
> Suggested: \`aphr-time-recording.png\`

### Setup + public profile
> **[UI PREVIEW — Setup journey]**  
> Suggested: \`aphr-setup.png\`  
> **[UI PREVIEW — Public profile]**  
> Suggested: \`aphr-public-profile.png\`


## Admin + report settings restructure
Admin and report settings had become cluttered over time — too many items, unclear grouping, and a lot of “I think it’s in here somewhere”.

We restructured the section so it’s easier to find what you need and understand where you are:
- better grouping and naming
- clearer navigation hierarchy
- more consistent page layouts and density

> **[UI PREVIEW — Admin IA / navigation before-after]**  
> Suggested: \`aphr-admin-ia.png\`


## Login redesign
The login experience was redesigned as part of the broader refresh, with clearer hierarchy and more polished states.

> **[UI PREVIEW — Login redesign]**  
> Suggested: \`aphr-login.png\`


## Live notifications + integrations
Alongside the redesign, we shipped meaningful platform upgrades:
- **Live notifications**
- Integrations: **ZKBio**, **Xero**, **Wonde**, **XPorter**

> **[UI PREVIEW — Notifications]**  
> Suggested: \`aphr-notifications.png\`  
> **[UI PREVIEW — Integrations]**  
> Suggested: \`aphr-integrations.png\`


## Design system (UI kit)
To keep the redesign consistent across modules (and to make shipping faster), we built out the UI kit to cover foundations, components, and common patterns.

> **[UI PREVIEW — Foundations]**  
> Replace with: type scale, spacing, colour tokens (UI kit screenshot)  
> Suggested: \`aphr-ui-foundations.png\`

### Components
> **[UI PREVIEW — Components sheet]**  
> Replace with: buttons, inputs, selects, modals, empty states  
> Suggested: \`aphr-ui-components.png\`

### Patterns
> **[UI PREVIEW — Patterns sheet]**  
> Replace with: tables + filters + bulk actions + notifications patterns  
> Suggested: \`aphr-ui-patterns.png\`


## Reflection
The biggest win wasn’t just “new UI”. It was getting the platform to a place where it feels consistent no matter what module you’re in — and where it’s genuinely easier to keep improving without rework every time.

If I were doing it again, I’d still ship it the same way: build the foundation, apply it across real workflows, then expand it with patterns and documentation as the platform grows.
`;

const row = {
  slug,
  title: "Activ People HR — Platform Re-design",
  subtitle:
    "A year-long redesign across every module, with role-based hubs, new tables, streamlined workflows, and a scalable UI kit",
  summary:
    "Redesigned the Activ People HR platform across all modules. Customers reported ~10% time saved post-release and we calculated an average of 124 reduced clicks across key journeys.",
  role: "Lead UI/UX Designer",
  timeframe: "12 months",
  tools: "Figma",
  tags: "Platform Redesign, SaaS, HR Tech, Dashboards, Workflows, Tables, UI Kit, Integrations",
  hero_image: "",
  body_markdown: body,
  published: 0,
  created_at: now,
  updated_at: now,
  kind: "project",
  date: "2025-01-01",
};

// Upsert
const existing = db.prepare("select id from projects where slug=?").get(slug);
if (existing?.id) {
  db.prepare(
    `update projects set
      title=@title,
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
      kind=@kind,
      date=@date
     where slug=@slug`
  ).run(row);
  console.log(`Updated existing project: ${slug}`);
} else {
  db.prepare(
    `insert into projects (slug,title,subtitle,summary,role,timeframe,tools,tags,hero_image,body_markdown,published,created_at,updated_at,kind,date)
     values (@slug,@title,@subtitle,@summary,@role,@timeframe,@tools,@tags,@hero_image,@body_markdown,@published,@created_at,@updated_at,@kind,@date)`
  ).run(row);
  console.log(`Inserted new project: ${slug}`);
}
