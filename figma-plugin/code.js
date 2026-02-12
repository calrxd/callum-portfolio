// Callum Portfolio Generator — Figma Plugin
// Generates Desktop + Mobile homepage frames.

function hex(hexString) {
  const h = hexString.replace('#', '').trim();
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

const COLORS = {
  bg: '#060b0c',
  panel: '#0c1415',
  ink: '#eaf2f2',
  muted: '#a3b0b2',
  border: '#1a2728',
  brand: '#47b8af'
};

const FONTS = {
  sans: { family: 'Inter', style: 'Regular' },
  sansMedium: { family: 'Inter', style: 'Medium' },
  sansSemi: { family: 'Inter', style: 'Semi Bold' },
  serif: { family: 'Georgia', style: 'Regular' }
};

async function loadFonts() {
  // Inter is usually available in Figma; Georgia usually too.
  // If any font fails, we fallback to whatever Figma chooses (plugin won’t crash).
  const tries = [FONTS.sans, FONTS.sansMedium, FONTS.sansSemi, FONTS.serif];
  for (const f of tries) {
    try { await figma.loadFontAsync(f); } catch (e) { /* ignore */ }
  }
}

function setSolidFill(node, colorHex) {
  node.fills = [{ type: 'SOLID', color: hex(colorHex) }];
}

function setStroke(node, colorHex, weight = 1) {
  node.strokes = [{ type: 'SOLID', color: hex(colorHex) }];
  node.strokeWeight = weight;
}

function textNode(str, font, size, colorHex, opts = {}) {
  const t = figma.createText();
  t.characters = str;
  t.fontName = font;
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color: hex(colorHex) }];
  if (opts.letterSpacing) t.letterSpacing = { value: opts.letterSpacing, unit: 'PERCENT' };
  if (opts.lineHeightPx) t.lineHeight = { value: opts.lineHeightPx, unit: 'PIXELS' };
  if (opts.textCase) t.textCase = opts.textCase;
  return t;
}

function pill(label) {
  const f = figma.createFrame();
  f.name = `Pill/${label}`;
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.paddingLeft = 10; f.paddingRight = 10; f.paddingTop = 5; f.paddingBottom = 5;
  f.itemSpacing = 6;
  f.cornerRadius = 999;
  setStroke(f, COLORS.border, 1);
  setSolidFill(f, COLORS.panel);

  const t = figma.createText();
  t.characters = label;
  t.fontName = FONTS.sansMedium;
  t.fontSize = 12;
  t.fills = [{ type: 'SOLID', color: hex(COLORS.muted) }];
  f.appendChild(t);
  return f;
}

function makeSectionTitle(title) {
  const t = figma.createText();
  t.characters = title;
  t.fontName = FONTS.serif;
  t.fontSize = 28;
  t.fills = [{ type: 'SOLID', color: hex(COLORS.ink) }];
  t.letterSpacing = { value: -2, unit: 'PERCENT' };
  return t;
}

function cardWork(title, subtitle) {
  const c = figma.createFrame();
  c.name = `Card/${title}`;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisSizingMode = 'FIXED';
  c.counterAxisSizingMode = 'FIXED';
  c.resize(0, 0); // will set later
  c.paddingLeft = 14; c.paddingRight = 14; c.paddingTop = 14; c.paddingBottom = 14;
  c.itemSpacing = 10;
  c.cornerRadius = 18;
  setStroke(c, COLORS.border, 1);
  c.fills = [{ type: 'SOLID', color: hex('#101b1c') }];

  const thumb = figma.createFrame();
  thumb.name = 'Thumb';
  thumb.resize(0, 120);
  thumb.cornerRadius = 14;
  setStroke(thumb, COLORS.border, 1);
  thumb.fills = [{ type: 'SOLID', color: hex('#0b1314') }];
  const dot = figma.createRectangle();
  dot.resize(34, 34);
  dot.cornerRadius = 10;
  setSolidFill(dot, COLORS.ink);
  dot.opacity = 0.9;
  dot.x = 0; dot.y = 0;
  thumb.layoutMode = 'VERTICAL';
  thumb.primaryAxisAlignItems = 'CENTER';
  thumb.counterAxisAlignItems = 'CENTER';
  thumb.primaryAxisSizingMode = 'FIXED';
  thumb.counterAxisSizingMode = 'FIXED';
  thumb.appendChild(dot);

  const t1 = figma.createText();
  t1.characters = title;
  t1.fontName = FONTS.sansSemi;
  t1.fontSize = 16;
  t1.fills = [{ type: 'SOLID', color: hex(COLORS.ink) }];

  const t2 = figma.createText();
  t2.characters = subtitle;
  t2.fontName = FONTS.sans;
  t2.fontSize = 13;
  t2.fills = [{ type: 'SOLID', color: hex(COLORS.muted) }];
  t2.lineHeight = { value: 18, unit: 'PIXELS' };

  c.appendChild(thumb);
  c.appendChild(t1);
  c.appendChild(t2);

  return c;
}

