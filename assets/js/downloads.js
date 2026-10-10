// Resolve installers and release notes together so they always refer to one release.
// The HTML links remain usable when JavaScript or GitHub's API is unavailable.
(() => {
  const repository = 'Stellar-Refrain/downloads';
  const platforms = {
    mac: { asset: /^Stellar-Refrain_.+_(?:aarch64|arm64)\.dmg$/i, label: 'Download for Mac' },
    windows: { asset: /^Stellar-Refrain_.+_x64-setup\.exe$/i, label: 'Download for Windows' },
  };
  const cards = document.querySelectorAll('[data-platform]');
  if (!cards.length) return;

  function githubURL(value, pathnamePrefix) {
    try {
      const url = new URL(value);
      if (url.origin === 'https://github.com' && !url.username && !url.password && url.pathname.startsWith(pathnamePrefix)) return url.href;
    } catch { /* Keep the release-page fallback for malformed URLs. */ }
    return null;
  }

  async function loadLatestRelease() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
        credentials: 'omit',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Release lookup unavailable');
      const release = await response.json();
      if (!release || release.draft || release.prerelease || typeof release.tag_name !== 'string' || !release.tag_name.trim() || !Array.isArray(release.assets)) throw new Error('Invalid release');
      const tag = encodeURIComponent(release.tag_name);
      const releasePage = githubURL(release.html_url, `/${repository}/releases/tag/`);
      if (!releasePage || new URL(releasePage).pathname !== `/${repository}/releases/tag/${tag}`) throw new Error('Invalid release page');

      for (const card of cards) {
        const platform = platforms[card.dataset.platform];
        if (!platform) continue;
        const asset = release.assets.find(item => item && item.state === 'uploaded' && item.size > 0 && platform.asset.test(item.name) && githubURL(item.browser_download_url, `/${repository}/releases/download/${tag}/`));
        const link = card.querySelector('[data-download-link]');
        link.href = asset ? asset.browser_download_url : releasePage;
        card.querySelector('[data-download-label]').textContent = asset ? platform.label : 'View release';
        card.querySelector('[data-release-state]').textContent = asset ? release.tag_name : 'Not available';
      }
      const notes = document.querySelector('[data-release-notes]');
      notes.href = releasePage;
      notes.querySelector('[data-release-notes-label]').textContent = `Release notes · ${release.tag_name}`;
    } catch {
      // Network failures, rate limits and timeouts leave the latest-release links intact.
    } finally {
      clearTimeout(timeout);
    }
  }

  return loadLatestRelease();
})();
