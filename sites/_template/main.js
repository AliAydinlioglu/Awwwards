/**
 * AWWWARDS STARTER TEMPLATE — CORE MOTION LOOP & SCROLL ENGINE
 */
(function() {
  'use strict';

  const hero = document.getElementById('pinnedHero');
  const stickyViewport = document.getElementById('stickyViewport');
  const scrubFill = document.getElementById('scrubFill');
  const scrubVal = document.getElementById('scrubVal');
  const cards = [
    document.getElementById('scene1'),
    document.getElementById('scene2'),
    document.getElementById('scene3'),
  ];

  let targetProgress = 0;
  let smoothedProgress = 0;
  let activeScene = 0;

  const sceneBreakpoints = [
    { start: 0.00, end: 0.33, index: 0 },
    { start: 0.33, end: 0.66, index: 1 },
    { start: 0.66, end: 1.00, index: 2 },
  ];

  function onScroll() {
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const max = hero.offsetHeight - window.innerHeight;
    const scroll = -rect.top;
    targetProgress = max > 0 ? Math.min(Math.max(scroll / max, 0), 1) : 0;
  }

  function loop() {
    smoothedProgress += (targetProgress - smoothedProgress) * 0.14;

    // Active Sticky Guardian: Prevents any offscreen slippage
    if (hero && stickyViewport) {
      const heroRect = hero.getBoundingClientRect();
      const maxScroll = hero.offsetHeight - window.innerHeight;
      const currentScroll = -heroRect.top;

      if (currentScroll >= 0 && currentScroll <= maxScroll) {
        const r = stickyViewport.getBoundingClientRect();
        if (r.top < -2 || stickyViewport.dataset.fixed === 'true') {
          stickyViewport.dataset.fixed = 'true';
          stickyViewport.style.position = 'fixed';
          stickyViewport.style.top = '0';
          stickyViewport.style.left = '0';
        }
      } else if (currentScroll > maxScroll) {
        if (stickyViewport.dataset.fixed === 'true') {
          stickyViewport.style.position = 'absolute';
          stickyViewport.style.top = 'auto';
          stickyViewport.style.bottom = '0';
        }
      } else {
        if (stickyViewport.dataset.fixed === 'true') {
          stickyViewport.style.position = '';
          stickyViewport.style.top = '';
          delete stickyViewport.dataset.fixed;
        }
      }
    }

    // Update Progress Gauge
    const pct = (smoothedProgress * 100).toFixed(0);
    if (scrubFill) scrubFill.style.width = pct + '%';
    if (scrubVal) scrubVal.textContent = pct.padStart(2, '0') + '%';

    // Scene switching
    let newIndex = 0;
    for (let i = 0; i < sceneBreakpoints.length; i++) {
      if (smoothedProgress >= sceneBreakpoints[i].start && smoothedProgress <= sceneBreakpoints[i].end) {
        newIndex = sceneBreakpoints[i].index;
        break;
      }
    }

    if (newIndex !== activeScene) {
      activeScene = newIndex;
      cards.forEach((c, idx) => {
        if (!c) return;
        if (idx === activeScene) {
          c.classList.add('is-active');
        } else {
          c.classList.remove('is-active');
        }
      });
    }

    requestAnimationFrame(loop);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  window.addEventListener('DOMContentLoaded', () => {
    onScroll();
    requestAnimationFrame(loop);
  });
})();
