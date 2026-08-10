# Style Specification — "Quiet Editorial"

The design specification for the English Learning Articles site.
Research phase is complete; this is the single reference document.

**Principle:** the article is the centre of gravity. Serif for prose,
sans-serif for anything that is not prose, hierarchy from size and space
rather than colour or ornament — the reading experience of a well-set
book.

**Reference site:** [craigmod.com](https://craigmod.com/) — long-form
essays in serif with a narrow measure and generous line spacing;
navigation, dates and captions drop to small sans-serif so they never
compete with the prose. No accent colour; hierarchy carried entirely by
size and spacing. Also a static site, so it is a realistic target.

---

## 1. Why this design (research summary)

**Line length is the highest-impact decision.** The optimum is 45–75
characters per line, with 66 the classic target; WCAG sets 80 as the
ceiling for Latin scripts. Too long and the eye struggles to find the
next line; under 45 and the rhythm breaks. Critically, the measure must
be retuned whenever the typeface changes — a wider face fits fewer
characters in the same pixel width.

**Size and spacing are tuned together.** Body text belongs in the
16–20px range; line height guidance runs 1.2–1.5×, though long-form
reading benefits from the upper end and beyond. Body text is always
left-aligned — justified text without hyphenation creates uneven word
spacing, and centred body text is measurably harder to read.

**Modern minimalism is structure, not absence.** Build hierarchy through
size, weight, and spacing rather than colour, borders, or effects. Cap at
two typefaces and two or three tones. White space is an active tool for
directing attention, not leftover emptiness.

**Two adjustments specific to this project:**

- The reader is processing a *second language*, so reading comfort
  outweighs density. This pushes size and line height to the upper end of
  the recommended ranges, and the measure to the middle (~62–66ch rather
  than 75).
- Pages are used *live during a 30-minute class*, scrolled between
  sections while talking. Section boundaries must be findable at a
  glance — but achieved through space, not coloured boxes, or the design
  stops being sober.

---

## 2. Typefaces

### Body — recommended: Source Serif 4

Drawn specifically for screen reading rather than adapted from print.
Open apertures and a fairly large x-height keep letterforms distinct,
which matters more than usual for a second-language reader. Variable
font, so weight is a continuous axis and only one file loads. OFL
licensed.

**Alternates, if Source Serif 4 feels too neutral:**

| Face | Character | Note |
|---|---|---|
| Literata | Warmer, slightly sturdier | Commissioned for Google Play Books; optical-size axis adjusts contrast automatically between text and display sizes. OFL. |
| Newsreader | More editorial, more personality | Designed explicitly for long-form on-screen publishing. OFL. |
| Charter | Economical, quietly classic | Matthew Carter; built to survive low resolution. Ships with macOS. |

Avoid EB Garamond, Cormorant, and similar old-style revivals: beautiful
at display sizes but too fine-stroked at 18px, and thin strokes hurt
exactly the reader who is decoding unfamiliar words.

### Interface — recommended: system sans-serif stack

Metadata, navigation, filters, buttons, section labels.

```css
font-family: system-ui, -apple-system, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

Zero bytes, native rendering everywhere, and — being the reader's own
system font — it recedes visually, which is what interface text should
do. **Inter** is the alternative if consistent cross-platform appearance
matters more than load cost (~20–30KB subsetted).

Hard limit: **two typefaces total.** A third breaks the style.

### Loading strategy

Use `next/font` for both. It downloads the font at build time and serves
it from your own domain — the browser makes **no request to Google**,
keeping this consistent with the no-external-data requirement. It also
generates fallback metric overrides automatically, preventing layout
shift as the webfont swaps in.

```js
// app/layout.js
import { Source_Serif_4 } from "next/font/google";

const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  axes: ["opsz"],
});
```

Subset to `latin` only. Load the matching italic variable file (needed
for vocabulary example sentences) rather than separate static weights.

---

## 3. Type scale

A shallow, minor-third-ish scale. Sober design gets hierarchy from space
more than from dramatic size jumps.

| Token | Size | Use |
|---|---|---|
| `--text-2xs` | 0.75rem / 12px | Uppercase micro-labels (filter names, series-nav label) |
| `--text-xs` | 0.8125rem / 13px | Article metadata row, footer |
| `--text-sm` | 0.875rem / 14px | Interface text, buttons, nav, series-nav links |
| `--text-base` | 1rem / 16px | Secondary prose, vocabulary definitions |
| `--text-body` | 1.125rem / 18px | **Article body** |
| `--text-section` | 1.1875rem / 19px | In-article section headings (`## Grammar Spotlight`, …) |
| `--text-lg` | 1.9375rem / 31px | Index item titles (article list, series list) |
| `--text-xl` | 2.4375rem / 39px | Page title, mobile |
| `--text-2xl` | 2.8125rem / 45px | Page title, desktop |

