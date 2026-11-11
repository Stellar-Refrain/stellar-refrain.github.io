# Stellar Refrain homepage

The marketing site for Stellar Refrain is a static homepage with separate privacy policy and terms of service pages. It has no package installation, build step, backend, analytics or cookies. Fonts and artwork are bundled locally. The download section makes one anonymous request to GitHub's public API to find the latest release.

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

`.github/workflows/pages.yml` publishes only these files and directories: `index.html`, `404.html`, `.nojekyll`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `assets/`, `privacy/` and `terms/`. If you add another root file or directory, add it to the workflow's copy step too.

Paths in `index.html` are relative, so the page also works from a project subpath such as `https://owner.github.io/repository/`. There are three exceptions:

- `404.html` uses root-absolute paths, because GitHub Pages serves it at any missing URL.
- The canonical and Open Graph URLs point at the live domain.
- `sitemap.xml` and `robots.txt` also point at the live domain.

If you set up a custom domain, update all of these.

## Policy pages and Google OAuth

- Privacy policy: <https://stellar-refrain.github.io/privacy/>
- Terms of service: <https://stellar-refrain.github.io/terms/>
- Support contact: <jerryrox@outlook.co.nz>

The pages are interim documents for the development release, with links from the homepage footer. They describe basic Google sign-in (`openid`, `email`, `profile`), the game's Supabase accounts and cloud saves, and the static website's GitHub hosting. They are plain HTML, publicly readable without signing in or running JavaScript. Shared reading styles are in `assets/css/legal.css`.

