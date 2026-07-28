/* ═══════════════════════════════════════════════════════
   남영동개발추진위원회 — interaction engine
   ═══════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedMQ.matches;
  reducedMQ.addEventListener('change', (e) => { reduced = e.matches; });

  // ?qa=1 → render everything in its final state (visual QA / print)
  if (new URLSearchParams(location.search).has('qa')) {
    document.documentElement.classList.add('qa');
  }

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ── Viewport height, held steady ──
     Every scroll-driven animation maps against the viewport height. On a phone
     window.innerHeight changes the instant the URL bar slides away, so reading
     it live re-maps all of them mid-scroll and the page appears to jump. Only a
     width change or a big height change is a real resize; anything smaller is
     browser chrome and gets ignored. */
  let vwCache = window.innerWidth;
  let vhCache = window.innerHeight;
  const vhOf = () => vhCache;

  const remeasureViewport = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // desktop windows have no disappearing chrome, so every resize is real
    if (!canHover && w === vwCache && Math.abs(h - vhCache) < 140) return;
    vwCache = w;
    vhCache = h;
  };

  window.addEventListener('orientationchange', () => {
    // the chrome guard would swallow a rotation, so take it unconditionally
    setTimeout(() => { vwCache = window.innerWidth; vhCache = window.innerHeight; }, 60);
  });

  /* ── Loader → entrance ── */
  const T0 = performance.now();
  const MIN_LOADER = 700;

  const markLoaded = () => {
    const wait = Math.max(0, MIN_LOADER - (performance.now() - T0));
    setTimeout(() => document.body.classList.add('loaded'), wait);
  };

  if (document.readyState === 'complete') markLoaded();
  else window.addEventListener('load', markLoaded);
  setTimeout(markLoaded, 2500); // safety net

  /* ── Nav: hide on scroll down, glass on scroll, theme by section ── */
  const nav = document.getElementById('nav');
  const navProgress = document.getElementById('navProgress');
  const themed = Array.from(document.querySelectorAll('[data-theme]'));
  let lastY = window.scrollY;
  let navAnchor = lastY; // where the current direction of travel began
  let navDir = 0;

  const updateNav = (y) => {
    const max = Math.max(0, document.documentElement.scrollHeight - vhOf());
    // rubber-band overscroll reports positions outside the document, and the
    // tiny direction flips inside momentum scrolling used to strobe the bar
    const cy = clamp(y, 0, max);
    const delta = cy - lastY;

    nav.classList.toggle('nav--scrolled', cy > 10);

    if (delta !== 0) {
      const dir = delta > 0 ? 1 : -1;
      if (dir !== navDir) {
        navDir = dir;
        navAnchor = lastY;
      }
      // 14px of sustained travel before the bar commits either way
      if (cy < 90) nav.classList.remove('nav--hidden');
      else if (dir > 0 && cy - navAnchor > 14) nav.classList.add('nav--hidden');
      else if (dir < 0 && navAnchor - cy > 14) nav.classList.remove('nav--hidden');
    }

    lastY = cy;

    navProgress.style.setProperty('--sp', max > 0 ? (cy / max).toFixed(4) : '0');

    // probe point just under the nav bar; last DOM match wins (sticky stacking)
    const probe = 30;
    let theme = 'dark';
    for (const el of themed) {
      const r = el.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) theme = el.dataset.theme;
    }
    nav.dataset.themeNow = theme;
  };

  /* ── Hero: stripe drift + content parallax + pointer tracking ── */
  const hero = document.getElementById('hero');
  const stripe = document.getElementById('stripe');
  let bandTarget = 0;
  let band = 0;

  if (canHover) {
    hero.addEventListener(
      'pointermove',
      (ev) => {
        if (reduced) return;
        const r = hero.getBoundingClientRect();
        bandTarget = clamp((ev.clientY - r.top) / r.height - 0.5, -0.5, 0.5) * 190;
      },
      { passive: true }
    );
    hero.addEventListener('pointerleave', () => { bandTarget = 0; });
  }

  const updateHero = (y, t) => {
    if (y > vhOf() * 1.25) return;
    hero.style.setProperty('--hp', clamp(y / vhOf(), 0, 1).toFixed(4));

    band += (bandTarget - band) * 0.07;
    // the idle wobble fades out while the pointer is steering the band
    const settled = 1 - Math.min(1, Math.abs(band) / 90);
    const idle = reduced ? 0 : Math.sin(t / 1900) * 30 * settled;
    const sy = clamp(-40 + idle + band + y * 0.32, -190, 110);
    stripe.style.setProperty('--sy', sy.toFixed(1) + 'px');
  };

  /* ── Brand-tile marquee: drifts on its own, speeds up + skews with scroll ── */
  const marquee = document.getElementById('marquee');
  const track = document.getElementById('marqueeTrack');
  let mx = 0;
  let setW = 0;
  let skew = 0;
  let vel = 0;

  const measureMarquee = () => {
    const set = track.querySelector('.marquee-set');
    setW = set ? set.getBoundingClientRect().width : 0;
  };

  measureMarquee();
  window.addEventListener('load', measureMarquee);
  window.addEventListener('resize', measureMarquee);
  if (document.fonts) document.fonts.ready.then(measureMarquee);

  const updateMarquee = () => {
    if (!setW) return;
    const r = marquee.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vhOf() + 200) return; // off-screen: idle

    mx -= 0.95 + Math.abs(vel) * 0.32;
    if (mx <= -setW) mx += setW;

    // the skew re-rasterises a very wide layer every frame; on touch that lands
    // squarely on the scroll, so the track just drifts
    const target = canHover ? clamp(vel * 0.07, -8, 8) : 0;
    skew += (target - skew) * 0.1;

    track.style.transform =
      `translate3d(${mx.toFixed(1)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
  };

  /* ── Committee seal: always turning, spins up while the page scrolls ── */
  const seal = document.getElementById('seal');
  let sealRot = 0;

  const updateSeal = () => {
    if (!seal) return;
    const r = seal.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vhOf()) return; // off-screen: don't burn frames
    sealRot = (sealRot + 0.09 + vel * 0.06) % 360;
    seal.style.setProperty('--seal', sealRot.toFixed(2) + 'deg');
  };

  /* ── Nav: one pill slides between the links ── */
  const navLinks = document.querySelector('.nav-links');
  const navPill = document.getElementById('navPill');

  if (navLinks && navPill) {
    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('pointerenter', () => {
        const pad = 16;
        navPill.style.setProperty('--px', (a.offsetLeft - pad).toFixed(1) + 'px');
        navPill.style.setProperty('--pw', (a.offsetWidth + pad * 2).toFixed(1) + 'px');
      });
    });
  }

  /* ── Project panels: scrub progress, steps, stack exit ── */
  const wraps = Array.from(document.querySelectorAll('.panel-wrap'));
  const panels = wraps.map((w) => w.querySelector('.panel'));

  // same boundary expression as the CSS un-stack media query
  const flowMQ = window.matchMedia('(max-width: 960px)');

  const updatePanels = () => {
    const vh = vhOf();
    const stacked = !flowMQ.matches;

    wraps.forEach((wrap, i) => {
      const r = wrap.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return; // far off-screen

      const panel = panels[i];
      let p;

      if (stacked) {
        // pinned: progress across the wrap's extra scroll room
        const total = Math.max(1, r.height - vh);
        p = clamp(-r.top / total, 0, 1);
      } else {
        // flowing: progress as the panel travels up the viewport
        p = clamp((vh * 0.8 - r.top) / (vh * 0.9), 0, 1);
      }

      panel.style.setProperty('--p', p.toFixed(4));
      panel.classList.toggle('in', r.top < vh * 0.55);
      panel.classList.toggle('s1', p > 0.1);
      panel.classList.toggle('s2', p > 0.35);
      panel.classList.toggle('s3', p > 0.6);

      // this panel scales down as the next one slides over it
      // (wrap.bottom === next wrap.top, so the panel corrects its own
      //  --exit on every visible frame — survives jump scrolls)
      if (stacked && i < wraps.length - 1) {
        panel.style.setProperty('--exit', clamp(1 - r.bottom / vh, 0, 1).toFixed(4));
      }
    });
  };

  /* ── Master scroll/tick loop ── */
  let ticking = false;

  const tick = (t) => {
    const y = window.scrollY;
    updateNav(y);
    updateHero(y, t || performance.now());
    updatePanels();
    updateTilt();
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  };

  let velRef = window.scrollY;

  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      vel = vel * 0.6 + (y - velRef) * 0.4;
      velRef = y;
      requestTick();
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => { remeasureViewport(); requestTick(); },
    { passive: true }
  );

  // continuous loop: marquee drift, stripe wobble, tilt easing, cursor
  const idleLoop = (t) => {
    if (!document.hidden) {
      vel *= 0.92;
      if (!reduced) {
        // the stripe's idle wobble answers the pointer, so on touch it is pure
        // cost — a full-viewport clip-path recomputed behind every scrolled
        // frame. Scrolling still drives the band through tick().
        if (canHover) updateHero(window.scrollY, t);
        updateMarquee();
        updateSeal();
        updateTilt();
        updateCursor();
      }
    }
    requestAnimationFrame(idleLoop);
  };
  requestAnimationFrame(idleLoop);

  /* ── Reveal on scroll (staggered per parent) ── */
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  revealEls.forEach((el) => {
    const siblings = Array.from(el.parentElement.querySelectorAll(':scope > [data-reveal]'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.setProperty('--rd', (idx * 0.09).toFixed(2) + 's');
  });

  if (!('IntersectionObserver' in window)) {
    // no observer → show everything rather than leaving the page blank
    revealEls.forEach((el) => el.classList.add('revealed'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('revealed');
        if (!reduced && e.target.classList.contains('sec-eyebrow')) scramble(e.target);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  revealEls.forEach((el) => io.observe(el));

  /* ── 3D tilt on project mockups ── */
  const tiltEls = Array.from(document.querySelectorAll('.tilt'));
  const tiltState = new Map();

  tiltEls.forEach((el) => {
    tiltState.set(el, { rx: 0, ry: 0, trx: 0, try: 0 });
    if (!canHover) return;

    el.addEventListener('pointermove', (ev) => {
      if (reduced) return;
      const r = el.getBoundingClientRect();
      const dx = (ev.clientX - r.left) / r.width - 0.5;
      const dy = (ev.clientY - r.top) / r.height - 0.5;
      const s = tiltState.get(el);
      s.trx = -dy * 9;
      s.try = dx * 11;
    });

    el.addEventListener('pointerleave', () => {
      const s = tiltState.get(el);
      s.trx = 0;
      s.try = 0;
    });
  });

  function updateTilt() {
    if (!canHover || reduced) return;
    tiltEls.forEach((el) => {
      const s = tiltState.get(el);
      s.rx += (s.trx - s.rx) * 0.12;
      s.ry += (s.try - s.ry) * 0.12;
      if (Math.abs(s.rx) < 0.01 && Math.abs(s.ry) < 0.01 && s.trx === 0 && s.try === 0) return;
      el.style.setProperty('--rx', s.rx.toFixed(2) + 'deg');
      el.style.setProperty('--ry', s.ry.toFixed(2) + 'deg');
    });
  }

  /* ── Magnetic buttons (translate transition lives in .btn.magnetic CSS) ── */
  if (canHover) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (ev) => {
        if (reduced) return;
        const r = btn.getBoundingClientRect();
        const dx = ev.clientX - (r.left + r.width / 2);
        const dy = ev.clientY - (r.top + r.height / 2);
        btn.style.translate = `${(dx * 0.18).toFixed(1)}px ${(dy * 0.28).toFixed(1)}px`;
      });

      btn.addEventListener('pointerleave', () => {
        btn.style.translate = '0px 0px';
      });
    });
  }

  /* ── Inverting cursor: lagging ring + exact dot, native pointer hidden ── */
  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursorDot');
  let cxNow = 0;
  let cyNow = 0;
  let cxTo = 0;
  let cyTo = 0;
  const cursorOn = canHover && !reduced;

  if (cursorOn) {
    document.documentElement.classList.add('has-cursor');
    cursor.classList.add('idle');

    window.addEventListener(
      'pointermove',
      (ev) => {
        cxTo = ev.clientX;
        cyTo = ev.clientY;
        cursor.classList.remove('idle');
        cursorDot.style.transform = `translate3d(${cxTo}px, ${cyTo}px, 0)`;

        const hit = ev.target.closest
          ? ev.target.closest('a, button, .magnetic, .member, .tilt, .phones')
          : null;
        cursor.classList.toggle('on', !!hit);
        // only links that leave the site get the arrow glyph
        cursor.classList.toggle('link', !!(hit && hit.target === '_blank'));
      },
      { passive: true }
    );

    const park = () => cursor.classList.add('idle');
    document.addEventListener('pointerleave', park);
    window.addEventListener('blur', park);
  }

  function updateCursor() {
    if (!cursorOn) return;
    cxNow += (cxTo - cxNow) * 0.19;
    cyNow += (cyTo - cyNow) * 0.19;
    cursor.style.transform = `translate3d(${cxNow.toFixed(1)}px, ${cyNow.toFixed(1)}px, 0)`;
  }

  /* ── Section eyebrows scramble into place ── */
  const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#___';

  const scramble = (el) => {
    const final = el.textContent.trim();
    el.textContent = final; // normalise before measuring
    const plan = final.split('').map((c, i) => ({
      c,
      start: Math.round(i * 1.6 + Math.random() * 6),
      end: Math.round(i * 1.6 + 14 + Math.random() * 16),
    }));
    let frame = 0;

    const step = () => {
      let out = '';
      let done = 0;
      for (const q of plan) {
        if (q.c === ' ') { out += ' '; done++; continue; }
        if (frame >= q.end) { out += q.c; done++; }
        else if (frame >= q.start) {
          out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        } else out += ' ';
      }
      el.textContent = out;
      if (done === plan.length) return;
      frame++;
      requestAnimationFrame(step);
    };

    step();
  };

  /* ── Footer wordmark: wrap glyphs so they can lift in sequence ── */
  const footerWord = document.getElementById('footerWord');

  if (footerWord && !reduced) {
    const text = footerWord.textContent;
    footerWord.textContent = '';
    text.split('').forEach((ch, i) => {
      const s = document.createElement('i');
      s.textContent = ch;
      s.style.setProperty('--i', i);
      footerWord.appendChild(s);
    });
  }

  /* ── Team photos: the frame only exists once a real photo loads ──
     opt-in rather than opt-out, so a missing file leaves a clean nameplate
     instead of an empty coloured box */
  document.querySelectorAll('.member-photo img').forEach((img) => {
    const ok = () => img.closest('.member').classList.add('has-photo');
    if (img.complete && img.naturalWidth > 0) ok();
    img.addEventListener('load', ok);
  });

  /* ── First paint ── */
  requestTick();
})();
