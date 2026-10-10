# Stellar Refrain homepage

A standalone static landing page for Stellar Refrain. No package installation, build step, backend, analytics, or external font service is required.

## Preview

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/>. The site can also be opened directly from `index.html`.

## Publish on GitHub Pages

1. Add these files to the GitHub repository you want to use, on its `main` branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. Push to `main`, or run **Deploy homepage to GitHub Pages** manually from the Actions tab.
4. The deployment's `github-pages` environment shows the published URL.

The included `.github/workflows/pages.yml` copies only `index.html`, `.nojekyll`, and `assets/` to the published artifact. Asset links are relative, so both `https://owner.github.io/` and `https://owner.github.io/repository/` work. If your default branch isn't `main`, change the workflow's `branches` value. A custom domain can be added in the repository's Pages settings later.

This folder has not yet been connected to a remote repository or published.

Reference: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Add binary downloads

Edit `assets/downloads.js`. Each platform has an empty `url`, a button `label`, and an optional `version`. The initial targets are:

- `mac`: macOS, Apple Silicon / ARM64.
- `windows`: Windows, Intel or AMD / x64.

Set `url` to your actual binary URL, for example a GitHub Release asset URL. A nonempty HTTP(S) URL or relative path replaces that platform's disabled **Coming soon** button with a real download link. Empty or invalid URLs retain the placeholder. The site does not guess a release URL or start a download automatically.

At release time, also update the development badge, platform note, download introduction and footnote, and availability FAQ in `index.html`. Minimum OS versions have intentionally not been invented. Confirm them against the actual builds before adding them.

## Edit the page

- `index.html`: copy, sections, companion profiles, and platform labels.
- `assets/style.css`: responsive layout, colors, and typography.
- `assets/app.js`: mobile navigation, accessible companion tabs, and download configuration.
- `assets/images/`: optimized local WebP artwork and the game favicon.
- `assets/fonts/` and `assets/licenses/`: bundled game fonts and their licenses.

The companion tabs support arrow keys, Home, and End. Navigation, content, FAQ disclosures, and download placeholders remain available without JavaScript; the initial Miko profile is shown in that case. Motion preferences are respected.

## Content and asset provenance

The existing `aica-rpg` project supplied the lore and artwork. No files in that repository were modified. Public-facing copy is adapted from these sources, without author-only plot reveals:

- `content/project.json`: Stellan identity, Astral Concord, the commander's role, and character biographies.
- `docs/design/game-direction.md`: the selected free-play direction.
- `docs/development/earned-progression-handover.md`: the newer progression state, superseding the older prototype details in the root README.
- `assets/library/characters/{miko,nana,ren,chika}/art/`: the current character illustrations and avatars. Nana's scene is `nana-hammer-demonstration.png`.
- `assets/library/chapters/arrival/art/lyth-waterfront.png`.
- `assets/library/chapters/first-signal/art/khalion-residential-sky-terrace-v1.png`.
- `assets/library/shared/art/prologue/worlds-v1.png`.
- `apps/game/src-tauri/icons/128x128.png`: the existing app icon.
- `packages/game-ui/src/fonts/`: DM Sans and Libre Caslon Display; licenses copied from `assets/library/shared/notices/fonts/`.

Artwork is resized and encoded as WebP for delivery, with no visual redesign. This repository does not grant a separate license to redistribute the game's artwork.
