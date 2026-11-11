// Stellar Refrain — website motion and interaction.
// The page is complete without this file; everything here is an enhancement.
(() => {
  'use strict';

  window.SR_READY = true;
  const root = document.documentElement;
  root.classList.add('js');
  if (location.protocol.startsWith('http')) root.classList.add('is-served');

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const still = () => reducedMotion.matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pad = n => String(n).padStart(2, '0');
  const ease = 'cubic-bezier(.22, 1, .36, 1)';

  /* One animation frame per scroll or resize for every scroll-linked effect. */
  const scrollJobs = new Set();
  let scrollQueued = false;
  function runScrollJobs() {
    scrollQueued = false;
    const y = window.scrollY;
    for (const job of scrollJobs) job(y);
  }
  function queueScrollJobs() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(runScrollJobs);
  }
  window.addEventListener('scroll', queueScrollJobs, { passive: true });
  window.addEventListener('resize', queueScrollJobs);

  /* Horizontal swipes on touch and pen, leaving vertical scrolling alone. */
  function onSwipe(element, callback) {
    let start = null;
    element.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse') return;
      start = { x: event.clientX, y: event.clientY };
    });
    element.addEventListener('pointerup', event => {
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) callback(dx < 0 ? 1 : -1);
    });
    element.addEventListener('pointercancel', () => { start = null; });
  }

  /* Wrap each word of an element's text in a span, keeping nested markup. */
  function splitWords(element, className, onToken) {
    let index = 0;
    const walk = node => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          for (const part of child.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { fragment.append(part); continue; }
            const span = document.createElement('span');
            span.className = className;
            span.textContent = part;
            onToken(span, index++);
            fragment.append(span);
          }
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches('br')) {
          if (child.getAttribute('aria-hidden') === 'true') {
            child.classList.add(className);
            onToken(child, index++);
          } else {
            walk(child);
          }
        }
      }
    };
    walk(element);
    return index;
  }

  function splitChars(element, className) {
    const text = element.textContent;
    element.textContent = '';
    [...text].forEach((character, index) => {
      const span = document.createElement('span');
      span.className = character === ' ' ? 'wm-space' : className;
      span.style.setProperty('--i', index);
      span.textContent = character === ' ' ? ' ' : character;
      element.append(span);
    });
  }

  /* Reveal on scroll -------------------------------------------------------- */
  $$('[data-split]').forEach(element => splitWords(element, 'sw', (span, index) => span.style.setProperty('--wi', index)));
  const revealer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('[data-reveal], [data-split]').forEach(element => revealer.observe(element));

  /* Masthead and menu ------------------------------------------------------- */
  const header = $('[data-header]');
  const menu = $('[data-menu]');
  const menuButton = $('[data-menu-btn]');
  const menuLabel = $('[data-menu-label]');
  const mobileNav = window.matchMedia('(max-width: 1023px)');
  const main = $('#main');
  const footer = $('[data-footer]');
  $$('.nav-list a', menu).forEach((link, index) => link.style.setProperty('--i', index));

  function setMenu(open, restoreFocus = false) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'Close menu' : 'Menu';
    menu.classList.toggle('is-open', open);
    root.style.overflow = open ? 'hidden' : '';
    main.inert = open;
    footer.inert = open;
    header.dataset.hidden = 'false';
    if (open) setTimeout(() => $('a', menu).focus({ preventScroll: true }), 60);
    else if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a') && menu.classList.contains('is-open')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false, true); });
  mobileNav.addEventListener('change', () => { if (menu.classList.contains('is-open')) setMenu(false); });
  // The open menu previews where each link leads.
  $$('[data-preview]', menu).forEach(link => {
    // Resolve against the page: a relative url() in a custom property resolves against the stylesheet instead.
    const preview = `url("${new URL(link.dataset.preview, document.baseURI).href}")`;
    const show = () => { menu.style.setProperty('--menu-preview', preview); menu.dataset.previewing = 'true'; };
    link.addEventListener('pointerenter', show);
    link.addEventListener('focus', show);
    link.addEventListener('pointerleave', () => { menu.dataset.previewing = 'false'; });
  });

  let lastScroll = window.scrollY;
  scrollJobs.add(y => {
    header.dataset.scrolled = String(y > 24);
    const pinned = menu.classList.contains('is-open') || header.contains(document.activeElement);
    if (pinned || y < window.innerHeight * .5) header.dataset.hidden = 'false';
    else if (y > lastScroll + 8) header.dataset.hidden = 'true';
    else if (y < lastScroll - 8) header.dataset.hidden = 'false';
    lastScroll = y;
  });
  header.addEventListener('focusin', () => { header.dataset.hidden = 'false'; });

  /* Current section: navigation, sky colour and the progress rail ---------- */
  const sections = $$('main > section[id]');
  const navLinks = $$('[data-nav]');
  const rail = $('[data-rail]');
  const railItems = $$('[data-rail-for]');
  const railFill = $('[data-rail-fill]');
  const railIds = railItems.map(item => item.dataset.railFor);
  let currentSection = null;
  let announceTimer = 0;
  scrollJobs.add(() => {
    const line = window.innerHeight * .45;
    let active = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= line) active = section;
    const railId = railIds.includes(active.id) ? active.id : 'top';
    const railIndex = railIds.indexOf(railId);

    if (active.id !== currentSection) {
      currentSection = active.id;
      root.dataset.sky = active.dataset.sky || 'night';
      navLinks.forEach(link => link.setAttribute('aria-current', String(link.getAttribute('href') === `#${active.id}`)));
      railItems.forEach((item, index) => {
        item.classList.toggle('is-current', index === railIndex);
        item.classList.toggle('is-past', index < railIndex);
      });
      rail.dataset.announce = 'true';
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => { rail.dataset.announce = 'false'; }, 2400);
    }
    const railSection = document.getElementById(railId);
    const box = railSection.getBoundingClientRect();
    const within = railId === 'top' ? clamp((line - box.top) / (box.height * 2), 0, 1) : clamp((line - box.top) / box.height, 0, 1);
    railFill.style.setProperty('--progress', clamp((railIndex + within) / (railIds.length - 1), 0, 1).toFixed(4));
  });

  // The rail steps aside for the footer.
  new IntersectionObserver(([entry]) => { rail.dataset.away = String(entry.isIntersecting); }).observe(footer);

  /* The night sky -------------------------------------------------------------- */
  function nightSky(canvas) {
    const context = canvas.getContext('2d');
    if (!context) return;
    let width = 0, height = 0, ratio = 1, stars = [], meteor = null, frame = 0, running = false;
    const colours = ['#ffffff', '#ffffff', '#ffffff', '#f3dfb4', '#cdeeff'];

    function build() {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      const newWidth = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(newWidth * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (newWidth !== width || !stars.length) {
        width = newWidth;
        const count = Math.min(360, Math.round(width * height / 5000));
        stars = Array.from({ length: count }, () => {
          const depth = Math.random() ** 1.6;
          return { x: Math.random() * width, y: Math.random() * 2000, r: .3 + depth * 1.25, a: .22 + Math.random() * .6, depth, speed: .4 + Math.random() * 1.8, phase: Math.random() * Math.PI * 2, colour: colours[Math.floor(Math.random() * colours.length)] };
        });
      }
      draw(performance.now());
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);
      const scroll = still() ? 0 : window.scrollY;
      for (const star of stars) {
        const y = ((star.y - scroll * (.03 + star.depth * .16)) % height + height) % height;
        const twinkle = still() ? .8 : .55 + .45 * Math.sin(time * .001 * star.speed + star.phase);
        context.globalAlpha = star.a * twinkle;
        context.fillStyle = star.colour;
        context.beginPath();
        context.arc(star.x, y, star.r, 0, Math.PI * 2);
        context.fill();
        if (star.r > 1.25 && twinkle > .8) {
          const glint = star.r * 4.5 * twinkle;
          context.globalAlpha = star.a * (twinkle - .8) * 2.4;
          context.fillRect(star.x - glint, y - .35, glint * 2, .7);
          context.fillRect(star.x - .35, y - glint, .7, glint * 2);
        }
      }
      if (still()) return;
      if (!meteor && Math.random() < .0028) {
        meteor = { x: width * (.3 + Math.random() * .7), y: height * Math.random() * .35, vx: -(6 + Math.random() * 4), vy: 2.2 + Math.random() * 1.6, life: 0 };
      }
      if (meteor) {
        meteor.life += 1;
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        const fade = Math.sin(Math.min(1, meteor.life / 55) * Math.PI);
        const tailX = meteor.x - meteor.vx * 14, tailY = meteor.y - meteor.vy * 14;
        const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 246, 226, ${fade})`);
        gradient.addColorStop(1, 'rgba(255, 246, 226, 0)');
        context.globalAlpha = 1;
        context.strokeStyle = gradient;
        context.lineWidth = 1.2;
        context.beginPath();
        context.moveTo(meteor.x, meteor.y);
        context.lineTo(tailX, tailY);
        context.stroke();
        if (meteor.life > 55) meteor = null;
      }
    }
    function loop(time) {
      draw(time);
      frame = requestAnimationFrame(loop);
    }
    function start() {
      if (running || still() || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(frame); }

    window.addEventListener('resize', build);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reducedMotion.addEventListener('change', () => { stop(); build(); start(); });
    build();
    start();
  }
  const skyCanvas = $('[data-sky]');
  if (skyCanvas) nightSky(skyCanvas);

  /* Hero: wordmark, parallax, petals and a trail of starlight ----------------- */
  const hero = $('[data-hero]');
  const wordmark = $('[data-wordmark]');
  if (wordmark) {
    let offset = 0;
    $$('.wm-line', wordmark).forEach(line => {
      splitChars(line, 'wm-char');
      $$('span', line).forEach(span => span.style.setProperty('--i', offset + Number(span.style.getPropertyValue('--i'))));
      offset += line.textContent.length;
    });
  }

  if (hero) {
    const art = $('[data-hero-art]', hero);
    const content = $('[data-hero-content]', hero);
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let parallaxFrame = 0;
    function parallaxStep() {
      current.x += (target.x - current.x) * .06;
      current.y += (target.y - current.y) * .06;
      art.style.setProperty('--px', `${(current.x * -14).toFixed(2)}px`);
      art.style.setProperty('--py', `${(current.y * -10).toFixed(2)}px`);
      if (Math.abs(target.x - current.x) > .001 || Math.abs(target.y - current.y) > .001) parallaxFrame = requestAnimationFrame(parallaxStep);
      else parallaxFrame = 0;
    }
    hero.addEventListener('pointermove', event => {
      if (!finePointer.matches || still()) return;
      target.x = event.clientX / window.innerWidth - .5;
      target.y = event.clientY / window.innerHeight - .5;
      if (!parallaxFrame) parallaxFrame = requestAnimationFrame(parallaxStep);
    });
    scrollJobs.add(y => {
      if (still()) return;
      const height = hero.offsetHeight;
      if (y > height) return;
      const progress = clamp(y / height, 0, 1);
      art.style.setProperty('--hs', (1 + progress * .1).toFixed(4));
      content.style.setProperty('--hero-shift', `${(y * .28).toFixed(1)}px`);
      content.style.setProperty('--hero-fade', clamp(1 - progress * 1.4, 0, 1).toFixed(3));
    });

    const fxCanvas = $('[data-hero-fx]', hero);
    const context = fxCanvas && fxCanvas.getContext('2d');
    if (context) {
      let width = 0, height = 0, ratio = 1, petals = [], sparks = [], frame = 0, running = false, inView = true, lastSpark = 0;
      const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, last: null };
      const petalColours = ['#fbd3e0', '#f6b6d2', '#fde6ee', '#f2a7c3', '#f9c4d8'];
      const sparkColours = ['#ffffff', '#fff1cf', '#ffe2a6', '#dccfff', '#c4ecff'];
      const rand = (min, max) => min + Math.random() * (max - min);

      function newPetal(initial) {
        return {
          x: rand(-.1, 1.05) * width, y: initial ? rand(0, height) : rand(-60, -10),
          size: rand(4.5, 10), vx: rand(.25, .8), vy: rand(.45, 1.05), drift: 0,
          rotation: rand(0, Math.PI * 2), spin: rand(-.03, .03), flip: rand(0, Math.PI * 2), flipSpeed: rand(.018, .045),
          sway: rand(0, Math.PI * 2), alpha: rand(.55, .95), colour: petalColours[Math.floor(Math.random() * petalColours.length)],
        };
      }
      function resize() {
        const box = fxCanvas.getBoundingClientRect();
        ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = box.width; height = box.height;
        fxCanvas.width = Math.round(width * ratio);
        fxCanvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        const count = Math.round(clamp(width / 64, 10, 28));
        petals = Array.from({ length: count }, () => newPetal(true));
      }
      function spark(x, y, power = 1, ambient = false) {
        sparks.push({
          x, y, vx: ambient ? 0 : rand(-.5, .5) + pointer.vx * .04, vy: ambient ? rand(-.08, .02) : rand(-.6, .3) + pointer.vy * .04,
          size: ambient ? rand(1.5, 3.4) : rand(2, 5.5) * power, life: 0, max: ambient ? rand(70, 140) : rand(40, 80),
          colour: sparkColours[Math.floor(Math.random() * sparkColours.length)], spin: rand(-.04, .04), angle: rand(0, .8),
        });
      }
      function drawStar(size) {
        const inner = size * .16;
        context.beginPath();
        context.moveTo(0, -size);
        context.quadraticCurveTo(inner, -inner, size, 0);
        context.quadraticCurveTo(inner, inner, 0, size);
        context.quadraticCurveTo(-inner, inner, -size, 0);
        context.quadraticCurveTo(-inner, -inner, 0, -size);
        context.fill();
      }
      function step(time) {
        context.clearRect(0, 0, width, height);
        // Petals ride the breeze and scatter from the pointer.
        for (const petal of petals) {
          petal.sway += .012;
          const dx = petal.x - pointer.x, dy = petal.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 140) {
            const push = (1 - distance / 140);
            petal.drift += (pointer.vx * .05 + dx / (distance || 1) * 1.6) * push;
            petal.vy += (pointer.vy * .02) * push;
          }
          petal.drift *= .95;
          petal.vy += (clamp(petal.vy, .45, 1.05) - petal.vy) * .04;
          petal.x += petal.vx + petal.drift + Math.sin(petal.sway) * .45;
          petal.y += petal.vy;
          petal.rotation += petal.spin;
          petal.flip += petal.flipSpeed;
          if (petal.y > height + 30 || petal.x > width + 40 || petal.x < -80) Object.assign(petal, newPetal(false));
          context.save();
          context.translate(petal.x, petal.y);
          context.rotate(petal.rotation);
          context.scale(1, .25 + Math.abs(Math.cos(petal.flip)) * .75);
          context.globalAlpha = petal.alpha;
          context.fillStyle = petal.colour;
          const s = petal.size;
          context.beginPath();
          context.moveTo(0, -s);
          context.bezierCurveTo(s * .95, -s * .55, s * .7, s * .75, 0, s);
          context.bezierCurveTo(-s * .7, s * .75, -s * .95, -s * .55, 0, -s);
          context.fill();
          context.restore();
        }
        // Starlight lingers in the painted ribbon even when nobody is moving.
        if (time - lastSpark > 140) {
          lastSpark = time;
          spark(rand(.22, .8) * width, rand(.08, .5) * height, 1, true);
        }
        pointer.vx *= .9; pointer.vy *= .9;
        context.globalCompositeOperation = 'lighter';
        for (let i = sparks.length - 1; i >= 0; i -= 1) {
          const s = sparks[i];
          s.life += 1;
          s.x += s.vx; s.y += s.vy; s.vx *= .97; s.vy = s.vy * .97 + .01;
          s.angle += s.spin;
          const t = s.life / s.max;
          if (t >= 1) { sparks.splice(i, 1); continue; }
          const alpha = Math.sin(t * Math.PI);
          context.save();
          context.translate(s.x, s.y);
          context.rotate(s.angle);
          context.globalAlpha = alpha * .3;
          context.fillStyle = s.colour;
          context.beginPath();
          context.arc(0, 0, s.size * 1.6, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = alpha;
          drawStar(s.size * (.6 + alpha * .6));
          context.restore();
        }
        context.globalCompositeOperation = 'source-over';
      }
      function loop(time) {
        step(time);
        frame = requestAnimationFrame(loop);
      }
      function start() {
        if (running || still() || !inView || document.hidden) return;
        running = true;
        frame = requestAnimationFrame(loop);
      }
      function stop() {
        running = false;
        cancelAnimationFrame(frame);
      }
      hero.addEventListener('pointermove', event => {
        const box = fxCanvas.getBoundingClientRect();
        const x = event.clientX - box.left, y = event.clientY - box.top;
        if (pointer.last) { pointer.vx = x - pointer.last.x; pointer.vy = y - pointer.last.y; }
        pointer.x = x; pointer.y = y;
        pointer.last = { x, y };
        if (event.pointerType !== 'mouse' || still()) return;
        const speed = Math.hypot(pointer.vx, pointer.vy);
        const count = clamp(Math.round(speed / 9), 0, 4);
        for (let i = 0; i < count; i += 1) spark(x - pointer.vx * (i / count), y - pointer.vy * (i / count), clamp(speed / 30, .6, 1.3));
      });
      hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; pointer.last = null; });
      new ResizeObserver(resize).observe(fxCanvas);
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; inView ? start() : stop(); }).observe(hero);
      document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
      reducedMotion.addEventListener('change', () => { if (still()) { stop(); context.clearRect(0, 0, width, height); } else start(); });
      start();
    }
  }

  /* Overture: the sentence lights up as it is read --------------------------- */
  const overture = $('[data-words]');
  if (overture) {
    const total = splitWords(overture, 'ow', (span, index) => span.style.setProperty('--i', index));
    overture.style.setProperty('--n', total);
    overture.setAttribute('data-words-ready', '');
    scrollJobs.add(() => {
      const box = overture.getBoundingClientRect();
      const start = window.innerHeight * .88, end = window.innerHeight * .42;
      overture.style.setProperty('--p', clamp((start - box.top) / (start - end + box.height), 0, 1).toFixed(4));
    });
  }

  /* Prologue reader ------------------------------------------------------------ */
  const story = $('[data-story]');
  if (story) {
    const scenes = $$('.scene', story);
    const tabList = $('.story-tabs', story);
    const tabs = $$('.story-tab', story);
    const nav = $('.story-nav', story);
    const timeline = $('.story-timeline', story);
    const fill = $('[data-timeline-fill]', story);
    const previous = $('[data-story-prev]', story);
    const next = $('[data-story-next]', story);
    const count = $('[data-story-count]', story);
    const label = $('[data-story-label]', story);
    let current = -1;
    let settleTimer = 0;

    nav.hidden = false;
    tabList.setAttribute('role', 'tablist');
    tabs.forEach(tab => { tab.setAttribute('role', 'tab'); tab.tabIndex = -1; });
    scenes.forEach(scene => { scene.setAttribute('role', 'tabpanel'); scene.tabIndex = 0; });

    function select(index, { focus = false, animate = true } = {}) {
      index = clamp(index, 0, scenes.length - 1);
      if (index === current) { if (focus) tabs[index].focus(); return; }
      const leaving = scenes[current];
      const scene = scenes[index];
      const motion = animate && current !== -1 && !still();
      scenes.forEach(item => item.classList.remove('is-leaving', 'is-entering'));
      if (leaving) {
        leaving.classList.remove('is-active');
        if (motion) leaving.classList.add('is-leaving');
      }
      scene.dataset.dir = index > current ? 'forward' : 'back';
      scene.classList.add('is-active');
      if (motion) { void scene.offsetWidth; scene.classList.add('is-entering'); }
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => scenes.forEach(item => item.classList.remove('is-leaving', 'is-entering')), 1400);

      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        tab.classList.toggle('is-past', i < index);
      });
      current = index;
      count.textContent = pad(index + 1);
      label.textContent = ` · ${$('.tab-name', tabs[index]).textContent}`;
      previous.disabled = index === 0;
      next.disabled = index === scenes.length - 1;
      fill.style.setProperty('--tp', (index / (scenes.length - 1)).toFixed(4));
      if (timeline.scrollWidth > timeline.clientWidth) {
        const tab = tabs[index];
        timeline.scrollTo({ left: tab.offsetLeft - timeline.clientWidth / 2 + tab.offsetWidth / 2, behavior: still() ? 'auto' : 'smooth' });
      }
      if (focus) tabs[index].focus();
    }

    tabs.forEach((tab, index) => tab.addEventListener('click', () => select(index)));
    previous.addEventListener('click', () => select(current - 1));
    next.addEventListener('click', () => select(current + 1));
    tabList.addEventListener('keydown', event => {
      const moves = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: scenes.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      select(moves[event.key], { focus: true });
    });
    onSwipe($('[data-story-scenes]', story), direction => select(current + direction));
    select(0, { animate: false });
  }

  /* Stellan spotlight ------------------------------------------------------------- */
  const spotlight = $('[data-spotlight]');
  if (spotlight) {
    const panels = $$('.stellan', spotlight);
    const tabs = $$('.roster-tab', spotlight);
    const backdropFrame = $('.stage-backdrop', spotlight);
    let backdrop = $('[data-backdrop]', spotlight);
    let current = 0;
    let leaveTimer = 0;
    let typing = 0;
    let seen = false;

    panels.forEach(panel => {
      const giant = $('.stellan-giant', panel);
      splitChars(giant, 'gc');
      const line = $('[data-typed] p', panel);
      const text = line.textContent;
      line.textContent = '';
      const spoken = document.createElement('span');
      spoken.className = 'visually-hidden';
      spoken.textContent = text;
      const shown = document.createElement('span');
      shown.setAttribute('aria-hidden', 'true');
      for (const character of text) {
        const span = document.createElement('span');
        span.className = 'typed-char';
        span.textContent = character;
        shown.append(span);
      }
      line.append(spoken, shown);
    });

    function type(panel) {
      cancelAnimationFrame(typing);
      const characters = $$('.typed-char', panel);
      if (still()) { characters.forEach(character => character.classList.add('is-on')); return; }
      characters.forEach(character => character.classList.remove('is-on'));
      let index = 0, wait = 0, last = performance.now() + 380;
      const tick = now => {
        if (now >= last + wait) {
          const character = characters[index];
          if (!character) return;
          character.classList.add('is-on');
          index += 1;
          last = now;
          wait = /[.,!?—]/.test(character.textContent) ? 180 : 24;
        }
        typing = requestAnimationFrame(tick);
      };
      typing = requestAnimationFrame(tick);
    }

    function swapBackdrop(id) {
      const source = `./assets/img/stellans/${id}/backdrop.webp`;
      if (backdrop.getAttribute('src') === source) return;
      const image = new Image(480, 270);
      image.alt = '';
      image.className = 'is-fading';
      image.src = source;
      backdropFrame.append(image);
      backdrop = image;
      const reveal = () => requestAnimationFrame(() => {
        image.classList.remove('is-fading');
        setTimeout(() => $$('img', backdropFrame).forEach(other => { if (other !== backdrop) other.remove(); }), 950);
      });
      image.decode().then(reveal, reveal);
    }

    function activate(index, { focus = false, direction } = {}) {
      index = (index + panels.length) % panels.length;
      if (index === current) { if (focus) tabs[index].focus(); return; }
      const leaving = panels[current];
      const panel = panels[index];
      spotlight.style.setProperty('--dir', String(direction ?? (index > current ? 1 : -1)));
      leaving.classList.remove('is-active');
      if (!still()) leaving.classList.add('is-leaving');
      panel.classList.add('is-active');
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => panels.forEach(item => item.classList.remove('is-leaving')), 520);
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      const colour = panel.style.getPropertyValue('--c').trim();
      spotlight.style.setProperty('--c', colour);
      root.style.setProperty('--sky-tint', `color-mix(in oklab, ${colour} 16%, #070b1e)`);
      swapBackdrop(panel.dataset.stellan);
      current = index;
      if (seen) type(panel);
      if (focus) tabs[index].focus();
    }

    tabs.forEach((tab, index) => tab.addEventListener('click', () => activate(index)));
    $('.roster-list', spotlight).addEventListener('keydown', event => {
      const moves = { ArrowRight: current + 1, ArrowLeft: current - 1, ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: panels.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      activate(moves[event.key], { focus: true, direction: moves[event.key] > current ? 1 : -1 });
    });
    $$('[data-step]', spotlight).forEach(button => button.addEventListener('click', () => {
      const step = Number(button.dataset.step);
      activate(current + step, { direction: step });
    }));
    panels.forEach(panel => onSwipe($('.stellan-poses', panel), direction => activate(current + direction, { direction })));

    // Expressions: preload on approach, then cross into each pose.
    panels.forEach(panel => {
      const id = panel.dataset.stellan;
      const name = $('.stellan-name', panel).textContent;
      const image = $('[data-pose-img]', panel);
      const buttons = $$('[data-pose]', panel);
      const preload = () => buttons.forEach(button => { new Image().src = `./assets/img/stellans/${id}/${button.dataset.pose}.webp`; });
      $('.pose-switch', panel).addEventListener('pointerenter', preload, { once: true });
      $('.pose-switch', panel).addEventListener('focusin', preload, { once: true });
      buttons.forEach(button => button.addEventListener('click', () => {
        if (button.getAttribute('aria-pressed') === 'true') return;
        buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        const source = `./assets/img/stellans/${id}/${button.dataset.pose}.webp`;
        const next = new Image();
        next.src = source;
        const swap = () => {
          image.src = source;
          image.alt = button.dataset.pose === 'neutral' ? `${name}, full-length portrait` : `${name}, full-length portrait, ${button.textContent.toLowerCase()}`;
          if (!still()) image.animate([{ opacity: .35, transform: 'translateY(8px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 460, easing: ease });
        };
        next.decode().then(swap, swap);
      }));
    });

    new IntersectionObserver((entries, observer) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      spotlight.classList.add('is-in');
      seen = true;
      type(panels[current]);
      observer.disconnect();
    }, { threshold: .25 }).observe(spotlight);

    function fromHash() {
      const match = /^#stellan-([a-z]+)$/.exec(window.location.hash);
      if (!match) return;
      const index = panels.findIndex(panel => panel.dataset.stellan === match[1]);
      if (index >= 0) activate(index);
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
    root.style.setProperty('--sky-tint', `color-mix(in oklab, ${panels[current].style.getPropertyValue('--c').trim()} 16%, #070b1e)`);
  }

  // Silhouettes glow where the pointer looks.
  $$('[data-silhouettes]').forEach(element => {
    element.addEventListener('pointermove', event => {
      const box = element.getBoundingClientRect();
      element.style.setProperty('--mx', `${((event.clientX - box.left) / box.width * 100).toFixed(1)}%`);
      element.style.setProperty('--my', `${((event.clientY - box.top) / box.height * 100).toFixed(1)}%`);
    });
  });

  /* Worlds: drag across the horizon between Lyth and Khalion ------------------- */
  const horizon = $('[data-horizon]');
  if (horizon) {
    const range = $('[data-horizon-range]', horizon);
    range.hidden = false;
    let value = 50, target = 50, frame = 0, dragging = null, touched = false;
    function render(next) {
      value = clamp(next, 0, 100);
      horizon.style.setProperty('--split', `${value.toFixed(2)}%`);
      horizon.style.setProperty('--sv', value.toFixed(2));
      range.value = String(Math.round(value));
      range.setAttribute('aria-valuetext', `${Math.round(value)}% Lyth, ${100 - Math.round(value)}% Khalion`);
    }
    function animate() {
      const next = value + (target - value) * (dragging ? .32 : .09);
      render(Math.abs(target - next) < .05 ? target : next);
      frame = value === target ? 0 : requestAnimationFrame(animate);
    }
    function moveTo(next, immediate = false) {
      target = clamp(next, 0, 100);
      if (immediate || still()) { cancelAnimationFrame(frame); frame = 0; render(target); return; }
      if (!frame) frame = requestAnimationFrame(animate);
    }
    function touch() {
      if (touched) return;
      touched = true;
      horizon.classList.add('is-touched');
    }
    const percentAt = clientX => {
      const box = horizon.getBoundingClientRect();
      return (clientX - box.left) / box.width * 100;
    };
    horizon.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, active: event.pointerType === 'mouse' };
      if (dragging.active) {
        touch();
        horizon.classList.add('is-dragging');
        horizon.setPointerCapture(event.pointerId);
        moveTo(percentAt(event.clientX));
        event.preventDefault();
      }
    });
    horizon.addEventListener('pointermove', event => {
      if (!dragging || dragging.id !== event.pointerId) return;
      if (!dragging.active) {
        const dx = Math.abs(event.clientX - dragging.x), dy = Math.abs(event.clientY - dragging.y);
        if (dx < 8 || dx < dy) return;
        dragging.active = true;
        touch();
        horizon.classList.add('is-dragging');
        horizon.setPointerCapture(event.pointerId);
      }
      moveTo(percentAt(event.clientX));
    });
    const release = () => { dragging = null; horizon.classList.remove('is-dragging'); };
    horizon.addEventListener('pointerup', release);
    horizon.addEventListener('pointercancel', release);
    range.addEventListener('input', () => { touch(); moveTo(Number(range.value), true); });
    render(50);

    // A first glance across the horizon, so the seam reads as something to move.
    new IntersectionObserver((entries, observer) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (still()) return;
      [[250, 34], [1050, 66], [1900, 50]].forEach(([delay, position]) => setTimeout(() => { if (!touched) moveTo(position); }, delay));
    }, { threshold: .55 }).observe(horizon);
  }

  // Postcards can be dragged sideways with a mouse, with a little momentum.
  $$('[data-drag-scroll]').forEach(scroller => {
    let down = null, moved = false, velocity = 0, glide = 0;
    scroller.addEventListener('dragstart', event => event.preventDefault());
    scroller.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      cancelAnimationFrame(glide);
      down = { x: event.clientX, scroll: scroller.scrollLeft, last: event.clientX };
      moved = false;
      velocity = 0;
    });
    window.addEventListener('pointermove', event => {
      if (!down) return;
      const dx = event.clientX - down.x;
      if (!moved && Math.abs(dx) > 6) { moved = true; scroller.classList.add('is-dragging'); }
      if (!moved) return;
      scroller.scrollLeft = down.scroll - dx;
      velocity = event.clientX - down.last;
      down.last = event.clientX;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = null;
      scroller.classList.remove('is-dragging');
      if (!moved || still()) return;
      const coast = () => {
        velocity *= .94;
        scroller.scrollLeft -= velocity;
        if (Math.abs(velocity) > .4) glide = requestAnimationFrame(coast);
      };
      glide = requestAnimationFrame(coast);
    });
    scroller.addEventListener('click', event => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    }, true);
  });

  /* Gameplay: feature list and a deck of screens ---------------------------------- */
  const features = $('[data-features]');
  if (features) {
    const list = $('.feature-list', features);
    const tabs = $$('.feature-tab', features);
    const shots = $$('.shot', features);
    const deck = $('[data-deck]', features);
    let current = -1;
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-orientation', 'vertical');
    tabs.forEach(tab => tab.setAttribute('role', 'tab'));
    shots.forEach(shot => shot.setAttribute('role', 'tabpanel'));

    function show(index, { user = false, focus = false } = {}) {
      index = (index + shots.length) % shots.length;
      if (index === current) { if (focus) tabs[index].focus(); return; }
      const outgoing = shots[current];
      const forward = current !== -1 && index === (current + 1) % shots.length;
      shots.forEach((shot, i) => {
        const position = (i - index + shots.length) % shots.length;
        shot.dataset.pos = String(position);
        shot.setAttribute('aria-hidden', String(position !== 0));
        shot.inert = position !== 0;
      });
      if (outgoing && forward && !still()) {
        outgoing.animate([
          { transform: 'none', opacity: 1, filter: 'none' },
          { transform: 'translate(-30%, 10%) rotate(-10deg) scale(.95)', opacity: 0, offset: .5 },
          { transform: 'translate(16%, -18%) scale(.84) rotate(6.4deg)', opacity: 0 },
        ], { duration: 900, easing: ease });
      }
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
      });
      current = index;
      if (user) features.classList.remove('is-auto');
      if (focus) tabs[index].focus();
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => show(index, { user: true }));
      $('.feature-progress i', tab).addEventListener('animationend', event => {
        if (event.animationName === 'progress' && features.classList.contains('is-auto')) show(current + 1);
      });
    });
    list.addEventListener('keydown', event => {
      const moves = { ArrowDown: current + 1, ArrowRight: current + 1, ArrowUp: current - 1, ArrowLeft: current - 1, Home: 0, End: shots.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault();
      show(moves[event.key], { user: true, focus: true });
    });
    deck.addEventListener('click', () => show(current + 1, { user: true }));
    onSwipe(deck, direction => show(current + direction, { user: true }));

    // The tour plays itself while it is on screen and nobody is reading closely.
    let visible = false, holding = false;
    const syncPause = () => features.classList.toggle('is-paused', !visible || holding || document.hidden);
    features.addEventListener('pointerenter', () => { holding = true; syncPause(); });
    features.addEventListener('pointerleave', () => { holding = false; syncPause(); });
    features.addEventListener('focusin', () => { holding = true; syncPause(); });
    features.addEventListener('focusout', event => { if (!features.contains(event.relatedTarget)) { holding = false; syncPause(); } });
    document.addEventListener('visibilitychange', syncPause);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncPause(); }, { threshold: .35 }).observe(features);
    syncPause();
    if (!still()) features.classList.add('is-auto');
    show(0);
  }

  // The tally rolls past, quickening as the page moves.
  const tally = $('[data-tally]');
  if (tally && !still()) {
    const track = $('[data-tally-track]', tally);
    const set = $('.tally-set', track);
    const copies = Math.max(1, Math.ceil(Math.max(window.innerWidth, 1600) / Math.max(set.offsetWidth, 1)));
    const half = [set];
    for (let i = 1; i < copies; i += 1) half.push(set.cloneNode(true));
    const all = [...half, ...half.map(item => item.cloneNode(true))];
    all.forEach((item, index) => {
      if (index === 0) return;
      item.setAttribute('aria-hidden', 'true');
      item.removeAttribute('aria-describedby');
      track.append(item);
    });
    tally.classList.add('is-looping');
    let boost = 0, lastY = window.scrollY, frame = 0, visible = false;
    const animation = () => track.getAnimations()[0];
    const settle = () => {
      boost *= .93;
      const running = animation();
      if (running) running.playbackRate = 1 + boost;
      frame = boost > .02 && visible ? requestAnimationFrame(settle) : 0;
    };
    scrollJobs.add(y => {
      boost = clamp(boost + Math.abs(y - lastY) * .015, 0, 5);
      lastY = y;
      if (!frame && visible) frame = requestAnimationFrame(settle);
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      const running = animation();
      if (running) visible ? running.play() : running.pause();
    }).observe(tally);
  }

  /* Promise: a constellation drawn through the three vows -------------------- */
  const vows = $('[data-vows]');
  if (vows) {
    const svg = $('.vows-line', vows);
    const path = $('[data-vows-path]', vows);
    const orbs = $$('.vow-orb', vows);
    function layout() {
      const points = orbs.map(orb => [orb.offsetLeft + orb.offsetWidth / 2, orb.offsetTop + orb.offsetHeight / 2]);
      let d = `M${points[0][0]} ${points[0][1]}`;
      for (let i = 1; i < points.length; i += 1) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        d += ` Q${(x0 + x1) / 2} ${Math.min(y0, y1) - 70} ${x1} ${y1}`;
      }
      svg.setAttribute('viewBox', `0 0 ${vows.offsetWidth} ${vows.offsetHeight}`);
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
    }
    new ResizeObserver(layout).observe(vows);
    scrollJobs.add(() => {
      if (still()) { path.style.setProperty('--draw', '0'); return; }
      const box = vows.getBoundingClientRect();
      const progress = clamp((window.innerHeight * .85 - box.top) / (box.height * .8), 0, 1);
      path.style.setProperty('--draw', (1 - progress).toFixed(4));
    });
  }

  /* Download: the far horizon drifts behind the passes ------------------------ */
  $$('[data-parallax]').forEach(layer => {
    const section = layer.parentElement;
    scrollJobs.add(() => {
      if (still()) return;
      const box = section.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      const offset = (box.top + box.height / 2 - window.innerHeight / 2) * -.12;
      layer.style.setProperty('--parallax', `${offset.toFixed(1)}px`);
    });
  });

  /* Small pleasures: tilt, sheen, magnetic buttons ---------------------------- */
  if (finePointer.matches) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        if (still()) return;
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', `${((x - .5) * 9).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${((.5 - y) * 7).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }
  $$('.btn-gold').forEach(button => {
    button.addEventListener('pointermove', event => {
      const box = button.getBoundingClientRect();
      button.style.setProperty('--mx', `${(event.clientX - box.left).toFixed(0)}px`);
      button.style.setProperty('--my', `${(event.clientY - box.top).toFixed(0)}px`);
      if (!button.hasAttribute('data-magnetic') || !finePointer.matches || still()) return;
      button.style.setProperty('--tx', `${((event.clientX - box.left - box.width / 2) * .16).toFixed(1)}px`);
      button.style.setProperty('--ty', `${((event.clientY - box.top - box.height / 2) * .26).toFixed(1)}px`);
    });
    button.addEventListener('pointerleave', () => {
      ['--mx', '--my', '--tx', '--ty'].forEach(name => button.style.removeProperty(name));
    });
  });

  /* FAQ: answers unfold instead of snapping open ------------------------------- */
  $$('.faq details').forEach(details => {
    const summary = $('summary', details);
    const answer = $('.faq-answer', details);
    let animation = null;
    summary.addEventListener('click', event => {
      if (still()) return;
      event.preventDefault();
      if (animation) animation.cancel();
      if (!details.open) {
        details.open = true;
        const height = answer.scrollHeight;
        animation = answer.animate([{ height: '0px', opacity: 0 }, { height: `${height}px`, opacity: 1 }], { duration: 560, easing: ease });
      } else {
        details.classList.add('is-closing');
        const height = answer.scrollHeight;
        animation = answer.animate([{ height: `${height}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 400, easing: 'cubic-bezier(.4, 0, .2, 1)' });
        animation.onfinish = () => { details.open = false; details.classList.remove('is-closing'); };
      }
      animation.oncancel = () => details.classList.remove('is-closing');
    });
  });

  /* Footer: the wordmark catches the light ------------------------------------- */
  const footerMark = $('[data-footer-mark]');
  if (footerMark && footer) {
    footer.addEventListener('pointermove', event => {
      const box = footerMark.getBoundingClientRect();
      footerMark.style.setProperty('--mx', `${((event.clientX - box.left) / box.width * 100).toFixed(1)}%`);
      footerMark.style.setProperty('--my', `${((event.clientY - box.top) / box.height * 100).toFixed(1)}%`);
    });
  }
  $$('[data-year]').forEach(element => { element.textContent = String(new Date().getFullYear()); });

  /* Artwork lightbox ------------------------------------------------------------ */
  const lightbox = $('[data-lightbox]');
  if (lightbox && typeof lightbox.showModal === 'function') {
    const image = $('[data-lightbox-img]', lightbox);
    const caption = $('[data-lightbox-caption]', lightbox);
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-lightbox-src]');
      if (!trigger || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      const text = trigger.dataset.lightboxCaption || '';
      image.src = trigger.dataset.lightboxSrc;
      image.alt = text;
      caption.textContent = text;
      lightbox.showModal();
    });
    $('[data-lightbox-close]', lightbox).addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', () => image.removeAttribute('src'));
  }

  runScrollJobs();
})();
