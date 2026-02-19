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

      // Toolbar
      const tb = document.createElement('div');
      tb.className = 'spDiagramToolbar';

      const tools = document.createElement('div');
      tools.className = 'spDiagramTools';

      const hint = document.createElement('div');
      hint.className = 'spDiagramHint';
      hint.textContent = 'Zoom: 100% • Scroll to pan';

      const mkBtn = (title, svg) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'spIconBtn';
        b.setAttribute('aria-label', title);
        b.setAttribute('title', title);
        b.innerHTML = svg;
        return b;
      };

      const ico = {
        plus: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"/></svg>`,
        minus: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M5 11h14v2H5z"/></svg>`,
        reset: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 1 1-9.9-1h-2.1A7 7 0 1 0 12 6z"/></svg>`,
        full: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm0-4h3V7h2v5H7V10zm10 7h-3v2h5v-5h-2v3zm0-10V5h-5v2h3v3h2z"/></svg>`,
      };

      const bZoomIn = mkBtn('Zoom in', ico.plus);
      const bZoomOut = mkBtn('Zoom out', ico.minus);
      const bReset = mkBtn('Reset zoom', ico.reset);
      const bFull = mkBtn('Fullscreen', ico.full);

      tools.appendChild(bZoomIn);
      tools.appendChild(bZoomOut);
      tools.appendChild(bReset);
      tools.appendChild(bFull);

      tb.appendChild(tools);
      tb.appendChild(hint);
      wrap.appendChild(tb);

      const scroll = document.createElement('div');
      scroll.className = 'spDiagramScroll';
      wrap.appendChild(scroll);

      pre.replaceWith(wrap);

      const id = `mmd-${Date.now()}-${idx}`;

      // zoom state
      let scale = 1;
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const applyZoom = (next) => {
        scale = clamp(next, 0.5, 2.5);
        const vp = scroll.querySelector('.spDiagramViewport');
        if (vp) vp.style.transform = `scale(${scale})`;
        hint.textContent = `Zoom: ${Math.round(scale * 100)}% • Scroll to pan`;
      };

      bZoomIn.addEventListener('click', () => applyZoom(scale + 0.15));
      bZoomOut.addEventListener('click', () => applyZoom(scale - 0.15));
      bReset.addEventListener('click', () => applyZoom(1));

      bFull.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
          }
          await wrap.requestFullscreen();
        } catch (e) {
          console.warn('fullscreen failed', e);
        }
      });

      // ctrl/cmd + wheel zoom
      scroll.addEventListener('wheel', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        const dir = e.deltaY > 0 ? -1 : 1;
        applyZoom(scale + dir * 0.08);
      }, { passive: false });

      try {
        const out = await mermaid.render(id, src);
        const svg = out?.svg || '';
        if (!svg) throw new Error('empty svg');

        const viewport = document.createElement('div');
        viewport.className = 'spDiagramViewport';
        viewport.innerHTML = svg;
        scroll.innerHTML = '';
        scroll.appendChild(viewport);

        applyZoom(1);
      } catch (e) {
        const msg = (e && (e.message || String(e))) ? (e.message || String(e)) : 'unknown error';
        scroll.innerHTML = `<div class="muted">Diagram failed to render: ${String(msg).replace(/</g,'&lt;')}</div>`;
        try { console.warn('mermaid render failed', e, { src }); } catch {}
      }
    }
  };

  // Mermaid is loaded via a deferred script on project pages.
  // Give it a tick so window.mermaid exists.
  setTimeout(() => { renderMermaid(); }, 0);

  // --- Image lightbox (click to expand + zoom) ---
  const setupImageLightbox = () => {
    const scope = document.querySelector('article.content') || document;
    const imgs = Array.from(scope.querySelectorAll('img'))
      .filter((img) => !img.classList.contains('hero-img'));

    if (!imgs.length) return;

    // Create lightbox once
    let lb = document.querySelector('.imgLightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'imgLightbox';
      lb.innerHTML = `
        <div class="imgLightboxBackdrop" data-lb-close></div>
        <div class="imgLightboxPanel" role="dialog" aria-modal="true" aria-label="Image preview">
          <div class="imgLightboxToolbar">
            <div class="imgLightboxTools">
              <button type="button" class="spIconBtn" data-lb-zoom-out aria-label="Zoom out" title="Zoom out">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M5 11h14v2H5z"/></svg>
              </button>
              <button type="button" class="spIconBtn" data-lb-zoom-in aria-label="Zoom in" title="Zoom in">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"/></svg>
              </button>
              <button type="button" class="spIconBtn" data-lb-reset aria-label="Reset" title="Reset">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 1 1-9.9-1h-2.1A7 7 0 1 0 12 6z"/></svg>
              </button>
            </div>
            <div class="imgLightboxHint" data-lb-hint>Zoom 100%</div>
            <button type="button" class="spIconBtn" data-lb-close aria-label="Close" title="Close">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"/></svg>
            </button>
          </div>
          <div class="imgLightboxStage" data-lb-stage>
            <img class="imgLightboxImg" alt="" />
          </div>
        </div>
      `;
      document.body.appendChild(lb);
    }

    const imgEl = lb.querySelector('.imgLightboxImg');
    const hintEl = lb.querySelector('[data-lb-hint]');
    const stage = lb.querySelector('[data-lb-stage]');

    let scale = 1;
    let tx = 0;
    let ty = 0;
    let isDown = false;
    let sx = 0;
    let sy = 0;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const apply = () => {
      imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      if (hintEl) hintEl.textContent = `Zoom ${Math.round(scale * 100)}%`;
      stage?.classList.toggle('isZoomed', scale > 1.01);
    };

    const reset = () => {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    };

    const open = (img) => {
      const src = img.getAttribute('src');
      if (!src) return;

      imgEl.setAttribute('src', src);
      imgEl.setAttribute('alt', img.getAttribute('alt') || '');
      reset();

      lb.classList.add('open');
      document.documentElement.classList.add('lbOpen');
    };

    const close = () => {
      lb.classList.remove('open');
      document.documentElement.classList.remove('lbOpen');
    };

    // Wire toolbar
    lb.querySelector('[data-lb-close]')?.addEventListener('click', close);
    lb.querySelector('[data-lb-zoom-in]')?.addEventListener('click', () => {
      scale = clamp(scale + 0.2, 1, 4);
      apply();
    });
    lb.querySelector('[data-lb-zoom-out]')?.addEventListener('click', () => {
      scale = clamp(scale - 0.2, 1, 4);
      if (scale <= 1.01) { tx = 0; ty = 0; }
      apply();
    });
    lb.querySelector('[data-lb-reset]')?.addEventListener('click', reset);

    // Esc closes
    window.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
    });

    // Drag to pan when zoomed
    stage?.addEventListener('pointerdown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (scale <= 1.01) return;
      isDown = true;
      sx = e.clientX - tx;
      sy = e.clientY - ty;
      stage.setPointerCapture?.(e.pointerId);
      stage.classList.add('dragging');
    });
    stage?.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      tx = e.clientX - sx;
      ty = e.clientY - sy;
      apply();
    });
    stage?.addEventListener('pointerup', () => {
      isDown = false;
      stage?.classList.remove('dragging');
    });

    // Wheel zoom
    stage?.addEventListener('wheel', (e) => {
      if (!lb.classList.contains('open')) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      scale = clamp(scale + delta, 1, 4);
      if (scale <= 1.01) { tx = 0; ty = 0; }
      apply();
    }, { passive: false });

    // Make images clickable
    for (const img of imgs) {
      if (img.closest('a')) continue; // respect linked images
      img.classList.add('lbTarget');
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => open(img));
    }
  };

  setupImageLightbox();

  // --- Before/After slider ---
  const setupBeforeAfter = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const sliders = Array.from(document.querySelectorAll('.ba'));
    if (!sliders.length) return;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const setPos = (root, ratio) => {
      const r = clamp(ratio, 0, 1);
      root.style.setProperty('--ba', `${r * 100}%`);
      root.setAttribute('data-ba', String(Math.round(r * 100)));
    };

    const getRatioFromEvent = (root, e) => {
      const media = root.querySelector('.ba-media') || root;
      const rect = media.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      return clamp(x, 0, 1);
    };

    for (const root of sliders) {
      const handle = root.querySelector('.ba-handle');
      if (!handle) continue;

      // default position
      const initial = Number(root.getAttribute('data-initial') || '50') / 100;
      setPos(root, isFinite(initial) ? initial : 0.5);

      if (reduce) continue;

      let down = false;

      const onDown = (e) => {
        down = true;
        handle.setPointerCapture?.(e.pointerId);
        setPos(root, getRatioFromEvent(root, e));
      };
      const onMove = (e) => {
        if (!down) return;
        setPos(root, getRatioFromEvent(root, e));
      };
      const onUp = () => {
        down = false;
      };

      handle.addEventListener('pointerdown', onDown);
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);

      // Click anywhere on the slider jumps the handle
      root.addEventListener('click', (e) => {
        // avoid double-trigger when dragging
        if (down) return;
        setPos(root, getRatioFromEvent(root, e));
      });
    }
  };

  setupBeforeAfter();

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

  // --- Design system widgets ---
  const setupButtonPlaygrounds = () => {
    const roots = Array.from(document.querySelectorAll('[data-ds-button-playground]'));
    roots.forEach((root) => {
      const selVariant = root.querySelector('[data-ds-variant]');
      const selState = root.querySelector('[data-ds-state]');
      const selSize = root.querySelector('[data-ds-size]');
      const selKind = root.querySelector('[data-ds-kind]');
      const btn = root.querySelector('button.dsBtn');
      const hint = root.querySelector('[data-ds-hint]');

      if (!selVariant || !selState || !selSize || !selKind || !btn) return;

      const apply = () => {
        const variant = selVariant.value;
        const state = selState.value;
        const size = selSize.value;
        const kind = selKind.value;

        btn.setAttribute('data-variant', variant);
        btn.setAttribute('data-state', state);
        btn.setAttribute('data-size', size);
        btn.setAttribute('data-kind', kind);

        const disabled = state === 'disabled';
        btn.disabled = disabled;

        // Keep hint tidy
        if (hint) hint.textContent = `${variant} · ${kind} · ${state} · ${size}`;
      };

      selVariant.addEventListener('change', apply);
      selKind.addEventListener('change', apply);
      selState.addEventListener('change', apply);
      selSize.addEventListener('change', apply);
      apply();
    });
  };

  setupButtonPlaygrounds();

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