function feedRow(kind, title, dateLabel) {
  const row = figma.createFrame();
  row.name = `Feed/${title}`;
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'FIXED';
  row.counterAxisSizingMode = 'AUTO';
  row.paddingLeft = 14; row.paddingRight = 14; row.paddingTop = 14; row.paddingBottom = 14;
  row.itemSpacing = 12;
  row.cornerRadius = 14;
  row.fills = []; // no borders, hover-only in web

  const thumb = figma.createFrame();
  thumb.resize(72, 44);
  thumb.cornerRadius = 14;
  setStroke(thumb, COLORS.border, 1);
  thumb.fills = [{ type: 'SOLID', color: hex('#0b1314') }];
  thumb.layoutMode = 'VERTICAL';
  thumb.primaryAxisAlignItems = 'CENTER';
  thumb.counterAxisAlignItems = 'CENTER';
  const mini = figma.createRectangle();
  mini.resize(20, 20);
  mini.cornerRadius = 8;
  setSolidFill(mini, COLORS.ink);
  mini.opacity = 0.9;
  thumb.appendChild(mini);

  const main = figma.createFrame();
  main.layoutMode = 'VERTICAL';
  main.primaryAxisSizingMode = 'AUTO';
  main.counterAxisSizingMode = 'AUTO';
  main.itemSpacing = 6;
  main.fills = [];

  const meta = figma.createFrame();
  meta.layoutMode = 'HORIZONTAL';
  meta.primaryAxisSizingMode = 'AUTO';
  meta.counterAxisSizingMode = 'AUTO';
  meta.itemSpacing = 8;
  meta.fills = [];

  const k = pill(kind);
  const d = figma.createText();
  d.characters = dateLabel;
  d.fontName = FONTS.sans;
  d.fontSize = 12;
  d.fills = [{ type: 'SOLID', color: hex(COLORS.muted) }];

  meta.appendChild(k);
  meta.appendChild(d);

  const tt = figma.createText();
  tt.characters = title;
  tt.fontName = FONTS.sansSemi;
  tt.fontSize = 16;
  tt.fills = [{ type: 'SOLID', color: hex(COLORS.ink) }];

  main.appendChild(meta);
  main.appendChild(tt);

  row.appendChild(thumb);
  row.appendChild(main);

  return row;
}

