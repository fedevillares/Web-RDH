// Decorative background videos (home hero, category cards, tienda headers).
// Markup: a wrapper with [data-bg-video="auto|hover"] holding an <img class="bg-video-poster">
// and a <video class="bg-video" data-src="..."> with no src. The poster is always what
// shows at rest or on any failure; the video only fades in once it is actually playing.
//   auto  → plays while visible (hero, tienda header), pauses off-screen.
//   hover → fine pointer: plays on hover from data-start. Touch: plays at ≥60% visible,
//           only one "hover" video at a time.
// Optional on the <video>: data-src-portrait (picked once, so only one file downloads),
// data-start (seconds to jump to on play, skipping the fade-in from black).
(() => {
  const wraps = document.querySelectorAll('[data-bg-video]');
  if (!wraps.length) return;

  const conn = navigator.connection || {};
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slowNet = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
  if (reducedMotion || slowNet || !('IntersectionObserver' in window)) return; // posters only

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const portrait = window.matchMedia('(orientation: portrait)').matches;

  const items = [...wraps].map(wrap => ({
    wrap,
    mode: wrap.dataset.bgVideo,
    video: wrap.querySelector('video.bg-video'),
    loaded: false,
    failed: false,
  })).filter(it => it.video);

  const load = (it) => {
    if (it.loaded) return;
    it.loaded = true;
    const v = it.video;
    v.muted = true; // required for autoplay; set as property too for older Safari
    v.addEventListener('playing', () => it.wrap.classList.add('is-playing'));
    v.addEventListener('error', () => fail(it));
    v.src = (portrait && v.dataset.srcPortrait) || v.dataset.src; // preload="none" → no bytes until play()
  };

  const fail = (it) => {
    it.failed = true;
    it.wrap.classList.remove('is-playing');
    it.video.removeAttribute('src');
    it.video.load();
  };

  const play = (it, fromStart) => {
    if (it.failed) return;
    load(it);
    const v = it.video;
    const start = parseFloat(v.dataset.start || '0');
    const seek = () => { if (start && v.duration > start) v.currentTime = start; };
    if (fromStart || !it.started) {
      it.started = true;
      if (v.readyState >= 1) seek();
      else v.addEventListener('loadedmetadata', seek, { once: true });
    }
    const p = v.play();
    if (p && p.catch) p.catch(() => {}); // autoplay refused → poster stays
  };

  const pause = (it, hide) => {
    it.video.pause();
    if (hide) it.wrap.classList.remove('is-playing');
  };

  // Lazy: assign the real src only when the element gets within ~300px of the viewport.
  const nearIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const it = items.find(i => i.wrap === e.target);
      nearIO.unobserve(e.target);
      if (it.mode === 'hover' && canHover) load(it);
    });
  }, { rootMargin: '300px 0px' });

  // Playback by visibility: "auto" items always, "hover" items only on touch devices.
  const ratios = new Map();
  let current = null; // the one touch "hover" video allowed to play

  const pickTouch = () => {
    let best = null, bestRatio = 0.6;
    ratios.forEach((r, it) => { if (r >= bestRatio) { best = it; bestRatio = r; } });
    if (best === current) return;
    if (current) pause(current, true);
    current = best;
    if (current) play(current, true);
  };

  const visIO = new IntersectionObserver((entries) => {
    let touchChanged = false;
    entries.forEach(e => {
      const it = items.find(i => i.wrap === e.target);
      if (it.mode === 'auto') {
        it.visible = e.isIntersecting;
        if (it.visible) play(it, false);
        else pause(it, false);
      } else {
        ratios.set(it, e.isIntersecting ? e.intersectionRatio : 0);
        touchChanged = true;
      }
    });
    if (touchChanged) pickTouch();
  }, { threshold: [0, 0.6, 0.8, 1] });

  items.forEach(it => {
    if (it.mode === 'hover' && canHover) {
      nearIO.observe(it.wrap);
      const host = it.wrap.closest('[data-bg-video-host]') || it.wrap;
      host.addEventListener('mouseenter', () => play(it, true));
      host.addEventListener('mouseleave', () => pause(it, true));
    } else {
      visIO.observe(it.wrap);
    }
  });

  // Don't keep decoding in a background tab.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) items.forEach(it => it.video.pause());
    else items.forEach(it => {
      if ((it.mode === 'auto' && it.visible) || it === current) play(it, false);
    });
  });
})();
