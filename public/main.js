(() => {
  // --- Email reveal ---
  const wrap = document.querySelector('.reveal-wrap');
  if (wrap) {
    const email = wrap.getAttribute('data-email');
    const link = wrap.querySelector('.reveal-email');
    const hint = wrap.querySelector('.reveal-hint');

    // Treat coarse pointer / no-hover devices as "mobile" for this interaction.
    const isMobile =
      !!window.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches ||
      'ontouchstart' in window;

    let revealed = false;

    const setRevealed = (v) => {
      revealed = v;
      wrap.classList.toggle('revealed', revealed);

      if (revealed) {
        link?.setAttribute('href', `mailto:${email}`);
        link?.setAttribute('aria-label', `Email: ${email}`);
        if (hint) hint.textContent = isMobile ? 'Tap to email' : 'Click to email';
        return;
      }

      link?.setAttribute('href', '#');
      link?.setAttribute(
        'aria-label',
        isMobile ? 'Email address (tap to reveal)' : 'Email address (press R to reveal)'
      );
      // Hint is rendered with CSS-controlled mobile/desktop variants in the HTML.
      // (We only change it once revealed.)
    };

    setRevealed(false);

    // Desktop keyboard shortcut
    if (!isMobile) {
      document.addEventListener('keydown', (e) => {
        if (e.key?.toLowerCase() === 'r') setRevealed(true);
      });
    }

    // Clicking the email always works: first click reveals, second click emails.
    link?.addEventListener('click', (e) => {
      if (!revealed) {
        e.preventDefault();
        setRevealed(true);
      }
    });

    // Mobile: let the user tap the hint/blur area too (not just the link text).
    if (isMobile) {
      wrap.addEventListener('click', (e) => {
        // Don't interfere with the mailto click once revealed.
        if (revealed) return;
        e.preventDefault();
        setRevealed(true);
      });
    }
  }

  // --- Typewriter rotating word (headline) ---
  const tw = document.querySelector('.tw');
  if (tw) {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const words = (tw.getAttribute('data-words') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!reduce && words.length) {
      const typeMs = 65;
      const deleteMs = 40;
      const holdMs = 900;

      let w = 0;
      let i = 0;
      let dir = 1; // 1 typing, -1 deleting

      const tick = () => {
        const word = words[w] || '';

        if (dir === 1) {
          i++;
          tw.textContent = word.slice(0, i);
          if (i >= word.length) {
            dir = -1;
            setTimeout(tick, holdMs);
            return;
          }
          setTimeout(tick, typeMs);
          return;
        }

        i--;
        tw.textContent = word.slice(0, Math.max(0, i));
        if (i <= 0) {
          dir = 1;
          w = (w + 1) % words.length;
          setTimeout(tick, 250);
          return;
        }
        setTimeout(tick, deleteMs);
      };

      tw.textContent = '';
      i = 0;
      dir = 1;
      setTimeout(tick, 450);
    }
  }

  // --- Project TOC (project page) ---
  const toc = document.querySelector('.toc');
  const tocNav = document.querySelector('.toc .toc-nav');
  const tocContent = document.querySelector('[data-toc-content]');

  const slugify = (s) =>
    (s || '')
      .toLowerCase()
      .trim()
      .replace(/['\u0000-\u001f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-+/g, '-');

  // --- Mermaid diagrams (flowcharts in markdown) ---
  const renderMermaid = async () => {
    const mermaid = window.mermaid;
    if (!mermaid) return;

    const blocks = Array.from(document.querySelectorAll('pre > code.language-mermaid'));
    if (!blocks.length) return;

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        flowchart: { curve: 'basis' },
      });
    } catch {
      // ignore init errors
    }

    for (const [idx, codeEl] of blocks.entries()) {
      const pre = codeEl.parentElement;
      if (!pre) continue;
      if (pre.getAttribute('data-mermaid-rendered') === '1') continue;
      pre.setAttribute('data-mermaid-rendered', '1');

      const src = (codeEl.textContent || '').trim();
      if (!src) continue;

      const wrap = document.createElement('div');
      wrap.className = 'spDiagram';

      const scroll = document.createElement('div');
      scroll.className = 'spDiagramScroll';
      wrap.appendChild(scroll);

      pre.replaceWith(wrap);

      const id = `mmd-${Date.now()}-${idx}`;

      try {
        const out = await mermaid.render(id, src);
        const svg = out?.svg || '';
        if (!svg) throw new Error('empty svg');
        scroll.innerHTML = svg;
      } catch (e) {
        const msg = (e && (e.message || String(e))) ? (e.message || String(e)) : 'unknown error';
        scroll.innerHTML = `<div class="muted">Diagram failed to render: ${String(msg).replace(/</g,'&lt;')}</div>`;
        // also log to console for debugging
        try { console.warn('mermaid render failed', e, { src }); } catch {}
      }
    }
  };

  // Mermaid is loaded via a deferred script on project pages.
  // Give it a tick so window.mermaid exists.
  setTimeout(() => { renderMermaid(); }, 0);

  if (toc && tocNav && tocContent) {
    const headings = Array.from(tocContent.querySelectorAll('h2, h3'))
      .filter((h) => (h.textContent || '').trim().length);

    if (headings.length) {
      const used = new Map();

      headings.forEach((h) => {
        // Ensure each heading has a stable id (marked doesn't guarantee this)
        let id = h.getAttribute('id') || slugify(h.textContent);
        const base = id;
        let n = used.get(base) || 0;
        while (document.getElementById(id)) {
          n += 1;
          id = `${base}-${n}`;
        }
        used.set(base, n);
        h.setAttribute('id', id);

        const a = document.createElement('a');
        a.className = `toc-link ${h.tagName === 'H3' ? 'l3' : 'l2'}`;
        a.href = `#${id}`;
        a.textContent = (h.textContent || '').trim();
        tocNav.appendChild(a);
      });

      // Active section highlight
      const links = Array.from(tocNav.querySelectorAll('a.toc-link'));
      const linkById = new Map(links.map((a) => [a.getAttribute('href')?.slice(1), a]));

      const setActive = (id) => {
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      };

      // Use IntersectionObserver when available, fallback to scroll handler
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          (entries) => {
            // pick the closest visible heading to the top
            const visible = entries
              .filter((e) => e.isIntersecting)
              .sort((a, b) => (a.boundingClientRect.top || 0) - (b.boundingClientRect.top || 0));
            const id = visible[0]?.target?.id;
            if (id && linkById.get(id)) setActive(id);
          },
          { rootMargin: '-18% 0px -78% 0px', threshold: [0, 1] }
        );
        headings.forEach((h) => io.observe(h));
      } else {
        const onScroll = () => {
          let current = headings[0]?.id;
          for (const h of headings) {
            const r = h.getBoundingClientRect();
            if (r.top <= 120) current = h.id;
            else break;
          }
          if (current) setActive(current);
        };
        document.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }

      // If user lands with no hash, keep the TOC visible but don't force scroll.
      // If they land with a hash, the browser will scroll naturally.
    } else {
      toc.style.display = 'none';
    }
  }

  // --- Lightweight analytics (beacon) ---
  const sendEvent = (payload) => {
    try {
      const body = JSON.stringify(payload || {});
      const url = '/analytics/event';

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }

      // fallback
      fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  // outbound clicks (external_url cards)
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[data-analytics="outbound"]');
    if (!a) return;

    sendEvent({
      type: 'outbound',
      slug: a.getAttribute('data-slug') || '',
      url: a.getAttribute('data-url') || a.getAttribute('href') || '',
      source: a.getAttribute('data-source') || '',
    });
  });

  // section nav clicks
  document.addEventListener('click', (e) => {
    const a = e.target?.closest?.('a[data-analytics="nav"]');
    if (!a) return;

    sendEvent({
      type: 'nav',
      section: a.getAttribute('data-section') || '',
      href: a.getAttribute('href') || '',
    });
  });
})();
