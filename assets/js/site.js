(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pad = n => String(n).padStart(2, '0');

  /* Header: glass on scroll, hide while reading down, mobile menu ---------- */
  const header = $('[data-header]');
  const nav = $('#site-nav');
  const menuButton = $('[data-menu-btn]');
  const mobileNav = window.matchMedia('(max-width: 960px)');
  let lastY = window.scrollY;

  function updateHeader() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    const menuOpen = nav.classList.contains('is-open');
    if (y < 400 || y < lastY - 6 || menuOpen) header.classList.remove('is-hidden');
    else if (y > lastY + 6 && !header.contains(document.activeElement)) header.classList.add('is-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  updateHeader();

  function setMenu(open, restoreFocus = false) {
    menuButton.setAttribute('aria-expanded', String(open));
    $('.visually-hidden', menuButton).textContent = open ? 'Close menu' : 'Menu';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) $('a', nav).focus();
    else if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    if (event.target.closest('a') && nav.classList.contains('is-open')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (!nav.classList.contains('is-open')) return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key === 'Tab') {
      const items = [menuButton, ...$$('a', nav)];
      const index = items.indexOf(document.activeElement);
      const next = event.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index + 1) % items.length;
      event.preventDefault();
      items[next].focus();
    }
  });
  mobileNav.addEventListener('change', () => setMenu(false));

  // Highlight the section currently being read.
  const navLinks = $$('[data-nav]');
  const navTargets = navLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach(link => link.setAttribute('aria-current', String(link.getAttribute('href') === `#${entry.target.id}`)));
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  navTargets.forEach(target => spy.observe(target));
  const quietSpy = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) navLinks.forEach(link => link.setAttribute('aria-current', 'false'));
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['#top', '#free', '#download'].forEach(id => { const el = $(id); if (el) quietSpy.observe(el); });

  /* Reveal on scroll ---------------------------------------------------------- */
  const revealer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      revealer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
  $$('[data-reveal]').forEach(el => revealer.observe(el));

  /* Starfield --------------------------------------------------------------- */
  function starfield(canvas) {
    const context = canvas.getContext('2d');
    if (!context) return;
    let width = 0, height = 0, stars = [], meteor = null, frame = 0, running = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(260, Math.round(width * height / 8500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.pow(Math.random(), 1.4) * height * .8,
        r: Math.random() * 1.05 + .25,
        a: Math.random() * .55 + .25,
        speed: Math.random() * 1.6 + .4,
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() < .14,
      }));
      draw(performance.now());
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);
      const still = reducedMotion.matches;
      for (const star of stars) {
        const twinkle = still ? .8 : Math.sin(time / 1000 * star.speed + star.phase) * .5 + .5;
        context.globalAlpha = star.a * (.3 + .7 * twinkle);
        context.fillStyle = star.gold ? '#f3dfb4' : '#ffffff';
        context.beginPath();
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        context.fill();
      }
      if (still) return;
      if (!meteor && Math.random() < .0035) {
        meteor = { x: width * (.35 + Math.random() * .6), y: height * Math.random() * .3, vx: -(5 + Math.random() * 3), vy: 1.8 + Math.random() * 1.2, life: 0 };
      }
      if (meteor) {
        meteor.life += 1;
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        const fade = Math.max(0, 1 - meteor.life / 60);
        const tailX = meteor.x - meteor.vx * 16, tailY = meteor.y - meteor.vy * 16;
        const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 244, 222, ${fade})`);
        gradient.addColorStop(1, 'rgba(255, 244, 222, 0)');
        context.globalAlpha = 1;
        context.strokeStyle = gradient;
        context.lineWidth = 1.3;
        context.beginPath();
        context.moveTo(meteor.x, meteor.y);
        context.lineTo(tailX, tailY);
        context.stroke();
        if (meteor.life > 60) meteor = null;
      }
    }

    function loop(time) {
      draw(time);
      frame = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reducedMotion.matches) return;
      running = true;
      frame = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reducedMotion.addEventListener('change', () => { stop(); resize(); start(); });
  }
  $$('[data-starfield]').forEach(starfield);

  /* Hero and world parallax ------------------------------------------------------ */
  const heroImage = $('[data-hero-media] img');
  const parallaxItems = $$('[data-parallax] img');
  const finePointer = window.matchMedia('(pointer: fine)');
  let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0, parallaxFrame = 0;
  const visibleParallax = new Set();

  function renderParallax() {
    parallaxFrame = 0;
    if (reducedMotion.matches) return;
    easedX += (pointerX - easedX) * .07;
    easedY += (pointerY - easedY) * .07;
    if (heroImage && window.scrollY < window.innerHeight * 1.2) {
      heroImage.style.setProperty('--hx', `${easedX.toFixed(2)}px`);
      heroImage.style.setProperty('--hy', `${(easedY + window.scrollY * .16).toFixed(2)}px`);
    }
    if (!mobileNav.matches) {
      for (const img of visibleParallax) {
        const rect = img.parentElement.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.setProperty('--py', `${(progress * -48).toFixed(1)}px`);
      }
    }
    if (Math.abs(pointerX - easedX) > .05 || Math.abs(pointerY - easedY) > .05) requestParallax();
  }
  function requestParallax() {
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(renderParallax);
  }
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax);
  $('.hero')?.addEventListener('pointermove', event => {
    if (!finePointer.matches) return;
    pointerX = (event.clientX / window.innerWidth - .5) * -22;
    pointerY = (event.clientY / window.innerHeight - .5) * -14;
    requestParallax();
  });
  const parallaxWatcher = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const img = $('img', entry.target);
      if (entry.isIntersecting) visibleParallax.add(img);
      else visibleParallax.delete(img);
    }
    requestParallax();
  });
  parallaxItems.forEach(img => parallaxWatcher.observe(img.parentElement));

  /* Prologue: scroll-driven frames ------------------------------------------- */
  const story = $('[data-story]');
  if (story) {
    const steps = $$('.story-step', story);
    const frames = $$('.story-frame img', story);
    const counter = $('[data-story-count]', story);
    const progress = $('[data-story-progress]', story);
    let activeStep = 0;
    const setStep = index => {
      if (index === activeStep || index < 0) return;
      activeStep = index;
      steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
      frames.forEach((img, i) => img.classList.toggle('is-active', i === index));
      counter.textContent = pad(index + 1);
      progress.style.setProperty('--p', ((index + 1) / steps.length).toFixed(4));
    };
    const stepWatcher = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setStep(steps.indexOf(entry.target));
    }, { rootMargin: '-48% 0px -48% 0px' });
    steps.forEach(step => stepWatcher.observe(step));
  }

  /* Stellans spotlight ------------------------------------------------------------ */
  const spotlight = $('[data-spotlight]');
  if (spotlight) {
    const stage = $('.spotlight', spotlight);
    const tabs = $$('.roster-tab', spotlight);
    const panels = $$('.stellan', spotlight);
    const list = $('.roster-list', spotlight);
    const backdrop = $('[data-backdrop]', spotlight);
    const counter = $('[data-spot-count]', spotlight);
    const assetPath = (id, file) => `./assets/img/stellans/${id}/${file}.webp`;
    let current = 0;

    panels.forEach((panel, index) => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabs[index].id);
      // Only the visible Stellan's portrait downloads up front.
      const img = $('[data-pose-img]', panel);
      if (index !== 0) {
        img.dataset.src = img.getAttribute('src');
        img.removeAttribute('src');
      }
    });

    function centerTab(index) {
      const tab = tabs[index];
      const left = tab.offsetLeft - list.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2;
      list.scrollTo({ left, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }

    function select(index, { focus = false } = {}) {
      if (index === current || index < 0) {
        if (focus) tabs[index]?.focus();
        return;
      }
      const panel = panels[index];
      const id = panel.dataset.stellan;
      const img = $('[data-pose-img]', panel);
      if (img.dataset.src && !img.getAttribute('src')) img.src = img.dataset.src;

      panels[current].classList.remove('is-active');
      panel.classList.add('is-active');
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      current = index;
      stage.style.setProperty('--c', panel.style.getPropertyValue('--c'));
      counter.textContent = pad(index + 1);

      backdrop.classList.add('is-swapping');
      window.setTimeout(() => {
        if (current !== index) return;
        backdrop.onload = () => backdrop.classList.remove('is-swapping');
        backdrop.src = assetPath(id, 'backdrop');
        if (backdrop.complete) backdrop.classList.remove('is-swapping');
      }, 260);

      // Warm the neighbours so stepping through feels instant.
      for (const near of [index - 1, index + 1]) {
        const neighbour = panels[(near + panels.length) % panels.length];
        const preload = new Image();
        preload.src = $('[data-pose-img]', neighbour).dataset.src || $('[data-pose-img]', neighbour).src;
      }

      centerTab(index);
      if (focus) tabs[index].focus({ preventScroll: true });
    }

    function step(direction, focus = false) {
      select((current + direction + panels.length) % panels.length, { focus });
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (event.key in keys) {
          event.preventDefault();
          step(keys[event.key], true);
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          select(event.key === 'Home' ? 0 : panels.length - 1, { focus: true });
        }
      });
    });
    $$('[data-step]', spotlight).forEach(button => button.addEventListener('click', () => step(Number(button.dataset.step))));

    // Expressions
    spotlight.addEventListener('click', event => {
      const button = event.target.closest('[data-pose]');
      if (!button || button.getAttribute('aria-pressed') === 'true') return;
      const panel = button.closest('.stellan');
      const img = $('[data-pose-img]', panel);
      const name = $('.stellan-name', panel).textContent;
      $$('[data-pose]', panel).forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      const next = new Image();
      next.src = assetPath(panel.dataset.stellan, button.dataset.pose);
      next.decode().catch(() => {}).then(() => {
        img.classList.add('is-leaving');
        window.setTimeout(() => {
          img.src = next.src;
          img.alt = button.dataset.pose === 'neutral' ? `${name}, full-length portrait` : `${name}, full-length portrait (${button.textContent.toLowerCase()})`;
          img.classList.remove('is-leaving');
        }, reducedMotion.matches ? 0 : 170);
      });
    });
    spotlight.addEventListener('pointerover', event => {
      const group = event.target.closest('.pose-switch');
      if (!group || group.dataset.warmed) return;
      group.dataset.warmed = 'true';
      const id = group.closest('.stellan').dataset.stellan;
      $$('[data-pose]', group).forEach(button => { new Image().src = assetPath(id, button.dataset.pose); });
    });

    // Swipe between Stellans on touch screens.
    let touchStart = null;
    stage.addEventListener('touchstart', event => {
      if (event.target.closest('.pose-switch, button, a')) return;
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    stage.addEventListener('touchend', event => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) step(dx < 0 ? 1 : -1);
    }, { passive: true });

    // Deep links such as #stellan-kanon
    const fromHash = () => {
      const match = /^#stellan-([a-z]+)$/.exec(window.location.hash);
      if (!match) return;
      const index = panels.findIndex(panel => panel.dataset.stellan === match[1]);
      if (index < 0) return;
      select(index);
      spotlight.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* Gameplay feature tabs ------------------------------------------------------------ */
  const features = $('[data-features]');
  if (features) {
    const tabs = $$('[role="tab"]', features);
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    let active = 0;
    let autoplay = !reducedMotion.matches;
    let hovering = false, inView = false;

    const syncPause = () => features.classList.toggle('is-paused', hovering || !inView);
    function restartProgress() {
      features.classList.remove('is-auto');
      if (!autoplay) return;
      void features.offsetWidth;
      features.classList.add('is-auto');
    }
    function show(index, { focus = false, user = false } = {}) {
      if (user) autoplay = false;
      active = index;
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
      if (focus) tabs[index].focus();
      restartProgress();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => show(index, { user: true }));
      tab.addEventListener('keydown', event => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        let next;
        if (event.key in keys) next = (active + keys[event.key] + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        show(next, { focus: true, user: true });
      });
    });
    features.addEventListener('animationend', event => {
      if (event.animationName === 'progress' && autoplay) show((active + 1) % tabs.length);
    });
    // Keyboard users take over from autoplay as soon as they reach the tabs.
    features.addEventListener('focusin', () => {
      if (!autoplay) return;
      autoplay = false;
      restartProgress();
    });
    features.addEventListener('pointerenter', () => { hovering = true; syncPause(); });
    features.addEventListener('pointerleave', () => { hovering = false; syncPause(); });
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) $$('img[loading="lazy"]', features).forEach(img => { img.loading = 'eager'; });
      syncPause();
    }, { threshold: .35 }).observe(features);
    syncPause();
    restartProgress();
  }

  /* Count-up stats --------------------------------------------------------------- */
  const counters = $$('[data-count]');
  const countWatcher = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      countWatcher.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      if (!target || reducedMotion.matches) continue;
      const started = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - started) / 1400);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    }
  }, { threshold: .6 });
  counters.forEach(el => countWatcher.observe(el));

  /* Artwork lightbox ------------------------------------------------------------------ */
  const lightbox = $('[data-lightbox]');
  if (lightbox && typeof lightbox.showModal === 'function') {
    const image = $('[data-lightbox-img]', lightbox);
    const caption = $('[data-lightbox-caption]', lightbox);
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-lightbox-src]');
      if (!trigger || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      const text = trigger.dataset.lightboxCaption || '';
      image.src = trigger.dataset.lightboxSrc;
      image.alt = text;
      caption.textContent = text;
      lightbox.showModal();
    });
    $('[data-lightbox-close]', lightbox).addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', () => { image.removeAttribute('src'); });
  }

  $$('[data-year]').forEach(el => { el.textContent = String(new Date().getFullYear()); });
})();