As implemented, the heading sizes ended up roughly 40% larger than this
document originally specified (`--text-lg`/`--text-xl`/`--text-2xl` were
first drafted at 22/28/32px) — the larger sizes read better in practice
against the wide `--measure`. `--text-section` was added as its own token
rather than reusing `--text-sm`, so growing the in-article section
headings later doesn't also grow nav, buttons, and the footer.

Fluid page title, avoiding a hard jump at the breakpoint:

```css
--text-title: clamp(2.4375rem, 2.1rem + 1.68vw, 2.8125rem);
```

### Line height

| Context | Value | Rationale |
|---|---|---|
| Article body | **1.7** | Above the general range; long-form second-language reading needs the air |
| Headings | 1.25 | Tighter, so multi-line titles read as one unit |
| Metadata / UI | 1.4 | — |
| Vocabulary list | 1.6 | Scanned rather than read |

---

## 4. Measure and layout

The single highest-impact setting. Original target: **62–66 characters
per line**.

```css
--measure: 34rem;  /* ≈ 65 characters at 18px Source Serif 4, as implemented */
```

Specify in `rem` for stable layout, but **verify empirically**: render a
real paragraph and count characters on a full line. The `ch` unit
measures the digit zero, wider than the average lowercase letter, so a
`62ch` container yields roughly 66–70 actual characters.

**Retune whenever the typeface changes.**

### 2026-08 width revision

`--measure` was widened ~30% to `44.2rem` (from `34rem`) — pages read as
too narrow in practice, and the article-list thumbnails added alongside
this change (§6b) need horizontal room next to the title/excerpt text
that the original measure didn't leave. This pushes the reading column
to roughly **84 characters per line**, past the 62–66ch target and the
80-character WCAG ceiling this document originally argued for (§1). That
trade-off is deliberate and overrides the earlier reasoning rather than
extending it — flagged here rather than silently edited into §1's
rationale, since the two now disagree on purpose. All downstream
geometry (series-sidebar breakpoint, §7 below) is derived from
`--measure` and shifts automatically with it.

```css
--gutter: var(--space-6); /* 1.5rem; --space-5 (1.25rem) below 480px */

main {
  width: min(100% - 2 * var(--gutter), var(--measure));
  margin-inline: auto;
  padding: var(--space-12) 0 var(--space-16);
}
```

The gutter is a token (`--gutter`) rather than a fixed value, so the
480px breakpoint can shrink it without duplicating the width formula. It
is built into the width calculation rather than applied as body padding,
so the column never touches the viewport edge on small screens.

### Vertical rhythm

Spacing scale, 4px base:

| Token | Value |
|---|---|
| `--space-1` | 0.25rem |
| `--space-2` | 0.5rem |
| `--space-3` | 0.75rem |
| `--space-4` | 1rem |
| `--space-5` | 1.25rem |
| `--space-6` | 1.5rem |
| `--space-7` | 1.75rem |
| `--space-8` | 2rem |
| `--space-12` | 3rem |
| `--space-16` | 4rem |
| `--space-18` | 4.5rem |

Rule: **space above a section heading should be roughly three times the
space below it.** This is what makes sections findable without rules or
colour — the eye reads the gap, not a border. As implemented, this ratio
is two named tokens rather than a rule applied ad hoc at each heading:

```css
--section-gap: var(--space-18);        /* 4.5rem above a section heading */
--section-gap-after: var(--space-6);   /* 1.5rem below it */
```

`--section-gap` drops to `--space-12` (3rem) below the 480px breakpoint,
keeping the same roughly-3:1 ratio at a scale that fits a small screen.

---

## 5. Colour

