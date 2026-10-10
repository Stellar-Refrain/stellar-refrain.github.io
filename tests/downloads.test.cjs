const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const script = readFileSync(join(__dirname, '../assets/js/downloads.js'), 'utf8');
const html = readFileSync(join(__dirname, '../index.html'), 'utf8');
const repository = 'https://github.com/Stellar-Refrain/downloads';
const latest = `${repository}/releases/latest`;

function release(tag = 'v0.3.0') {
  const version = tag.slice(1);
  const asset = name => ({ name, size: 1024, state: 'uploaded', browser_download_url: `${repository}/releases/download/${tag}/${name}` });
  return {
    tag_name: tag, html_url: `${repository}/releases/tag/${tag}`, draft: false, prerelease: false,
    assets: [
      asset(`Stellar-Refrain_${version}_x64.dmg`),
      asset(`Stellar-Refrain_${version}_aarch64.dmg.sig`),
      asset(`Stellar-Refrain_${version}_arm64-setup.exe`),
      asset(`Stellar-Refrain_${version}_aarch64.dmg`),
      asset(`Stellar-Refrain_${version}_x64-setup.exe`),
    ],
  };
}

// A small DOM adapter records the actual user-facing links, labels and badges.
// Initial values come from the shipped HTML so fallback coverage includes markup.
function page() {
  const cards = ['mac', 'windows'].map(platform => {
    const markup = html.match(new RegExp(`<article[^>]+data-platform="${platform}"[\\s\\S]*?</article>`))[0];
    const elements = {
      '[data-download-link]': { href: markup.match(/href="([^"]+)" data-download-link/)[1] },
      '[data-download-label]': { textContent: markup.match(/data-download-label>([^<]+)/)[1] },
      '[data-release-state]': { textContent: markup.match(/data-release-state>([^<]+)/)[1] },
    };
    return { dataset: { platform }, querySelector: selector => elements[selector], elements };
  });
  const notesMarkup = html.match(/<a[^>]+data-release-notes>[\s\S]*?<\/a>/)[0];
  const notesLabel = { textContent: notesMarkup.match(/data-release-notes-label>([^<]+)/)[1] };
  const notes = { href: notesMarkup.match(/href="([^"]+)"/)[1], querySelector: () => notesLabel };
  return { cards, notes, notesLabel, document: { querySelectorAll: () => cards, querySelector: () => notes } };
}

async function render(fetchResponse, { timeout = false } = {}) {
  const result = page();
  await vm.runInNewContext(script, {
    document: result.document, URL, AbortController,
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.github.com/repos/Stellar-Refrain/downloads/releases/latest');
      assert.equal(options.credentials, 'omit');
      if (timeout) return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Aborted'))));
      return fetchResponse();
    },
    setTimeout: (callback, ms) => {
      assert.equal(ms, 8000);
      return setTimeout(callback, timeout ? 0 : ms);
    },
    clearTimeout,
  });
  return result;
}

function assertFallback(result) {
  assert.equal(result.cards[0].elements['[data-download-link]'].href, latest);
  assert.equal(result.cards[1].elements['[data-download-link]'].href, latest);
  assert.equal(result.cards[0].elements['[data-download-label]'].textContent, 'View Mac downloads');
  assert.equal(result.cards[1].elements['[data-download-label]'].textContent, 'View Windows downloads');
  assert.equal(result.notes.href, latest);
  assert.equal(result.notesLabel.textContent, 'Release notes on GitHub');
}

for (const tag of ['v0.2.0', 'v0.3.0']) {
  test(`downloads and notes use the same latest release (${tag})`, async () => {
    const data = release(tag);
    const result = await render(() => ({ ok: true, json: async () => data }));
    for (const [index, suffix] of ['aarch64.dmg', 'x64-setup.exe'].entries()) {
      assert.equal(result.cards[index].elements['[data-download-link]'].href, `${repository}/releases/download/${tag}/Stellar-Refrain_${tag.slice(1)}_${suffix}`);
      assert.equal(result.cards[index].elements['[data-release-state]'].textContent, tag);
    }
    assert.equal(result.cards[0].elements['[data-download-label]'].textContent, 'Download for Mac');
    assert.equal(result.cards[1].elements['[data-download-label]'].textContent, 'Download for Windows');
    assert.equal(result.notes.href, data.html_url);
    assert.equal(result.notesLabel.textContent, `Release notes · ${tag}`);
  });
}

test('a missing platform falls back to the same release, never another architecture', async () => {
  const data = release();
  data.assets = data.assets.filter(asset => !asset.name.endsWith('_x64-setup.exe'));
  const result = await render(() => ({ ok: true, json: async () => data }));
  assert.match(result.cards[0].elements['[data-download-link]'].href, /aarch64\.dmg$/);
  assert.equal(result.cards[1].elements['[data-download-link]'].href, data.html_url);
  assert.equal(result.cards[1].elements['[data-release-state]'].textContent, 'Not available');
  assert.equal(result.cards[1].elements['[data-download-label]'].textContent, 'View release');
  assert.equal(result.notes.href, data.html_url);
});

test('rejects assets from a different repository, release, or incomplete upload', async () => {
  const data = release();
  const mac = data.assets.find(asset => asset.name.endsWith('_aarch64.dmg'));
  data.assets = [
    { ...mac, browser_download_url: mac.browser_download_url.replace('/downloads/', '/other-repo/') },
    { ...mac, browser_download_url: mac.browser_download_url.replace('/v0.3.0/', '/v0.1.0/') },
    { ...mac, state: 'new' },
    { ...mac, size: 0 },
  ];
  const result = await render(() => ({ ok: true, json: async () => data }));
  assert.equal(result.cards[0].elements['[data-download-link]'].href, data.html_url);
  assert.equal(result.cards[0].elements['[data-release-state]'].textContent, 'Not available');
});

test('rate limiting and network errors preserve working release-page links', async () => {
  assertFallback(await render(() => ({ ok: false, status: 403 })));
  assertFallback(await render(() => { throw new Error('Offline'); }));
});

test('a request timeout preserves working release-page links', async () => {
  assertFallback(await render(null, { timeout: true }));
});

test('unpublished, malformed and mismatched releases preserve fallbacks', async () => {
  for (const data of [null, {}, { ...release(), assets: null }, { ...release(), draft: true }, { ...release(), prerelease: true }, { ...release(), html_url: 'https://example.com/release' }, { ...release(), html_url: `${repository}/releases/tag/v0.1.0` }]) {
    assertFallback(await render(() => ({ ok: true, json: async () => data })));
  }
  assertFallback(await render(() => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } })));
});

test('without JavaScript the shipped HTML exposes usable download and notes links', () => {
  assertFallback(page());
  const section = html.match(/<section class="download"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(section, /\s(?:hidden|disabled)(?:[\s=>])|Coming soon/);
});
