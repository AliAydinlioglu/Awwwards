/**
 * AURELIA — NEOCLASSICAL DIGITAL ATELIER
 * Cinematic Video Scroll Sync, Audio Synthesizer, and Motion Orchestration
 */

(function () {
  'use strict';

  // State
  let videoDuration = 10.0;
  let isVideoReady = false;
  let targetProgress = 0;
  let smoothedProgress = 0;
  let currentVideoTime = 0;
  let targetVideoTime = 0;
  let activeSceneIndex = -1;

  // DOM Elements
  const cinemaHero = document.getElementById('cinemaHero');
  const cinemaStickyViewport = document.getElementById('cinemaStickyViewport') || document.querySelector('.cinema-sticky-viewport');
  const heroVideo = document.getElementById('heroVideo');
  const railProgressBar = document.getElementById('railProgressBar');
  const stageProgressFill = document.getElementById('stageProgressFill');
  const hudTime = document.getElementById('hudTime');
  const hudFrame = document.getElementById('hudFrame');
  const scrollCue = document.getElementById('scrollCue');
  const scenePanels = [
    document.getElementById('scene1'),
    document.getElementById('scene2'),
    document.getElementById('scene3'),
    document.getElementById('scene4'),
  ];
  const railItems = document.querySelectorAll('.rail-item');
  const soundToggle = document.getElementById('soundToggle');
  const particlesCanvas = document.getElementById('particlesCanvas');
  const osloClock = document.getElementById('osloClock');
  const athensClock = document.getElementById('athensClock');
  const commissionForm = document.getElementById('commissionForm');
  const formMsg = document.getElementById('formMsg');
  const submitBtn = document.getElementById('submitBtn');

  // Scene thresholds in progress (0 to 1)
  const scenesConfig = [
    { start: 0.00, exit: 0.24, index: 0 },
    { start: 0.24, exit: 0.50, index: 1 },
    { start: 0.50, exit: 0.76, index: 2 },
    { start: 0.76, exit: 1.00, index: 3 },
  ];

  /* ==========================================================================
     1. VIDEO INITIALIZATION & SCROLL SCRUB ENGINE
     ========================================================================== */
  function primeVideo() {
    if (!heroVideo) return;
    heroVideo.muted = true;
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        heroVideo.pause();
        heroVideo.currentTime = currentVideoTime || 0.01;
      }).catch(() => {
        // Handled silently if interaction is needed
      });
    }
  }

  function initVideo() {
    if (!heroVideo) return;

    heroVideo.pause();

    heroVideo.addEventListener('loadedmetadata', () => {
      videoDuration = heroVideo.duration || 10.0;
      isVideoReady = true;
      heroVideo.currentTime = 0.01;
      primeVideo();
    });

    if (heroVideo.readyState >= 1) {
      videoDuration = heroVideo.duration || 10.0;
      isVideoReady = true;
      primeVideo();
    }

    heroVideo.load();
  }

  function updateScrollProgress() {
    if (!cinemaHero) return;

    const rect = cinemaHero.getBoundingClientRect();
    const maxScroll = cinemaHero.offsetHeight - window.innerHeight;

    if (maxScroll <= 0) {
      targetProgress = 0;
    } else {
      const currentScroll = -rect.top;
      const rawProgress = currentScroll / maxScroll;
      targetProgress = Math.min(Math.max(rawProgress, 0), 1);
    }

    // Hide scroll cue on scroll
    if (scrollCue) {
      if (-rect.top > 60) {
        scrollCue.style.opacity = '0';
      } else {
        scrollCue.style.opacity = '1';
      }
    }

    // Immediately trigger scene transitions on scroll for snappy feedback
    syncScenes(targetProgress);
  }

  function syncScenes(progress) {
    let currentIndex = 0;

    for (let i = 0; i < scenesConfig.length; i++) {
      const cfg = scenesConfig[i];
      if (progress >= cfg.start && progress <= cfg.exit) {
        currentIndex = cfg.index;
        break;
      }
    }
    if (progress > scenesConfig[scenesConfig.length - 1].exit) {
      currentIndex = scenesConfig.length - 1;
    }

    if (currentIndex === activeSceneIndex) return;
    activeSceneIndex = currentIndex;

    scenePanels.forEach((panel, idx) => {
      if (!panel) return;
      if (idx === activeSceneIndex) {
        panel.classList.add('is-active');
        panel.classList.remove('is-exiting');
      } else if (idx < activeSceneIndex) {
        panel.classList.remove('is-active');
        panel.classList.add('is-exiting');
      } else {
        panel.classList.remove('is-active');
        panel.classList.remove('is-exiting');
      }
    });

    railItems.forEach((item, idx) => {
      if (idx === activeSceneIndex) {
        item.classList.add('is-active');
      } else {
        item.classList.remove('is-active');
      }
    });
  }

  function renderLoop() {
    // Smooth interpolation on progress for cinematic fluid motion
    smoothedProgress += (targetProgress - smoothedProgress) * 0.16;

    // ACTIVE STICKY GUARDIAN:
    // Guarantees cinemaStickyViewport stays locked in view across all OS & browser engines
    if (cinemaHero && cinemaStickyViewport) {
      const heroRect = cinemaHero.getBoundingClientRect();
      const maxScroll = cinemaHero.offsetHeight - window.innerHeight;
      const currentScroll = -heroRect.top;

      if (currentScroll >= 0 && currentScroll <= maxScroll) {
        // Inside the hero scrub timeline: must stay visible at top of viewport
        const stickyRect = cinemaStickyViewport.getBoundingClientRect();
        if (stickyRect.top < -2 || cinemaStickyViewport.dataset.fallbackFixed === 'true') {
          cinemaStickyViewport.dataset.fallbackFixed = 'true';
          cinemaStickyViewport.style.position = 'fixed';
          cinemaStickyViewport.style.top = '0';
          cinemaStickyViewport.style.left = '0';
          cinemaStickyViewport.style.width = '100%';
          cinemaStickyViewport.style.height = '100vh';
          cinemaStickyViewport.style.transform = 'translateY(0)';
          cinemaStickyViewport.style.zIndex = '5';
        }
      } else if (currentScroll > maxScroll) {
        // Scrolled down past the hero stage into Manifesto
        if (cinemaStickyViewport.dataset.fallbackFixed === 'true') {
          cinemaStickyViewport.style.position = 'absolute';
          cinemaStickyViewport.style.top = 'auto';
          cinemaStickyViewport.style.bottom = '0';
          cinemaStickyViewport.style.left = '0';
          cinemaStickyViewport.style.transform = 'none';
        }
      } else {
        // At the very top (currentScroll < 0)
        if (cinemaStickyViewport.dataset.fallbackFixed === 'true') {
          cinemaStickyViewport.style.position = '';
          cinemaStickyViewport.style.top = '';
          cinemaStickyViewport.style.bottom = '';
          cinemaStickyViewport.style.transform = '';
          delete cinemaStickyViewport.dataset.fallbackFixed;
        }
      }
    }

    if (heroVideo && isVideoReady) {
      targetVideoTime = Math.max(0.01, Math.min(smoothedProgress * (videoDuration - 0.05), videoDuration - 0.05));

      // Seek lerp
      const diff = targetVideoTime - currentVideoTime;
      if (Math.abs(diff) < 0.005) {
        currentVideoTime = targetVideoTime;
      } else {
        currentVideoTime += diff * 0.25;
      }

      if (Math.abs(heroVideo.currentTime - currentVideoTime) > 0.02) {
        if (heroVideo.fastSeek) {
          heroVideo.fastSeek(currentVideoTime);
        } else {
          heroVideo.currentTime = currentVideoTime;
        }
      }

      // Update HUD
      if (hudTime) {
        hudTime.textContent = currentVideoTime.toFixed(2) + 's';
      }
      if (hudFrame) {
        const frameNum = Math.floor(currentVideoTime * 24) + 1;
        hudFrame.textContent = String(frameNum).padStart(3, '0');
      }
    }

    // Update Progress Bars
    const pct = (smoothedProgress * 100).toFixed(1) + '%';
    if (railProgressBar) railProgressBar.style.height = pct;
    if (stageProgressFill) stageProgressFill.style.width = pct;

    // Fade out HUD & Timeline rail when leaving pinned hero section
    const hudElement = document.querySelector('.scrub-hud');
    const railElement = document.querySelector('.timeline-rail');
    if (smoothedProgress >= 0.98) {
      if (hudElement) {
        hudElement.style.opacity = '0';
        hudElement.style.pointerEvents = 'none';
      }
      if (railElement) {
        railElement.style.opacity = '0';
        railElement.style.pointerEvents = 'none';
      }
    } else {
      if (hudElement) {
        hudElement.style.opacity = '1';
        hudElement.style.pointerEvents = 'auto';
      }
      if (railElement) {
        railElement.style.opacity = '1';
        railElement.style.pointerEvents = 'auto';
      }
    }

    requestAnimationFrame(renderLoop);
  }

  /* ==========================================================================
     2. CHAPTER RAIL CLICK INTERACTION
     ========================================================================== */
  railItems.forEach((item) => {
    item.addEventListener('click', () => {
      const sceneIdx = parseInt(item.getAttribute('data-scene'), 10);
      if (isNaN(sceneIdx)) return;

      const targetScene = scenesConfig[sceneIdx];
      const maxScroll = cinemaHero.offsetHeight - window.innerHeight;
      const targetScrollY = cinemaHero.offsetTop + targetScene.start * maxScroll + 30;

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });
    });
  });

  /* ==========================================================================
     3. FLOATING GOLDEN PARTICLES CANVAS
     ========================================================================== */
  function initParticles() {
    if (!particlesCanvas) return;
    const ctx = particlesCanvas.getContext('2d');
    let width = (particlesCanvas.width = window.innerWidth);
    let height = (particlesCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = particlesCanvas.width = window.innerWidth;
      height = particlesCanvas.height = window.innerHeight;
    });

    const particles = [];
    const count = window.innerWidth < 768 ? 24 : 50;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.4 - 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;

        if (p.y < 0) p.y = height;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 169, 110, ${currentAlpha})`;
        ctx.shadowColor = '#c9a96e';
        ctx.shadowBlur = 6;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }

  /* ==========================================================================
     4. PROCEDURAL AMBIENT SYNTHESIZER (WEB AUDIO API)
     ========================================================================== */
  let audioCtx = null;
  let masterGain = null;
  let isSoundActive = false;
  let synthNodes = [];

  function toggleAmbianceSound() {
    if (!isSoundActive) {
      startAmbiance();
      isSoundActive = true;
      if (soundToggle) {
        soundToggle.classList.add('is-active');
        const label = soundToggle.querySelector('.sound-label');
        if (label) label.textContent = 'SOUND: ON';
      }
    } else {
      stopAmbiance();
      isSoundActive = false;
      if (soundToggle) {
        soundToggle.classList.remove('is-active');
        const label = soundToggle.querySelector('.sound-label');
        if (label) label.textContent = 'SOUND: OFF';
      }
    }
  }

  function startAmbiance() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 2.5);
      masterGain.connect(audioCtx.destination);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, audioCtx.currentTime);
      filter.Q.setValueAtTime(3.5, audioCtx.currentTime);
      filter.connect(masterGain);

      const frequencies = [55, 110, 165, 220, 277.18];

      synthNodes = frequencies.map((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(0.08 + idx * 0.03, audioCtx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, audioCtx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.2 / (idx + 1), audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(filter);
        osc.start();

        return { osc, gain, lfo };
      });
    } catch (e) {
      console.warn('Audio synthesis not supported or blocked:', e);
    }
  }

  function stopAmbiance() {
    if (!audioCtx || !masterGain) return;
    try {
      masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      setTimeout(() => {
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close();
        }
        synthNodes = [];
        audioCtx = null;
      }, 1300);
    } catch (e) {
      console.warn('Error stopping audio:', e);
    }
  }

  if (soundToggle) {
    soundToggle.addEventListener('click', toggleAmbianceSound);
  }

  /* ==========================================================================
     5. PILLARS ACCORDION INTERACTION
     ========================================================================== */
  const pillarRows = document.querySelectorAll('.pillar-row');
  pillarRows.forEach((row) => {
    const summary = row.querySelector('.pillar-summary');
    if (!summary) return;

    summary.addEventListener('click', () => {
      const isOpen = row.classList.contains('is-open');
      pillarRows.forEach((r) => r.classList.remove('is-open'));
      if (!isOpen) {
        row.classList.add('is-open');
      }
    });
  });

  /* ==========================================================================
     6. LIVE CHRONOMETER CLOCKS (OSLO & ATHENS)
     ========================================================================== */
  function updateClocks() {
    const now = new Date();

    if (osloClock) {
      const osloTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Oslo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      osloClock.textContent = osloTime;
    }

    if (athensClock) {
      const athensTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Athens',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      athensClock.textContent = athensTime;
    }
  }

  setInterval(updateClocks, 1000);
  updateClocks();

  /* ==========================================================================
     7. COMMISSION FORM HANDLER
     ========================================================================== */
  if (commissionForm) {
    commissionForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('clientName').value.trim();
      const org = document.getElementById('clientOrg').value.trim();
      const email = document.getElementById('clientEmail').value.trim();
      const vision = document.getElementById('projectVision').value.trim();

      if (!name || !org || !email || !vision) {
        if (formMsg) {
          formMsg.textContent = 'Please fill out all required inscription fields.';
          formMsg.className = 'form-response-msg is-success';
          formMsg.style.borderColor = '#c95959';
          formMsg.style.color = '#ff9999';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'TRANSMITTING OPUS...';
      }

      setTimeout(() => {
        if (formMsg) {
          formMsg.textContent = `Inscription received. Atelier Principals will review the dossier for ${org} and respond within 5 business days under strict Swiss confidentiality.`;
          formMsg.className = 'form-response-msg is-success';
          formMsg.style.borderColor = 'var(--accent-gold)';
          formMsg.style.color = 'var(--accent-gold-light)';
        }
        commissionForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          const btnText = submitBtn.querySelector('.btn-text');
          if (btnText) btnText.textContent = 'INSCRIPTION TRANSMITTED';
        }
      }, 1000);
    });
  }

  /* ==========================================================================
     8. GLOBAL LISTENERS & LIFECYCLE
     ========================================================================== */
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  window.addEventListener('pointerdown', primeVideo, { once: true, passive: true });
  window.addEventListener('keydown', primeVideo, { once: true, passive: true });
  window.addEventListener('wheel', primeVideo, { once: true, passive: true });

  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('is-loading');
    initVideo();
    initParticles();
    updateScrollProgress();
    requestAnimationFrame(renderLoop);
  });
})();
