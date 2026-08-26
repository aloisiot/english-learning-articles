---
name: "english-learning-cover-image"
description: "Find, download, and attach a license-free cover image to an English Learning article. Use when creating a new article (as a step referenced from the english-learning-article skill) or when asked to add/retrofit a cover image onto an existing article."
---

## English Learning — Cover Image Skill

Attaches one license-free, self-hosted, compressed cover image to an
article in the English Learning site (`site/` — Next.js, static export,
articles in `site/content/*.md`).

### Why self-hosted, not hotlinked

The site's `docs/STYLE-SPEC.md` establishes a "no external data"
principle (fonts are downloaded at build time via `next/font` rather than
fetched from Google at request time). Cover images follow the same rule:
the image file is downloaded once and committed into the site's own
`public/` folder, never referenced by a live URL on someone else's
server.

### Image source: Wikimedia Commons only

Use **Wikimedia Commons** (commons.wikimedia.org) as the sole source.
Reasons: no API key needed, every file page carries structured
license/author/source metadata, and its license options are true open
licenses (CC0, public domain, CC-BY, CC-BY-SA) rather than a platform-
specific "free to use" grant like Unsplash/Pexels.

**Only these licenses are acceptable:**

- Public domain / CC0
- CC BY (2.0/3.0/4.0)
- CC BY-SA (2.0/3.0/4.0)

**Never use:** anything marked non-commercial-only (CC BY-NC) or
no-derivatives (CC BY-ND), or anything with an unclear/missing license
tag on the file page. If in doubt, skip the image and search again.

### The default workflow: find, then run the script

Claude's sandboxed shell/`web_fetch` frequently **cannot reach**
`commons.wikimedia.org` or `upload.wikimedia.org` (proxy allowlist
blocks the domain outright, confirmed via both `web_fetch` and direct
`curl` returning `blocked-by-allowlist`). Do not try to route around a
blocked fetch with other fetch methods. The work splits into two
phases run by two different parties, and **the script is the default
way phase 2 happens** — even when Chrome browser tools are connected
and could technically download directly, prefer queuing the script
unless the user asks for the Chrome path specifically.

**Phase 1 — Claude finds candidates (no download needed).** Use
`WebSearch` with queries like `site:commons.wikimedia.org <topic
keywords> photograph CC0` to find candidate files, then a follow-up
search on the exact filename (`"File:X.jpg" wikimedia commons license
author`) to get the license/author as reported in search snippets. This
is enough to shortlist an image and record it — it is *not* enough to
be the final source of truth for the credit line, since it's read from
search snippets rather than the file page itself, and the script
re-verifies everything live before using it.

**Phase 2 — the user runs `site/scripts/download-covers.mjs`**
(`npm install` once, to pick up the `sharp` dependency, then `npm run
covers` from inside `site/`). That script, run on a machine with normal
internet access:

1. Calls the Wikimedia API directly for live imageinfo/license/author —
   the authoritative check, independent of whatever Claude found via
   search. Requests a pre-scaled rendition (`iiurlwidth=1600`) rather
   than the full original, so the source data itself is already a
   reasonable size before any local processing.
2. Rejects anything outside the allowed licenses and reports why,
   without downloading it.
3. Runs the result through `sharp` to produce **two** WebP files:
   `public/images/covers/<slug>.webp` (the hero, max 1600px wide,
   quality 80) and `public/images/covers/<slug>-thumb.webp` (max
   500px, quality 75, for article-list rows — see "File weight and the
   two-file split" below).
4. Writes `cover_image` / `cover_image_thumb` / `cover_image_alt` /
   `cover_image_credit` into the article's front matter automatically
   (via `gray-matter`).
5. **On success, deletes the entry from `cover-images.json`.** The
   article's own front matter is the record of what was used —
   `cover-images.json` only ever holds outstanding work (`pending`) or
   things that failed and need attention (`failed`, with a `notes`
   explanation). Don't re-add an entry for an article that already has
   `cover_image` set in its front matter; that means it's done.

### File weight and the two-file split

Wikimedia Commons source files vary enormously in size — a scanned
archival photo or a modern high-resolution upload can be tens of
megapixels. Early versions of this workflow downloaded the file as-is:
one cover ended up at 7.1MB (from a 5767×3604 original) for a hero
image displayed at roughly 700px wide, and every article-list row was
re-using that same full-size file shrunk by CSS to show a 144px
thumbnail. Both problems are fixed at the source now, not worked around
later:

- The script asks Wikimedia for a pre-scaled rendition rather than the
  raw original (`iiurlwidth`), so the input is already reasonable
  before any local processing.
- It always re-encodes to WebP (25-35% smaller than JPEG at equivalent
  visual quality) and resizes to a size that actually matches where the
  image is used: **1600px/quality 80 for the hero** (covers the site's
  ~707px display width at 2x/retina density), **500px/quality 75 for
  the thumbnail** (covers the ~144px article-list display width at up
  to 3x density).
- `withoutEnlargement: true` on both — a source already smaller than
  the target is never upscaled.

**Never hand-edit these dimensions per article without a reason** — if
a specific image genuinely needs different treatment, that's worth a
comment in the script, not a one-off exception.

### Why not `next/image`

This site builds with `output: "export"` (`next.config.mjs`) — a fully
static build, with no server for Next's on-demand image optimizer to
run on, on Vercel or anywhere else. `next/image` in that mode requires
`images.unoptimized: true`, which serves the raw file with no
resizing/format conversion/compression at all — functionally identical
to a plain `<img>`, but with an added dependency on Next's image
plumbing for no benefit. The real compression work has to happen at
content-authoring time (in `download-covers.mjs`) rather than at
request time, since there's no request-time server to do it on.

### Choosing an image

- Search Commons using 2-3 keywords drawn from the article's `topic` and
  `keywords` front matter — not the literal article title, which is
  often too specific to have good photographic coverage.
- Prefer photographs over illustrations/diagrams, landscape orientation
  (the cover renders wide, above the title, 16:9), and images that read
  calmly rather than busy or high-contrast — matching the site's sober,
  no-accent-colour design (`docs/STYLE-SPEC.md` §5).
- Avoid images containing readable text, watermarks, or identifiable
  people in a way that implies endorsement of the article's content.
- A conceptual/metaphorical fit (e.g. flowing water for a wu-wei
  article) is fine and often better than a literal illustration.

### Where the files go

```
site/public/images/covers/<slug>.webp        ← hero (article page)
site/public/images/covers/<slug>-thumb.webp  ← thumbnail (article-list rows)
```

`<slug>` matches the article's markdown filename exactly (same slug as
`site/content/<slug>.md`). Both files are always WebP regardless of the
source format — the download script handles conversion, so don't
hand-place a `.jpg`/`.png` here.

