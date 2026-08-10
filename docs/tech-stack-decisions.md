# Website — technology decisions

Markdown + YAML front matter is deliberately chosen so it converts cleanly
into a website later, with no rework needed now. No server or database is
needed for a project this size — everything below is a static-site
approach (files → HTML, hosted for free).

This section is kept as a record of the decision that led to the current
stack, rather than as forward-looking guidance — see
[overview.md](./overview.md) "Status" for what's actually live.

## Site generators (turn the markdown folder into a website)

**Quartz** — considered, not chosen (see Final decision below).
Purpose-built for exactly this use case: a folder of markdown notes with
front matter, published as a browsable, searchable site.

- Pros: built-in full-text search, backlinks, graph view showing how
  articles connect (e.g. by keyword/grammar tag), reads Obsidian-style
  markdown directly, minimal setup, free hosting (GitHub/Cloudflare Pages).
- Cons: opinionated look (some CSS work needed to make it feel less like
  a "notes wiki" and more like a blog); smaller ecosystem than Astro/Hugo;
  less flexible if the project later needs custom page types.

**Astro**
The general-purpose default for content sites in 2026.

- Pros: very flexible, large plugin/component ecosystem, excellent
  markdown/content-collection support, ships almost no JavaScript so pages
  load fast, easy to design a fully custom blog look.
- Cons: more setup than Quartz — search, tagging, and the keyword index
  aren't built in, need to be added (e.g. with Pagefind); requires more
  hands-on web development than a "point it at a folder" tool.

**Hugo**

- Pros: extremely fast builds (matters only at large scale), no Node.js
  dependency, mature and stable, good for blog-style content.
- Cons: templating language (Go templates) is less intuitive than
  markdown/JS-based tools; smaller advantage for a project this small;
  no built-in search or note-linking.

**Eleventy (11ty)**

- Pros: simple mental model (content + template → HTML), minimal
  abstraction, easy to understand and modify by hand, good documentation.
- Cons: like Hugo, needs search and indexing added manually; less
  "batteries-included" than Quartz for a personal knowledge-base style site.

**Obsidian Publish / Notion**

- Pros: fastest to get something live, no coding required.
- Cons: recurring subscription cost, far less control over search/index
  behavior and design, harder to make it look like a real blog.

## Search (only needed once the site is generated)

**Pagefind** — Recommended.

- Pros: purpose-built for static sites, runs entirely in the browser
  (no server/database/monthly bill), indexes the built HTML directly,
  works with any generator (Quartz, Astro, Hugo, Eleventy all support it),
  free, privacy-friendly (no queries sent anywhere).
- Cons: search runs after a build step, so it needs the site to be
  rebuilt when new articles are added (fine for this project's pace).

**Lunr.js** — older alternative, similar idea (client-side, no backend)
but less actively developed and less optimized for large content sets
than Pagefind.

**Algolia** — hosted, very polished, used by many docs sites, but
overkill here: free tier is generous but it's a third-party service with
usage limits, unnecessary for a personal project of this size.

## Hosting (all free for this project's scale)

**Cloudflare Pages** — considered, not chosen (Vercel selected instead,
see Final decision below).

- Pros: unlimited sites, unlimited bandwidth, unlimited requests on the
  free tier, fast global CDN, simple Git-based deploys.
- Cons: slightly less "beginner tutorial" coverage than GitHub Pages.

**GitHub Pages**

- Pros: simplest option if the articles already live in a GitHub repo,
  free custom domain support, zero extra accounts needed.
- Cons: 1GB site size cap, ~100GB/month soft bandwidth limit, 10
  builds/hour — all far beyond what this project needs, but worth knowing.

**Netlify**

- Pros: most polished all-in-one deploy experience, instant rollbacks,
  branch previews, easy drag-and-drop deploys.
- Cons: bandwidth (100GB/month) and build-minute caps are lower than
  Cloudflare's free tier.

## Final decision: Next.js stack

Chosen requirements: no template-language framework (component-based,
reusable, cross-platform), deeply customizable blog design, no data
handed off to third-party services, easy long-term deploy/maintenance,
and strong build-time indexing/search — all pointing to a Next.js stack
rather than Quartz/Astro/Hugo/Eleventy.

- **Framework: Next.js**, statically rendered (SSG) rather than
  server-rendered. Every article page is pre-built to full HTML at build
  time — important for SEO, since crawlers (Google, Bing, Brave Search,
  DuckDuckGo) see complete content immediately with no JavaScript
  execution required, unlike client-rendered pages. Configure via
  `generateStaticParams()` for each article route, or `output: 'export'`
  for a fully static export if server features aren't needed at all.
- **Content parsing:** `gray-matter` reads the YAML front matter already
  used in the article template (title, date, level, topic, grammar_focus,
  keywords); Markdown/MDX renders the article body.
- **Search/indexing: Pagefind**, run as a postbuild step. It indexes the
  static HTML Next.js just generated, so indexing happens automatically
  at build time — no manual index maintenance, no runtime server calls.
  Search then executes entirely client-side in the visitor's browser;
  no query or content data is ever sent to a third party (rules out
  Algolia, which is hosted).
- **Hosting: Vercel** — already in use, Git-push deploys, minimal
  long-term maintenance overhead.

Build flow: markdown articles → Next.js static build (SSG) → Pagefind
indexes the output → deploy to Vercel. Every step happens at build time;
nothing depends on a live server or external service at request time.

Recommended order at the time: build up a corpus of markdown articles
first, then wire up the Next.js site once there's enough content to make
search and navigation genuinely useful. That site is now built — see
[overview.md](./overview.md) "Status" — so this section is kept as a
record of the decision rather than as forward-looking guidance.