function timelineRow(range, title, org) {
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisSizingMode = 'FIXED';
  row.counterAxisSizingMode = 'AUTO';
  row.itemSpacing = 14;
  row.fills = [];

  const left = figma.createText();
  left.characters = range;
  left.fontName = FONTS.sans;
  left.fontSize = 13;
  left.fills = [{ type: 'SOLID', color: hex(COLORS.muted) }];
  left.resize(140, left.height);

  const right = figma.createFrame();
  right.layoutMode = 'VERTICAL';
  right.primaryAxisSizingMode = 'AUTO';
  right.counterAxisSizingMode = 'AUTO';
  right.itemSpacing = 2;
  right.fills = [];

  const t = figma.createText();
  t.characters = title;
  t.fontName = FONTS.sansSemi;
  t.fontSize = 14;
  t.fills = [{ type: 'SOLID', color: hex(COLORS.ink) }];

  const o = figma.createText();
  o.characters = org;
  o.fontName = FONTS.sans;
  o.fontSize = 13;
  o.fills = [{ type: 'SOLID', color: hex(COLORS.muted) }];

  right.appendChild(t);
  right.appendChild(o);

  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function toolkitGroup(title, items) {
  const g = figma.createFrame();
  g.layoutMode = 'VERTICAL';
  g.primaryAxisSizingMode = 'AUTO';
  g.counterAxisSizingMode = 'AUTO';
  g.itemSpacing = 10;
  g.fills = [];

  const head = figma.createText();
  head.characters = title;
  head.fontName = FONTS.sansSemi;
  head.fontSize = 14;
  head.fills = [{ type: 'SOLID', color: hex(COLORS.ink) }];

  const list = figma.createFrame();
  list.layoutMode = 'VERTICAL';
  list.primaryAxisSizingMode = 'AUTO';
  list.counterAxisSizingMode = 'AUTO';
  list.itemSpacing = 10;
  list.fills = [];

  for (const label of items) {
    const row = figma.createFrame();
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = 12;
    row.fills = [];

    const ico = figma.createFrame();
    ico.resize(34, 34);
    ico.cornerRadius = 14;
    setStroke(ico, COLORS.border, 1);
    ico.fills = [{ type: 'SOLID', color: hex('#101b1c') }];

    const dot = figma.createRectangle();
    dot.resize(18, 18);
    dot.cornerRadius = 8;
    setSolidFill(dot, COLORS.ink);
    dot.opacity = 0.92;
    ico.layoutMode = 'VERTICAL';
    ico.primaryAxisAlignItems = 'CENTER';
    ico.counterAxisAlignItems = 'CENTER';
    ico.appendChild(dot);

    const t = figma.createText();
    t.characters = label;
    t.fontName = FONTS.sans;
    t.fontSize = 13;
    t.fills = [{ type: 'SOLID', color: hex(COLORS.muted) }];

    row.appendChild(ico);
    row.appendChild(t);
    list.appendChild(row);
  }

  g.appendChild(head);
  g.appendChild(list);
  return g;
}

function sectionSep(width) {
  const l = figma.createLine();
  l.resize(width, 0);
  l.strokes = [{ type: 'SOLID', color: hex(COLORS.border) }];
  l.strokeWeight = 1;
  return l;
}

async function generate() {
  await loadFonts();

  const ts = new Date();
  const suffix = `${ts.getHours().toString().padStart(2,'0')}${ts.getMinutes().toString().padStart(2,'0')}`;

  // Desktop frame
  const desktop = figma.createFrame();
  desktop.name = `Homepage — Desktop (${suffix})`;
  desktop.resize(1440, 1024);
  setSolidFill(desktop, COLORS.bg);

  // Mobile frame
  const mobile = figma.createFrame();
  mobile.name = `Homepage — Mobile (${suffix})`;
  mobile.resize(390, 844);
  setSolidFill(mobile, COLORS.bg);

  // Position side-by-side
  desktop.x = figma.viewport.center.x - 800;
  desktop.y = figma.viewport.center.y - 520;
  mobile.x = desktop.x + desktop.width + 120;
  mobile.y = desktop.y;

  figma.currentPage.appendChild(desktop);
  figma.currentPage.appendChild(mobile);

  // Build a centered container and panel on Desktop
  const containerWidth = 760;
  const padX = (1440 - containerWidth) / 2;

  const panel = figma.createFrame();
  panel.name = 'Panel';
  panel.resize(containerWidth, 920);
  panel.x = padX;
  panel.y = 40;
  panel.cornerRadius = 22;
  setStroke(panel, COLORS.border, 1);
  setSolidFill(panel, COLORS.panel);
  panel.layoutMode = 'VERTICAL';
  panel.primaryAxisSizingMode = 'FIXED';
  panel.counterAxisSizingMode = 'FIXED';
  panel.paddingLeft = 22; panel.paddingRight = 22; panel.paddingTop = 22; panel.paddingBottom = 22;
  panel.itemSpacing = 22;

  // Intro row (avatar + name/title)
  const intro = figma.createFrame();
  intro.layoutMode = 'HORIZONTAL';
  intro.primaryAxisSizingMode = 'AUTO';
  intro.counterAxisSizingMode = 'AUTO';
  intro.itemSpacing = 14;
  intro.fills = [];

  const avatar = figma.createRectangle();
  avatar.resize(44, 44);
  avatar.cornerRadius = 14;
  setStroke(avatar, COLORS.border, 1);
  setSolidFill(avatar, '#101b1c');

  const introText = figma.createFrame();
  introText.layoutMode = 'VERTICAL';
  introText.primaryAxisSizingMode = 'AUTO';
  introText.counterAxisSizingMode = 'AUTO';
  introText.itemSpacing = 2;
  introText.fills = [];

  const nm = textNode('Callum Radmilovic', FONTS.sansSemi, 14, COLORS.ink);
  const rl = textNode('UI/UX Designer at Activ People HR', FONTS.sans, 13, COLORS.muted);
  introText.appendChild(nm);
  introText.appendChild(rl);

  intro.appendChild(avatar);
  intro.appendChild(introText);

  // Hero
  const h1 = figma.createText();
  h1.characters = 'Designing calm SaaS\nfor complex workflows';
  h1.fontName = FONTS.serif;
  h1.fontSize = 54;
  h1.fills = [{ type: 'SOLID', color: hex(COLORS.ink) }];
  h1.lineHeight = { value: 56, unit: 'PIXELS' };

  // Email reveal hint + blurred email
  const emailRow = figma.createFrame();
  emailRow.layoutMode = 'HORIZONTAL';
  emailRow.primaryAxisSizingMode = 'AUTO';
  emailRow.counterAxisSizingMode = 'AUTO';
  emailRow.itemSpacing = 12;
  emailRow.fills = [];

  const hint = textNode('Press', FONTS.sans, 12, COLORS.muted);
  const key = figma.createFrame();
  key.layoutMode = 'HORIZONTAL';
  key.primaryAxisSizingMode = 'AUTO';
  key.counterAxisSizingMode = 'AUTO';
  key.paddingLeft = 6; key.paddingRight = 6; key.paddingTop = 2; key.paddingBottom = 2;
  key.cornerRadius = 7;
  setStroke(key, COLORS.border, 1);
  setSolidFill(key, '#101b1c');
  const keyT = textNode('R', FONTS.sansSemi, 12, COLORS.ink);
  key.appendChild(keyT);

  const hint2 = textNode('to reveal email', FONTS.sans, 12, COLORS.muted);

  const email = textNode('hey@callumrad.co.uk', FONTS.sansMedium, 14, COLORS.ink);
  // Simulate blur by lowering opacity and adding a tiny shadow (Figma has blur effects but not on text reliably).
  email.opacity = 0.45;

  emailRow.appendChild(hint);
  emailRow.appendChild(key);
  emailRow.appendChild(hint2);
  emailRow.appendChild(email);

  // About paragraphs
  const about = figma.createFrame();
  about.layoutMode = 'VERTICAL';
  about.primaryAxisSizingMode = 'AUTO';
  about.counterAxisSizingMode = 'FIXED';
  about.resize(containerWidth - 44, 0);
  about.itemSpacing = 14;
  about.fills = [];

  const aboutParas = [
    "I’m a UI/UX Product Designer with 4+ years’ experience designing and shipping SaaS products, with a focus on HR, compliance, and workflow-heavy systems.",
    "At Activ People HR, I’ve led UI/UX initiatives used by 200,000+ users globally, bringing consistency across modules and improving end-to-end journeys on web and mobile.",
    "I collaborate closely with Product, Engineering, and leadership to deliver accessible, intuitive interfaces, using research and data to guide decisions and refine the details that matter.",
  ];
  for (const p of aboutParas) {
    const t = figma.createText();
    t.characters = p;
    t.fontName = FONTS.serif;
    t.fontSize = 15;
    t.lineHeight = { value: 28, unit: 'PIXELS' };
    t.fills = [{ type: 'SOLID', color: hex(COLORS.muted) }];
    t.resize(containerWidth - 44, t.height);
    about.appendChild(t);
  }

  // Work
  const workTitle = makeSectionTitle('Work');
  const workGrid = figma.createFrame();
  workGrid.layoutMode = 'HORIZONTAL';
  workGrid.primaryAxisSizingMode = 'FIXED';
  workGrid.counterAxisSizingMode = 'AUTO';
  workGrid.itemSpacing = 14;
  workGrid.fills = [];

  const w1 = cardWork('Autolayout Adjuster', 'Figma plugin');
  const w2 = cardWork('Design system overhaul', 'Scaling a B2B HR platform');
  w1.resize((containerWidth - 14) / 2, 220);
  w2.resize((containerWidth - 14) / 2, 220);
  w1.children[0].resize((containerWidth - 14) / 2 - 28, 120);
  w2.children[0].resize((containerWidth - 14) / 2 - 28, 120);
  workGrid.appendChild(w1);
  workGrid.appendChild(w2);

  // Lab
  const labTitle = makeSectionTitle('Lab');
  const labGrid = figma.createFrame();
  labGrid.layoutMode = 'HORIZONTAL';
  labGrid.primaryAxisSizingMode = 'FIXED';
  labGrid.counterAxisSizingMode = 'AUTO';
  labGrid.itemSpacing = 14;
  labGrid.fills = [];

  const l1 = cardWork('PanelX', 'GitHub');
  const l2 = cardWork('Scrolling Banner Card', 'GitHub');
  l1.resize((containerWidth - 14) / 2, 220);
  l2.resize((containerWidth - 14) / 2, 220);
  l1.children[0].resize((containerWidth - 14) / 2 - 28, 120);
  l2.children[0].resize((containerWidth - 14) / 2 - 28, 120);
  labGrid.appendChild(l1);
  labGrid.appendChild(l2);

  // Other topics
  const topicsTitle = makeSectionTitle('Other topics');
  const feed = figma.createFrame();
  feed.layoutMode = 'VERTICAL';
  feed.primaryAxisSizingMode = 'AUTO';
  feed.counterAxisSizingMode = 'FIXED';
  feed.resize(containerWidth - 44, 0);
  feed.itemSpacing = 8;
  feed.fills = [];

  const r1 = feedRow('Writing', 'Animated Empty States', 'January 2026');
  const r2 = feedRow('Components', 'Building a Drawer Component', 'December 2025');
  r1.resize(containerWidth - 44, r1.height);
  r2.resize(containerWidth - 44, r2.height);
  feed.appendChild(r1);
  feed.appendChild(r2);

  // Experience
  const expTitle = makeSectionTitle('Experience');
  const exp = figma.createFrame();
  exp.layoutMode = 'VERTICAL';
  exp.primaryAxisSizingMode = 'AUTO';
  exp.counterAxisSizingMode = 'FIXED';
  exp.resize(containerWidth - 44, 0);
  exp.itemSpacing = 12;
  exp.fills = [];

  const expRows = [
    timelineRow('Apr 2022 — Present', 'Lead UI/UX Designer', 'Activ People HR'),
    timelineRow('Mar 2021 — Apr 2022', 'UI/UX Designer', 'Activ People HR'),
    timelineRow('May 2020 — Mar 2021', 'Lead Technical Analyst', 'CGI'),
    timelineRow('Jan 2020 — May 2020', 'Technical Analyst', 'CGI'),
  ];
  for (const r of expRows) {
    r.resize(containerWidth - 44, r.height);
    exp.appendChild(r);
  }

  // Toolkit
  const tkTitle = makeSectionTitle('My toolkit');
  const tk = figma.createFrame();
  tk.layoutMode = 'HORIZONTAL';
  tk.primaryAxisSizingMode = 'FIXED';
  tk.counterAxisSizingMode = 'AUTO';
  tk.itemSpacing = 22;
  tk.fills = [];

  const g1 = toolkitGroup('Design', ['Figma', 'Adobe', 'Design tokens']);
  const g2 = toolkitGroup('Development', ['VS Code', 'GitHub', 'TypeScript', 'Antigravity']);
  const g3 = toolkitGroup('AI & Assistive Tools', ['OpenClaw', 'ChatGPT']);

  tk.appendChild(g1);
  tk.appendChild(g2);
  tk.appendChild(g3);

  // Assemble panel
  panel.appendChild(intro);
  panel.appendChild(h1);
  panel.appendChild(emailRow);
  panel.appendChild(sectionSep(containerWidth - 44));
  panel.appendChild(about);
  panel.appendChild(sectionSep(containerWidth - 44));
  panel.appendChild(workTitle);
  panel.appendChild(workGrid);
  panel.appendChild(sectionSep(containerWidth - 44));
  panel.appendChild(labTitle);
  panel.appendChild(labGrid);
  panel.appendChild(sectionSep(containerWidth - 44));
  panel.appendChild(topicsTitle);
  panel.appendChild(feed);
  panel.appendChild(sectionSep(containerWidth - 44));
  panel.appendChild(expTitle);
  panel.appendChild(exp);
  panel.appendChild(sectionSep(containerWidth - 44));
  panel.appendChild(tkTitle);
  panel.appendChild(tk);

  desktop.appendChild(panel);

  // Bottom icon dock on Desktop (approx)
  const dock = figma.createFrame();
  dock.name = 'BottomNavDock';
  dock.layoutMode = 'HORIZONTAL';
  dock.primaryAxisSizingMode = 'AUTO';
  dock.counterAxisSizingMode = 'AUTO';
  dock.itemSpacing = 10;
  dock.paddingLeft = 10; dock.paddingRight = 10; dock.paddingTop = 10; dock.paddingBottom = 10;
  dock.cornerRadius = 18;
  setStroke(dock, COLORS.border, 1);
  dock.fills = [{ type: 'SOLID', color: hex('#101b1c') }];

  function dockBtn() {
    const b = figma.createFrame();
    b.resize(44, 44);
    b.cornerRadius = 16;
    setStroke(b, COLORS.border, 1);
    b.fills = [{ type: 'SOLID', color: hex('#0c1415') }];
    return b;
  }
  dock.appendChild(dockBtn());
  dock.appendChild(dockBtn());
  dock.appendChild(dockBtn());
  dock.appendChild(dockBtn());
  dock.appendChild(dockBtn());

  desktop.appendChild(dock);
  dock.x = (1440 - dock.width) / 2;
  dock.y = 1024 - dock.height - 22;

  // Mobile: simpler stacked panel
  const mPanel = figma.createFrame();
  mPanel.name = 'Panel';
  mPanel.resize(390 - 40, 780);
  mPanel.x = 20;
  mPanel.y = 32;
  mPanel.cornerRadius = 22;
  setStroke(mPanel, COLORS.border, 1);
  setSolidFill(mPanel, COLORS.panel);
  mPanel.layoutMode = 'VERTICAL';
  mPanel.paddingLeft = 18; mPanel.paddingRight = 18; mPanel.paddingTop = 18; mPanel.paddingBottom = 18;
  mPanel.itemSpacing = 18;

  const mIntro = intro.clone();
  const mH1 = h1.clone();
  mH1.fontSize = 42;
  mH1.lineHeight = { value: 44, unit: 'PIXELS' };

  const mEmail = emailRow.clone();
  const mAbout = about.clone();

  mPanel.appendChild(mIntro);
  mPanel.appendChild(mH1);
  mPanel.appendChild(mEmail);
  mPanel.appendChild(sectionSep(mPanel.width - 36));
  mPanel.appendChild(mAbout);

  mobile.appendChild(mPanel);

  figma.viewport.scrollAndZoomIntoView([desktop, mobile]);
}

figma.showUI(__html__, { width: 340, height: 190 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
  if (msg.type === 'generate') {
    try {
      await generate();
      figma.notify('Generated Desktop + Mobile homepage frames');
    } catch (e) {
      console.error(e);
      figma.notify('Failed to generate frames. See console.');
    }
  }
};
