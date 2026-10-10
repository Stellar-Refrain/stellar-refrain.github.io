(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const mobileLayout = window.matchMedia('(max-width: 760px)');
  menuToggle.hidden = false;
  document.documentElement.classList.add('js');

  function closeMenu(restoreFocus = false) {
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (restoreFocus) menuToggle.focus();
  }

  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav-wrap')) closeMenu();
  });
  mobileLayout.addEventListener('change', () => closeMenu());

  const tablist = document.querySelector('.companion-tabs');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  tablist.hidden = false;
  tabs.forEach(tab => {
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
  });

  function selectCompanion(tab, moveFocus = false) {
    tabs.forEach(candidate => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      document.getElementById(candidate.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCompanion(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        selectCompanion(tabs[target], true);
      }
    });
  });

  for (const card of document.querySelectorAll('[data-platform]')) {
    const release = window.STELLAR_DOWNLOADS?.[card.dataset.platform];
    if (!release?.url?.trim()) continue;
    let url;
    try { url = new URL(release.url, document.baseURI); } catch { continue; }
    if (!['https:', 'http:'].includes(url.protocol)) continue;
    const link = card.querySelector('.download-link');
    link.href = url.href;
    if (release.label) link.firstChild.textContent = `${release.label} `;
    link.hidden = false;
    card.querySelector('.download-placeholder').hidden = true;
    card.querySelector('.release-state').textContent = release.version || 'Available now';
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
