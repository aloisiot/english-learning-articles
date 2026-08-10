# Cover images

Optional per article: a license-free photograph, self-hosted in
`site/public/images/covers/` and referenced via four front-matter
fields (`cover_image`, `cover_image_thumb`, `cover_image_alt`,
`cover_image_credit`). Sourced exclusively from Wikimedia Commons
(CC0/public domain/CC-BY/CC-BY-SA only), never hotlinked — consistent
with the site's "no external data at request time" principle (fonts are
self-hosted the same way, see `docs/STYLE-SPEC.md` §2). Full sourcing and
attribution workflow lives in the `english-learning-cover-image` skill;
rendering treatment is in `docs/STYLE-SPEC.md` §6a/§6b. This is additive,
not a requirement like References — articles with no cover image render
exactly as before.

## Compression

`site/scripts/download-covers.mjs` (`npm run covers`) runs every image
through `sharp` at download time, producing two WebP files per article:
`<slug>.webp` (the hero, max 1600px wide, quality 80) and
`<slug>-thumb.webp` (max 500px, quality 75, used by article-list rows —
see §6b). This exists because Wikimedia Commons source files can be very
large — one early cover ended up at 7.1MB (a 5767×3604 original) before
this pipeline existed, downloaded in full for a hero displayed at
roughly 700px wide. The script also requests a pre-scaled rendition from
Wikimedia directly (`iiurlwidth`) rather than always pulling the full
original, so the fix happens at the source as well as in local
re-encoding.

## Why not `next/image`

This site builds with `output: "export"` (see `site/next.config.mjs`) —
a fully static build with no server for Next's on-demand image optimizer
to run on, including on Vercel. `next/image` would need
`images.unoptimized: true` in that mode, which serves the raw file with
no resizing/compression at all — no different from a plain `<img>`, but
with an added dependency. The compression that matters here can only
happen at content-authoring time (in `download-covers.mjs`), not at
request time, so that's where it lives.