Three tones plus pure white for input surfaces. No accent colour.

| Token | Value | Use | Contrast on background |
|---|---|---|---|
| `--text` | `#1a1a1a` | Body text, headings | ~16:1 — AAA |
| `--muted` | `#6b6b6b` | Metadata, captions, secondary | ~5.2:1 — AA |
| `--rule` | `#e5e5e5` | Hairlines, borders | Non-text |
| `--bg` | `#fdfdfc` | Page background | — |
| `--surface` | `#ffffff` | Input fields, select | — |
| `--mark` | `#f4ecc8` | Search-result match highlight | Paired with underline, never colour alone |

The background is warm off-white rather than `#fff`: it reduces glare
over a 30-minute session, and makes pure-white input surfaces read as
distinct without a heavy border.

No accent colour. Links are distinguished by underline, not hue:

```css
a {
  color: inherit;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.15em;
  text-decoration-color: var(--muted);
}
a:hover { text-decoration-color: var(--text); }
```

### Dark mode

Implemented as more than the "optional, automatic-only" version first
scoped here: the site has a three-state manual toggle (auto / light /
dark) in the header, in addition to following `prefers-color-scheme` when
the reader hasn't overridden it. "Auto" is the *absence* of a
`data-theme` attribute on `<html>`, so the system preference keeps working
even with JavaScript disabled; a small inline script sets `data-theme`
before first paint so there's no flash of the wrong palette.

| Token | Value |
|---|---|
| `--text` | `#e6e3dd` |
| `--muted` | `#9b968d` |
| `--rule` | `#33312e` |
| `--bg` | `#1b1a18` |
| `--surface` | `#232120` |
| `--mark` | `#443c22` |

Caveat specific to serifs: light-on-dark makes thin strokes bloom
(halation), so **step the body weight down** in dark mode. Implemented as
a palette-level token rather than a one-off dark-mode rule, so it follows
whichever theme is active and headings/`strong`/`b` can opt back out
explicitly:

```css
--prose-wght: normal;              /* light mode: nothing to correct */
--prose-wght: "wght" 380;          /* dark mode: steps the body down from 400 */
```

The toggle itself: a button cycling auto → light → dark, showing a
distinct glyph *and* a word for the current state (never colour alone),
with the accessible label hidden below the 480px breakpoint where only
the icon fits.

---

## 6. Section treatments

The article template has six sections with different reading modes (a
References section was added after this document's first draft, which
described five). They must be distinguishable without boxes or colour.

**Section headings** (`## Grammar Spotlight`, `## Key Vocabulary`, …), as
implemented:

```css
.article-body h2 {
  font-family: var(--font-sans);
  font-size: var(--text-section);
  font-weight: 600;
  line-height: var(--leading-ui);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  margin-block: var(--section-gap) var(--section-gap-after);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--rule);
  hyphens: none;
  text-wrap: balance;
}
```

Small, grey, and sans — signposts rather than competitors to the prose.
(The values differ slightly from this document's first draft —
`--text-section` instead of `--text-sm`, the named `--section-gap`/
`--section-gap-after` tokens instead of literal `--space-12`/`--space-4`
— see §3 and §4 for why.)

**Grammar Spotlight** — the example pairs are the important part. Set
direct/reported pairs as a list with the target structure in medium
weight (not bold, not colour); let the arrow carry the transformation.

**The reading section** — plain prose at `--text-body`. Paragraph spacing
`--space-7` (1.75rem), no first-line indent, no drop caps.

Its heading is the article's own title, never the generic word "Article"
(the rule lives in PROJECT-PLAN.md). Two consequences for this document:
the heading is real content rather than a label, so it must survive
translation to any future layout; and because section classes are derived
from heading text (§11), this is the one section whose class differs from
article to article — so it can never be styled through a fixed
`.section-article` selector.

**Key Vocabulary** — term in serif semibold, definition roman at
`--text-base`, example sentence italic and `--muted`. Slightly tighter
line height than the article, since it is scanned.

**Discussion Questions** — numbered list, `--space-3` between items,
more than default; each question should read as a separate unit because
they are used one at a time during class.

**Quick Recap** — `--text-base`, `--muted`, with a left hairline rule and
padding rather than a background tint. Signals "summary" without adding a
coloured box.