### Front matter fields

```yaml
cover_image: "/images/covers/<slug>.webp"
cover_image_thumb: "/images/covers/<slug>-thumb.webp"
cover_image_alt: "Plain-language description of what's in the photo"
cover_image_credit: "Photo by <Author> on Wikimedia Commons (<License>)"
```

The download script writes all four automatically from live API data.
Its author-extraction is deliberately conservative: Commons'
`extmetadata` fields are HTML, not plain text, and some files
(especially archival ones with no clean "Artist" field) only have a
paragraph-length "Credit" block full of links. Rather than dump that
into the credit line, the script rejects anything that doesn't clean up
into a short name and falls back to "an unlisted Wikimedia Commons
contributor". If that happens and a better manual credit is known
(check the file page yourself), it's fine to hand-edit
`cover_image_credit` afterward — the script won't touch that article
again once it's removed from `cover-images.json`.

If adding fields by hand instead of via the script (e.g. a
Chrome-connected session downloading directly): still produce both a
hero and a thumbnail WebP file (a quick `sharp` one-liner, or any image
tool, at the dimensions above) rather than only `cover_image` — a
missing `cover_image_thumb` isn't an error (callers fall back to the
hero file), but it defeats the point of the split. Match the front
matter format exactly: `cover_image_alt` is a real description for
screen readers, not the article title restated; `cover_image_credit`
uses the license's human-readable short name (e.g. "CC BY-SA 4.0"), not
the bare license code.

### Site wiring (already implemented — reference only)

`site/app/articles/[slug]/page.js` renders `cover_image` above the
article header (`loading="eager"`, it's always above the fold) with
`cover_image_alt` as the `alt` text and `cover_image_credit` as a small
caption beneath it, using a plain `<img>` tag. `cover_image_thumb` isn't
rendered there — it's exposed via Pagefind meta so search results can
use it — and `app/article-summary.js` (the shared homepage/search list
component) renders it at ~144px with `loading="lazy"`. If `cover_image`
is absent, nothing renders — cover images are optional per article, not
a hard requirement like References. Styling is `docs/STYLE-SPEC.md` §6a
(hero) / §6b (thumbnails).

### Step by step

1. Read the article's `topic` and `keywords` front matter for search
   terms.
2. Search Wikimedia Commons (via `WebSearch`) for a matching, calmly-
   toned photograph; confirm the license via a second targeted search
   on the exact filename.
3. Add (or create) an entry in `site/scripts/cover-images.json` with
   `status: "pending"`.
4. Tell the user to run `npm run covers` from `site/` (first run: `npm
   install` beforehand, to pick up the `sharp` dependency). This is the
   default path — don't switch to downloading directly through Chrome
   unless the user asks for that instead.
5. After the script runs, spot-check: does the downloaded image
   actually look right for the article? Is the credit line accurate?
   (If the script fell back to the generic "unlisted contributor"
   credit, check the file page for a better one and hand-edit it in.)
6. If doing this for multiple existing articles in one pass, add all
   candidates to the JSON first, then one script run handles all of
   them — no need to run it per article.

### Retrofitting existing articles

Same process as above — add one JSON entry per article, run the script
once for the whole batch. There's no shortcut on the *search* side
(each image still needs its own search and a tone check), but the
*download and compression* side genuinely batches. This also applies
when an existing article's images need to be reprocessed through a
pipeline change (e.g. after the hero+thumbnail split was added) — the
JSON entries look identical to a fresh candidate, the script doesn't
distinguish "new" from "recompress."

