# Verification pipeline

Content authoring (writing an article, running the cover-image script)
and the site build (Next.js static export + Pagefind indexing) used to
be two disconnected manual steps — nothing checked that they'd actually
left the repo in a coherent, deployable state before pushing. That gap
caused a real failed production deploy: adding the `sharp` dependency
updated `package.json` but `package-lock.json` was never fully
regenerated, so it silently drifted out of sync. An ordinary
`npm install` papers over an inconsistent lockfile without complaint —
the drift only surfaced when Vercel ran `npm ci` (its actual install
command, per `vercel.json`), which refuses to proceed on a mismatch.

**`npm run verify`** (from inside `site/`) runs the whole pipeline
locally, in order, stopping at the first failure:

1. **Content/asset integrity** (`check-content.mjs`) — every
   `cover_image`/`cover_image_thumb` front-matter path must resolve to
   a real file under `public/`; a `series` slug with no
   `content/series.json` entry is a warning, not a failure (the site
   degrades gracefully to the raw slug as a title — see
   [series.md](./series.md)). **Hard failure** on a missing asset file,
   since that's a real 404 in production, not something the site can
   fall back from.
2. **Cover-image queue** (`check-cover-queue.mjs`) — reports any
   `pending`/`failed` entries left in `cover-images.json`. Warning
   only: cover images are optional per article, so outstanding queue
   entries are a valid state, not a broken one.
3. **`npm ci`** — the exact install command Vercel runs. Deletes and
   reinstalls `node_modules` from `package-lock.json` alone; this is
   what would have caught the `sharp` lockfile drift locally instead
   of on Vercel. Slower than `npm install` and touches `node_modules`
   — that's the point, it's the only way to actually reproduce what
   production does.
4. **`npm run build`** — the real static export plus Pagefind
   indexing, i.e. exactly what gets deployed.

**Enforcement:** a `.git/hooks/pre-push` script runs `npm run verify`
automatically on every `git push`, blocking the push if any step fails.
Hooks under `.git/hooks/` are local to a clone and not committed to the
repository — if this repo is ever cloned fresh elsewhere, that file
needs to be recreated there too.