**References** — added to the required section list after this document
was first written, and **has no dedicated treatment yet.** It inherits the
same base rules as any other section (`.article-body ul/li`, the shared
`h2` treatment above) rather than a bespoke style like Key Vocabulary or
Quick Recap. Given its content is just a link list, the base styling is
plausibly sufficient — but this is a gap against the rest of this section,
not a considered decision, and worth a real pass if References ends up
needing to look different (e.g. numbered citations, smaller type since
it's reference material rather than content to teach from).

---

## 6a. Cover images

Optional per article (`cover_image`, `cover_image_alt`,
`cover_image_credit` front matter — see the `english-learning-cover-image`
skill for sourcing). When present:

- Renders full-width at the top of the article, above the `<h1>`, capped
  to the same `--measure` column as the rest of the page — no bleed to
  the viewport edge, consistent with §4's "no ornament" principle.
- `aspect-ratio: 16 / 9` with `object-fit: cover`, so mixed source image
  dimensions from Wikimedia Commons don't cause layout jumps between
  articles.
- No border, shadow, or rounded corners — a plain rectangle, matching the
  no-ornament rule in §1.
- Credit caption directly beneath the image: `--text-xs`, `--muted`,
  sans-serif, same visual register as the article metadata row. Not
  bold, not a link unless the source URL is worth surfacing.
- Skipped entirely (no placeholder, no empty space) on articles without a
  `cover_image` field — this is additive, not a required layout element.

---

## 6b. Article-list thumbnails

Cover images (§6a) also appear as a thumbnail on article-list entries —
the homepage's full list and the search page's results — via the shared
`app/article-summary.js` component (`<ArticleSummary>`), used by both
pages so this layout exists in exactly one place.

- Fixed-width column (`9rem`, `4:3`, `object-fit: cover`) to the left of
  the title/excerpt/meta text, so every row's text starts at the same
  x-position regardless of the source photo's aspect ratio.
- Additive, not a reserved slot: entries with no `cover_image` render as
  a plain single-column row, same as before thumbnails existed — no
  placeholder box, no reserved gap.
- Below 480px (the site's one mobile breakpoint, §9) the thumbnail moves
  above the text instead of shrinking further, at `16:9` full width.
- Same plain-`<img>` reasoning as §6a: no `next/image`, since the
  static export doesn't run its optimizer.

**Getting the thumbnail into search results.** Pagefind builds its
index from the static HTML at build time, so search results can't read
`content/*.md` front matter directly at request time — only whatever
was captured into the page as indexable meta. The article page exposes
`cover_image`/`cover_image_alt` via Pagefind's attribute-value meta
syntax directly on the `<img>` element:

```jsx
<img
  src={article.cover_image}
  alt={article.cover_image_alt ?? ""}
  data-pagefind-meta="cover_image[src], cover_image_alt[alt]"
/>
```

`key[attr]` pulls the value straight from that element's own attribute
rather than requiring a literal string — Pagefind's built-in mechanism
for exactly this case. The credit caption (`.cover-credit`) keeps its
own `data-pagefind-ignore` so it stays out of the search index/excerpts,
but that tag moved off the wrapper `<div>` onto just the caption — it
was blocking meta capture on the image when it sat on a shared ancestor.

---

## 7. Series navigation

Added after this document's first draft, alongside the homepage's Series
section and the article page's sidebar. Two places:

**Homepage — `.section-label` + `.series-list`.** A "Series" block sits
above the full article list, using the same small/grey/sans signpost
language as in-article section headings (`.section-label`: `--text-sm`,
uppercase, `--muted`, hairline underneath) so the two vocabularies read as
one system. Each series is one entry — title linking to its
`series_order: 1` article, then (if a `description` is registered for
that series in `site/content/series.json` — see `PROJECT-PLAN.md`
"Series") the throughline sentence(s) as a `.series-description`
paragraph — same register as an article-list excerpt, `--muted`,
reading content rather than chrome — then the `.meta` line ("3 articles
· philosophy") reusing the existing metadata styling rather than
inventing a new one. The
sidebar (below) deliberately does *not* repeat the description: it's
compact per-article navigation, not a second place to read the series
pitch, and the reader has already seen it once on the homepage to get
there.

**Article page — `.series-nav` sidebar.** Only rendered when the article
has a `series` field. Two states:

- **Below 1280px (default/stacked):** a plain block above the article —
  the first thing on the page, not a persistent sidebar — with a small
  uppercase "Series" label, the series title, and an ordered list of
  every article in the series. The current article is bold
  (`.series-nav-current`) rather than coloured, consistent with §10's
  "never signal state by colour alone."
- **From 1280px:** a true two-column layout, sidebar to the left,
  `position: sticky` so it tracks the scroll during a long article. The
  threshold is deliberately higher than the 480px breakpoint used
  everywhere else on the site — see below for why. (Was 1100px before
  the §4 measure widening; the number moved with it.)

**Keeping the article centred.** The article must stay centred on the
page exactly as on any page without a sidebar — the sidebar cannot be
allowed to pull it off-centre. The implementation gives the sidebar a
mirror-image, invisible spacer of the same width on the article's other
side (an empty `::after`), so the row reads `[sidebar] [article]
[spacer]`: symmetric around the article, so the article's centre stays
equal to the page's centre. `main:has(.series-layout)` widens just that
page's centred column to fit the full symmetric row — every other page
keeps the plain single-column width from §4.

**Why 1280px.** The full row — sidebar (13rem) + gap + `--measure`
(44.2rem) + gap + spacer (13rem) — is 74.2rem (~1187px). Below roughly
that viewport width plus the outer gutters, there's nowhere to put a
13rem sidebar without either narrowing the article's measure (against
§4's rule that the measure is retuned deliberately, not squeezed by
circumstance) or crowding the viewport edge. 1280px keeps a small buffer
above the mathematical minimum, the same role 1100px played against the
original 34rem measure (64rem/~1024px row) before §4's 2026-08 revision.

---

## 8. Micro-typography

The details that separate "sober" from "plain".

```css
.article-body {
  hyphens: auto;              /* narrow measure needs it */
  text-wrap: pretty;          /* avoids single-word last lines */
  font-optical-sizing: auto;  /* Source Serif 4 / Literata opsz axis */
  font-kerning: normal;
}

h1, h2, .article-list h2 {
  text-wrap: balance;         /* even multi-line headings */
}
```

`hyphens: auto` requires `lang="en"` on `<html>` — already present.

Do **not** apply `-webkit-font-smoothing: antialiased`. It thins serif
strokes on macOS and makes body text look weaker than intended.

Numerals: metadata dates sit in sans-serif and should use lining figures
(the default). If a date appears inside prose, switch that instance to
`font-variant-numeric: oldstyle-nums` so it sits on the baseline with
lowercase text.

---

## 9. Responsive behaviour

Two breakpoints, not the single one first specified here — the second was
added for the series sidebar (§7), which needs real width to sit beside
the article rather than above it.

**480px** — the original breakpoint. A one-column reading layout needs no
more for everything except the series sidebar.

| Property | ≤480px | >480px |
|---|---|---|
| Body size | 1.0625rem / 17px | 1.125rem / 18px |
| Gutter | 1.25rem (`--space-5`) | 1.5rem (`--space-6`) |
| Section heading margin-top (`--section-gap`) | `--space-12` | `--space-18` |
| Header search/theme controls | Icon only, 44px hit area | Icon + label |
| Search filters | Full-width, stacked | Inline, wrapping |

(Page title uses the fluid `--text-title` clamp from §3 rather than a
hard breakpoint jump.)

**1280px** — added for the series sidebar only (§7); was 1100px before
the §4 measure widening moved the threshold. Below it, a series
article's sidebar is a stacked block above the article; from it, sidebar
and article sit side by side with the article still centred on the page.
No other page or element responds to this breakpoint.

Slightly smaller body text on mobile is deliberate: the measure is
constrained by viewport width there, so reducing size keeps characters
per line inside the target band.

---

## 10. Print

Worth specifying — these pages are used live in class and may be printed.

```css
@media print {
  .site-header, .site-footer, .back, .search, .series-nav {
    display: none;
  }
  body { background: #fff; color: #000; font-size: 11pt; }
  main { width: auto; max-width: none; padding: 0; }
  .series-layout { display: block; }
  h2 { break-after: avoid; }
  li, p { break-inside: avoid; }
}
```

`.series-nav` is hidden in print (it's navigation, not content — the same
reasoning as `.back`), and `.series-layout` drops back to a plain block so
the article prints as a normal single column even on a series page.

---

## 11. Accessibility

- Body and muted text both clear WCAG AA (4.5:1); body text clears AAA.
- Never remove focus outlines. Use `:focus-visible` with a 2px outline in
  `--text` and a 2px offset.
- Select and input controls need a **44px minimum touch target** — the
  current filter dropdowns are shorter than that on mobile.
- Never signal state by colour alone.
- Respect `prefers-reduced-motion`; there should be no motion here
  regardless.

---

## 12. Implementation notes

**Files affected** (as originally scoped, before the series feature — see
the row below for what §7 additionally touched)

| File | Change |
|---|---|
| `app/layout.js` | Load fonts via `next/font`, expose as CSS variables |
| `app/globals.css` | Replace ad-hoc values with the token set above |
| `app/articles/[slug]/page.js` | Section wrappers (see below) |
| `lib/articles.js` | Markdown → HTML step needs section hooks |

**Additionally touched for series navigation (§7):** `app/page.js` (the
homepage Series section), `app/search/search-client.js` (`series` added
as a filter), and further additions to `app/globals.css` and
`app/articles/[slug]/page.js` beyond the section-wrapper work below.

**Additionally touched for cover images (§6a):** `app/articles/[slug]/page.js`
(renders `cover_image`/`cover_image_alt`/`cover_image_credit` above the
header, conditional on the field existing) and `app/globals.css` (the
`.cover-image`/`.cover-credit` rules from §6a). Files live in
`public/images/covers/` — see the `english-learning-cover-image` skill.

**The one real obstacle, as originally framed:** the markdown pipeline
would otherwise emit a flat sequence of `<h2>` and `<p>` elements, with no
way to style "Key Vocabulary" differently from "Discussion Questions" —
CSS cannot target a section by its heading text.

**As implemented** (`lib/articles.js`, `splitSections`): rather than a
remark/rehype plugin wrapping headings inside one continuous parse, the
raw markdown is split into per-heading chunks *before* parsing — each `##`
line starts a new chunk, and each chunk's body is then run through
`remark().use(html)` independently. The page then wraps each chunk in
`<section class="section-{name}">`, giving the same
`.section-grammar-spotlight`, `.section-key-vocabulary`, etc. classes the
original plan called for, with no change to how articles are written.
Fenced code blocks are tracked separately so a `##`-looking line inside
one isn't mistaken for a real heading. Styling by `:nth-of-type()` would
have worked today but would have broken the moment an article omits or
reorders a section — this is why that approach was avoided.

Derive the slug from the heading text **before any colon**, so that
`## Grammar Spotlight: Reported Speech` stays `.section-grammar-spotlight`
whatever grammar point an article happens to cover.

The five fixed sections (Grammar Spotlight, Key Vocabulary, Discussion
Questions, Quick Recap, References) are therefore addressable by class.
The reading section is not: its heading is the article's own title (§6),
so its class is different on every page. Anything that section needs must
come from the defaults on `.article-body`, never from a `.section-*`
selector.

**Suggested order**

1. Tokens and fonts — mechanical, low risk, immediately visible.
2. Measure and vertical rhythm — verify character count on a real
   paragraph before moving on.
3. Section wrappers plus per-section treatments.
4. Dark mode and print — both additive, safe to defer.

---

## Sources

- [craigmod.com](https://craigmod.com/) — reference site
- [Components: Font — Next.js](https://nextjs.org/docs/app/api-reference/components/font)
- [Literata — googlefonts/literata](https://github.com/googlefonts/literata)
- [Best Fonts for Reading — Fontfabric](https://www.fontfabric.com/blog/best-fonts-for-reading/)
- [Optimal Line Length for Readability — UXPin](https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/)
- [Readability: The Optimal Line Length — Baymard](https://baymard.com/blog/line-length-readability)
- [Typography Best Practices: The Ultimate 2026 Guide — Adoc Studio](https://www.adoc-studio.app/blog/typography-guide)
- [Top 10 Minimalist Web Design Trends For 2026 — Digital Silk](https://www.digitalsilk.com/web-design/web-trends/minimalist-web-design-trends/)
