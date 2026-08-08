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
| `--text-2xs` | 0.75rem / 12px | Uppercase micro-labels (filter names) |
| `--text-xs` | 0.8125rem / 13px | Article metadata row, footer |
| `--text-sm` | 0.875rem / 14px | Interface text, buttons, nav |
| `--text-base` | 1rem / 16px | Secondary prose, vocabulary definitions |
| `--text-body` | 1.125rem / 18px | **Article body** |
| `--text-lg` | 1.375rem / 22px | Index item titles |
| `--text-xl` | 1.75rem / 28px | Page title (mobile) |
| `--text-2xl` | 2rem / 32px | Page title (desktop) |

Fluid page title, avoiding a hard jump at the breakpoint:

```css
font-size: clamp(1.75rem, 1.5rem + 1.2vw, 2rem);
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

The single highest-impact setting. Target **62–66 characters per line**.

```css
--measure: 34rem;  /* ≈ 62ch at 18px Source Serif 4 */
```

Specify in `rem` for stable layout, but **verify empirically**: render a
real paragraph and count characters on a full line. The `ch` unit
measures the digit zero, wider than the average lowercase letter, so a
`62ch` container yields roughly 66–70 actual characters.

**Retune whenever the typeface changes.**

```css
main {
  width: min(100% - 3rem, var(--measure));
  margin-inline: auto;
}
```

The gutter is built into the width calculation rather than applied as
body padding, so the column never touches the viewport edge on small
screens.

### Vertical rhythm

Spacing scale, 4px base:

| Token | Value |
|---|---|
| `--space-1` | 0.25rem |
| `--space-2` | 0.5rem |
| `--space-3` | 0.75rem |
| `--space-4` | 1rem |
| `--space-6` | 1.5rem |
| `--space-8` | 2rem |
| `--space-12` | 3rem |
| `--space-16` | 4rem |

Rule: **space above a section heading should be roughly three times the
space below it.** This is what makes sections findable without rules or
colour — the eye reads the gap, not a border.

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

### Dark mode (optional, via `prefers-color-scheme`)

| Token | Value |
|---|---|
| `--text` | `#e6e3dd` |
| `--muted` | `#9b968d` |
| `--rule` | `#33312e` |
| `--bg` | `#1b1a18` |
| `--surface` | `#232120` |

Caveat specific to serifs: light-on-dark makes thin strokes bloom
(halation), so **step the body weight down** in dark mode — with a
variable font, `font-variation-settings: "wght" 380` instead of 400.

---

## 6. Section treatments

The article template has five sections with different reading modes.
They must be distinguishable without boxes or colour.

**Section headings** (`## Grammar Spotlight`, `## Article`, …)

```css
font-family: var(--font-sans);
font-size: var(--text-sm);
font-weight: 600;
letter-spacing: 0.06em;
text-transform: uppercase;
color: var(--muted);
margin-block: var(--space-12) var(--space-4);
padding-bottom: var(--space-2);
border-bottom: 1px solid var(--rule);
```

Small, grey, and sans — signposts rather than competitors to the prose.

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

---

## 7. Micro-typography

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

## 8. Responsive behaviour

Single breakpoint at **480px**. A one-column reading layout needs no more.

| Property | ≤480px | >480px |
|---|---|---|
| Body size | 1.0625rem / 17px | 1.125rem / 18px |
| Page title | 1.75rem | 2rem (fluid) |
| Gutter | 1.25rem | 1.5rem |
| Section heading margin-top | `--space-8` | `--space-12` |
| Search filters | Full-width, stacked | Inline, wrapping |

Slightly smaller body text on mobile is deliberate: the measure is
constrained by viewport width there, so reducing size keeps characters
per line inside the target band.

---

## 9. Print

Worth specifying — these pages are used live in class and may be printed.

```css
@media print {
  .site-header, .site-footer, .back, .search { display: none; }
  body { background: #fff; color: #000; font-size: 11pt; }
  main { width: auto; max-width: none; }
  h2 { break-after: avoid; }
  li, p { break-inside: avoid; }
}
```

---

## 10. Accessibility

- Body and muted text both clear WCAG AA (4.5:1); body text clears AAA.
- Never remove focus outlines. Use `:focus-visible` with a 2px outline in
  `--text` and a 2px offset.
- Select and input controls need a **44px minimum touch target** — the
  current filter dropdowns are shorter than that on mobile.
- Never signal state by colour alone.
- Respect `prefers-reduced-motion`; there should be no motion here
  regardless.

---

## 11. Implementation notes

**Files affected**

| File | Change |
|---|---|
| `app/layout.js` | Load fonts via `next/font`, expose as CSS variables |
| `app/globals.css` | Replace ad-hoc values with the token set above |
| `app/articles/[slug]/page.js` | Section wrappers (see below) |
| `lib/articles.js` | Markdown → HTML step needs section hooks |

**The one real obstacle:** the markdown pipeline currently emits a flat
sequence of `<h2>` and `<p>` elements, so there is no way to style
"Key Vocabulary" differently from "Discussion Questions" — CSS cannot
target a section by its heading text.

Recommended fix: add a small remark/rehype step that wraps each `##`
section in `<section class="section-{slug}">`, deriving the slug from the
heading. That yields `.section-grammar-spotlight`,
`.section-key-vocabulary`, and so on, with no change to how articles are
written. Styling by `:nth-of-type()` would work today but breaks the
moment an article omits or reorders a section.

Derive the slug from the heading text **before any colon**, so that
`## Grammar Spotlight: Reported Speech` stays `.section-grammar-spotlight`
whatever grammar point an article happens to cover.

The four fixed sections are therefore addressable by class. The reading
section is not: its heading is the article's own title (§6), so its class
is different on every page. Anything that section needs must come from the
defaults on `.article-body`, never from a `.section-*` selector.

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
