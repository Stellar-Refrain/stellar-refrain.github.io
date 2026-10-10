# Stellar Refrain homepage

The marketing site for Stellar Refrain is a single static page. It has no package installation, build step, backend, analytics or cookies. Fonts and artwork are bundled locally. The download section makes one anonymous request to GitHub's public API to find the latest release.

## Preview

From this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://127.0.0.1:4173/>. Opening `index.html` directly also works, but a local server is better for testing deep links and the 404 page.

## Publish on GitHub Pages

- Repository: [Stellar-Refrain/stellar-refrain.github.io](https://github.com/Stellar-Refrain/stellar-refrain.github.io)
- Live homepage: <https://stellar-refrain.github.io/>

Because of the repository name, this is the organization's root GitHub Pages site.

1. Commit changes to the repository's `main` branch.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. Push to `main`, or run **Deploy homepage to GitHub Pages** manually from the Actions tab.
4. The `github-pages` environment of the deployment shows the published URL.

`.github/workflows/pages.yml` publishes only these files: `index.html`, `404.html`, `.nojekyll`, `robots.txt`, `sitemap.xml`, `site.webmanifest` and `assets/`. If you add another root file, add it to the workflow's copy step too.

Paths in `index.html` are relative, so the page also works from a project subpath such as `https://owner.github.io/repository/`. There are three exceptions:

- `404.html` uses root-absolute paths, because GitHub Pages serves it at any missing URL.
- The canonical and Open Graph URLs point at the live domain.
- `sitemap.xml` and `robots.txt` also point at the live domain.

If you set up a custom domain, update all of these.

## Release downloads

`assets/js/downloads.js` requests the [latest published release](https://docs.github.com/en/rest/releases/releases#get-the-latest-release) from `Stellar-Refrain/downloads` on each page load. It uses that release's asset URLs for the platform buttons, shows its version in each badge, and links the release-notes button to the same release's GitHub page. Drafts and prereleases are excluded.

Publish a new release in the `downloads` repository with the existing installer naming convention:

- Mac: `Stellar-Refrain_<version>_aarch64.dmg` (`arm64` is also accepted).
- Windows: `Stellar-Refrain_<version>_x64-setup.exe`.

No website edit is needed for a new version. Update the asset patterns in `downloads.js` if installer naming changes. Only uploaded, nonempty installer assets hosted in this repository and matching the selected release tag are used; signatures and other architectures are ignored. Downloads start only when a visitor clicks a button.

The HTML provides working links to GitHub's latest release when JavaScript is disabled or the API fails, is rate limited, or takes longer than eight seconds. If the latest release lacks a platform installer, that card shows **Not available** and links to that release page. The site does not mix installers from different releases.

The two targets match the game's desktop builds (Tauri `minimumSystemVersion` and the CI targets):

- `mac`: macOS 13 or later, Apple Silicon only (`aarch64-apple-darwin`).
- `windows`: Windows 10/11, x64 (`x86_64-pc-windows-msvc`).

Run the download behavior checks with `node --test tests/downloads.test.cjs`.

## Page structure

`index.html` contains every section, in this order:

| Section | Anchor | Notes |
| --- | --- | --- |
| Hero | `#top` | Key art, wordmark, starfield canvas and pointer parallax |
| Prologue | `#story` | Six scroll-driven beats, then the first-arc chapter cards |
| Stellans | `#stellans` | Five featured Stellans with roster and expression switcher, then an "And many more" silhouette teaser |
| Worlds | `#worlds` | Lyth and Khalion, with postcards that open in the lightbox |
| Gameplay | `#gameplay` | Real in-game screenshots in auto-advancing tabs, and the stats row |
| Promise | `#free` | The free-to-play commitments |
| Download | `#download` | Latest-release installers and matching release notes, driven by `downloads.js` |
| FAQ | `#faq` | Native `<details>` disclosures |

Each featured Stellan has a shareable deep link, for example `/#stellan-ren`.

### Files

- `assets/css/site.css`: design tokens (the game's night navy, cream ink, gold and ice palette), layout and responsive rules.
- `assets/js/site.js`: header and mobile menu, starfield, parallax, prologue scroller, Stellan spotlight, feature tabs and lightbox.
- `assets/js/downloads.js`: latest-release lookup, platform installer selection and release notes.
- `assets/img/`: WebP artwork, screenshots, icons, `og-image.jpg` (the 1200×630 social preview) and favicons.
- `assets/fonts/`: subset WOFF2 builds of DM Sans and Libre Caslon Display, the fonts the game uses. Their licenses are in `assets/licenses/`.

### Progressive enhancement

Without JavaScript the page stays complete:

- The featured Stellans render as a list.
- Postcards and **View illustration** links open the image directly.
- FAQs still expand.
- Download and release-notes links open the latest release on GitHub.

With `prefers-reduced-motion`, the starfield, parallax, autoplay and entrance animations are disabled.

### Featured Stellans

The page deliberately features only a few Stellans: Miko, Nana, Ren, Chika and Lily. The rest of the cast is only hinted at by the silhouette teaser, `assets/img/stellans/more-silhouettes.webp`. Its shapes come from other characters' standing art, but no names are shown. Keep unfeatured characters' art out of `assets/` so the full cast can't be found by browsing.

To swap or add a featured Stellan, copy an existing `<article class="stellan">` and its matching `.roster-tab` button. Then update:

- the ids
- the class badge
- the `--c` accent colour, from `HEROES` in the game's `packages/game-core/src/card/game.ts`
- the copy
- the `/ 05` counter

Images live in `assets/img/stellans/<id>/`:

| File | Source in the game repo | Format |
| --- | --- | --- |
| `neutral.webp`, plus one file per expression named after the `data-pose` value | standing art | 640×960, transparent |
| `avatar.webp` | avatar | 192×192 |
| `illustration.webp` | illustration | 1600 px wide |
| `backdrop.webp` | illustration | 480 px wide, blurred |

## Content and asset provenance

The lore, artwork and screenshots come from the `stellar-refrain-game` repository (formerly `aica-rpg`). No files in that repository were modified.

Public copy is adapted from these sources, without author-only notes or plot reveals:

- `content/project.json`: Stellan biographies, roles, traits and quotes.
- `packages/game-core/src/prologue/prologue.ts`: the in-game prologue.
- `packages/game-core/src/card/game.ts`: classes, titles, signature skills and accent colours.
- `docs/design/game-direction.md` and `docs/development/earned-progression-handover.md`: the free-to-play and earned-recruitment commitments.

Artwork comes from `assets/library/`:

- `characters/<id>/art/`: standing portraits, expressions, avatars and illustrations for the featured Stellans. Nana's illustration is `nana-hammer-demonstration.png`. The teaser silhouettes are rendered from Iona, Sena, Celia, Ayame, Ayano, Mel and Rika's standing art, reduced to shapes.
- `shared/art/prologue/`, `shared/art/moonlit-terrace.png`, `shared/art/star-core-laboratory.png` and `shared/art/currencies/`.
- `chapters/{arrival,first-signal,library-welcome,missing-safeguard}/art/`: Lyth and Khalion locations.

Screenshots were captured from the 0.2.0 build (`apps/game/dist`, demo mode) and from the game's Storybook fixtures:

- **Battle**: the Crossing Colossus encounter.
- **Teams**: the full formation.
- **Shop**: the Star Core laboratory.

The app icon comes from `apps/game/src-tauri/icons/`.

Artwork is resized and encoded as WebP for delivery, with no visual changes. This repository does not grant a separate license to redistribute the game's artwork.