Use these URLs in Google Auth Platform's Branding settings after deployment, along with the homepage URL. Keep the OAuth app in Testing while developing and configure test users as needed. For brand verification, Google requires an accurate privacy policy, matching app identity and verification of the authorized domain; these pages alone do not guarantee approval. See [Google's brand verification requirements](https://developers.google.com/identity/verification/authentication-verification).

Before a broader release, review the documents against the deployed service and legal requirements. Update the policy and its date when scopes, providers, retention or data use change; handle deletion requests through the published contact address.

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

The visual direction is "Nocturne": the game's moonlit Home terrace, read as a storybook star chart. It uses the game's newer interface fonts, Marcellus for names, places and titles and Urbanist for interface text and numbers, along with the game's gold notched buttons, four-point crest and night palette.

`index.html` contains every section, in this order:

| Section | Anchor | Notes |
| --- | --- | --- |
| Hero | `#top` | Key art with petals and starlight drawn over it, the Marcellus wordmark, tagline and platforms |
| Overture | `#overture` | The opening sentence, which lights up word by word as it scrolls past |
| Prologue | `#story` | Eight illustrated, manually paced scenes on a star-chart timeline, then the first-arc chapter cards at `#first-arc` |
| Stellans | `#stellans` | A character-select stage for five featured Stellans, with roster, expressions and typed quotes, then an "And many more" silhouette teaser |
| Worlds | `#worlds` | A draggable horizon between night-time Lyth and daytime Khalion, notes on each, and postcards that open in the lightbox |
| Gameplay | `#gameplay` | Real in-game screenshots as a deck that follows the feature list, and the stats marquee |
| Promise | `#free` | The free-to-play commitments, joined by a constellation line |
| Download | `#download` | Boarding-pass installers and matching release notes, driven by `downloads.js` |
| FAQ | `#faq` | Native `<details>` disclosures |

Each featured Stellan has a shareable deep link, for example `/#stellan-ren`.

### Files

- `assets/css/site.css`: design tokens, type, responsive layout, section styles and keyframes. The policy pages use it too.
- `assets/css/legal.css`: the policy pages' reading layout.
- `assets/js/site.js`: masthead and menu, section rail and sky colour, night sky, hero petals and starlight, overture, prologue reader, Stellan spotlight, horizon, postcard dragging, feature deck, stats marquee, constellation line, tilt and button effects, FAQ disclosures and lightbox.
- `assets/js/downloads.js`: latest-release lookup, platform installer selection and release notes.
- `assets/img/`: WebP artwork, screenshots, icons, `og-image.jpg` (the 1200×630 social preview) and favicons.
- `assets/fonts/`: Latin subsets in WOFF2 of Marcellus and Urbanist (500, 600 and 700), converted from the game's `packages/game-ui/src/fonts/`. Their licenses are in `assets/licenses/`.

### Progressive enhancement

Without JavaScript the page stays complete:

- All eight prologue scenes render in reading order, with their illustrations and copy.
- The featured Stellans render as a list.
- Lyth and Khalion appear side by side instead of behind the draggable horizon.
- Every gameplay screenshot and feature description is visible.
- Postcards and **View illustration** links open the image directly.
- FAQs still expand.
- Download and release-notes links open the latest release on GitHub.

Motion styles are keyed to the `js` class on `<html>`. If `site.js` has not run four seconds after the page starts, an inline script removes that class so nothing stays hidden.

With `prefers-reduced-motion`, the sky, petals and starlight are still, parallax, the marquee and autoplay stop, quotes appear in full, and entrance and scene transitions complete immediately. Scroll-linked effects update once per animation frame. Canvas drawing pauses when the hero is off screen or the page is hidden, and the gameplay tour pauses off screen, on hover and on focus.

### Prologue reader

The prologue is a short public introduction adapted from the current game history. It advances only when a visitor selects a scene, uses Back/Next or swipes on a touch screen. Scene tabs use Left/Right and Home/End in both layouts; Tab moves into the selected scene. On narrow screens the timeline scrolls horizontally and the illustration sits above the text. The "Skip to chapters" link lets visitors continue down the page immediately.

To edit it, update the matching `.story-tab` and `.scene` in `index.html`. Keep their `aria-controls`, ids and order aligned. If the number of scenes changes, update the displayed totals and the timeline's column count in `site.css`. Only `site.js` adds tab roles and hides inactive scenes, so the full story remains readable without JavaScript.

### Featured Stellans

The page deliberately features only a few Stellans: Miko, Nana, Ren, Chika and Lily. The rest of the cast is only hinted at by the silhouette teaser, `assets/img/stellans/more-silhouettes.webp`. Its shapes come from other characters' standing art, but no names are shown. Keep unfeatured characters' art out of `assets/` so the full cast can't be found by browsing.

To swap or add a featured Stellan, copy an existing `<article class="stellan">` and its matching `.roster-tab` button. Then update:

- the ids
- the class badge
- the `--c` accent colour, from `HEROES` in the game's `packages/game-core/src/card/game.ts`
- the copy, including the background name in `.stellan-giant` and the dialogue avatar
- the `01 / 05` counters

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
- `content/prologue/cinematic-screenplay.json`: the current in-game prologue; the website summarizes its history without reproducing the dramatized dialogue.
- `docs/design/chapters/cinematic-prologue.md`: canon boundaries and the current artwork selection.
- `packages/game-core/src/card/game.ts`: classes, titles, signature skills and accent colours.
- `docs/design/game-direction.md` and `docs/development/earned-progression-handover.md`: the free-to-play and earned-recruitment commitments.

Artwork comes from `assets/library/`:

The website's prologue uses the November 2, 2026 selection: `research-v2`, `conflict-v1`, `hospital-v2`, `worlds-v2`, `concord-v2`, `stellar-v3` and `anomalies-v2`, plus the existing arrival terrace. Each is encoded at 720px and 1280px wide as WebP, preserving the full composition.

- `characters/<id>/art/`: standing portraits, expressions, avatars and illustrations for the featured Stellans. Nana's illustration is `nana-hammer-demonstration.png`. The teaser silhouettes are rendered from Iona, Sena, Celia, Ayame, Ayano, Mel and Rika's standing art, reduced to shapes.
- `shared/art/prologue/`, `shared/art/moonlit-terrace.png`, `shared/art/star-core-laboratory.png` and `shared/art/currencies/`.
- `chapters/{arrival,first-signal,library-welcome,missing-safeguard}/art/`: Lyth and Khalion locations.

Screenshots were captured from the 0.2.0 build (`apps/game/dist`, demo mode) and from the game's Storybook fixtures:

- **Battle**: the Crossing Colossus encounter.
- **Teams**: the full formation.
- **Shop**: the Star Core laboratory.

The app icon comes from `apps/game/src-tauri/icons/`.

Artwork is resized and encoded as WebP for delivery, with no visual changes. This repository does not grant a separate license to redistribute the game's artwork.
