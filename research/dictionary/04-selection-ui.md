# 04 — Selection-based lookup: UI, lemmatization, audio, IPA

> **The interaction you chose:** the reader *selects* a word (or phrase) in the article, and can then check it in the dictionary.

This is a better choice than per-word click targets, and it happens to fit this codebase unusually well. This doc covers how it should behave and the four data problems behind it.

---

## 1. Why selection beats per-word click targets — here specifically

`site/app/articles/[slug]/page.js` injects each section's HTML with `dangerouslySetInnerHTML`. That means the article body is **opaque to React** — you can't attach a React handler to individual words without either wrapping every word in a `<span>` at build time or walking and mutating the DOM after hydration.

Selection sidesteps the whole problem:

| | Per-word click targets | **Selection-based** |
|---|---|---|
| DOM changes | Every word wrapped in `<span>` — bloats HTML, pollutes Pagefind, risks breaking `<em>`/`<strong>`/links that span words | **None** |
| Markdown pipeline | Needs a remark/rehype plugin in `lib/articles.js` | **Untouched** |
| Multiword lookup | Awkward — "carbon footprint" is two targets | **Natural — just select both words** |
| Reading feel | Text looks like a wall of links | Invisible until used |
| Implementation | Build-time plugin + runtime handler | One listener on `.article-body` |

Selection also matches how a B2–C1 learner actually reads: they're not clicking every unfamiliar word, they're pausing on one phrase that broke comprehension.

---

## 2. Interaction design

### Trigger

Listen once on the article container, not per word:

```js
// Client Component, mounted around .article-body
useEffect(() => {
  const onSelect = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) return hide();
    // ...validate, position, look up
  };
  document.addEventListener("selectionchange", onSelect);
  return () => document.removeEventListener("selectionchange", onSelect);
}, []);
```

**Debounce it.** `selectionchange` fires continuously while dragging. Wait ~200 ms after it stops, or trigger on `mouseup` / `touchend` instead, so you don't look up every intermediate substring.

### What counts as a lookup-able selection

Reject early and silently — a popover appearing on every stray drag is worse than no feature:

- Empty, or whitespace only
- Longer than ~4 words (they're selecting to copy, not to define)
- Contains a newline (crossed a paragraph — almost certainly a copy)
- Not inside `.article-body` (ignore nav, series sidebar, cover credit, footer)
- Inside `<code>`, `<pre>`, or a heading
- No letters (pure punctuation or digits)

### Affordance — two-step, decided

| Approach | Behaviour | Trade-off |
|---|---|---|
| Immediate popover | Selection resolves → definition appears | Fastest. Can feel intrusive; fires on copy-paste |
| **✅ Small "Define" button, then panel** | A compact button appears near the selection; the definition shows on activation | One extra tap, but no surprise UI and no false positives when copying |

**Decided 2026-08-11.** The two-step version also gives a clean place to put "no entry found" without flashing a failure panel at someone who was only copying a quote.

---

## 2a. The decided interaction spec

Everything below was agreed on 2026-08-11 and supersedes the earlier proposals in [`research-considerations.md`](research-considerations.md). Written as a spec so it can be implemented directly.

### Panel, not popover — on every device

A **full-width panel**, pinned to the **opposite half of the viewport from the selection**: selection in the top half → panel at the bottom, and vice versa. This is what Kindle and most readers converge on, because it guarantees the panel never covers the word being defined.

| Rule | Detail |
|---|---|
| **Hysteresis on the flip** | Latch the position when the panel opens; only re-evaluate on a *new* selection. Or use a dead zone — flip only past 40%/60%, never a hard midline. Without this, adjusting a selection near the middle makes the panel jump top-to-bottom |
| **Measure with `visualViewport`** | Not `window.innerHeight`. On iOS Safari the URL bar and the native selection callout both change the usable area |
| **Expect the native menu** | iOS and Android show their own Copy / Look Up / Share callout over the selection. The panel sits away from the selection, so it doesn't collide — but the **Define button** can. Test on a real device |
| **Desktop too** | Same panel, same logic. One behaviour to learn, one code path to maintain |

### "Define" button placement

Anchor to the **end point of the selection**. Flip horizontally only when within ~80 px of the viewport edge, then clamp to the viewport.

Horizontal flipping matters much less than vertical — a small button rarely covers meaningful text — so consistency beats optimal placement here.

### ✅ Focus: do not auto-focus the button

The original proposal was to auto-focus the Define button on appearance so a keyboard user could press Space or Enter. **The goal is right and worth solving** — keyboard selection via Shift+Arrow must lead somewhere, which most implementations get wrong. **Auto-focus is the wrong mechanism**, for three reasons:

1. **It may destroy the selection it's meant to act on.** Moving focus can collapse the document selection — [documented for text controls](https://bugzilla.mozilla.org/show_bug.cgi?id=336936), where focusing collapses the selection and clears others in the document. Whether a `<button>` behaves the same is **browser-specific and unverified** — no authoritative source found, and no browser available to test in during this research.
2. **It hijacks focus for mouse users.** Someone selecting with the mouse hasn't asked for focus to move. Once the button holds focus, Space stops scrolling the page — a classic and very irritating scroll-jack.
3. **Unrequested focus movement is itself an accessibility problem.** Screen-reader users get yanked to a control they didn't invoke, losing their reading position.

**The decided behaviour:**

| Input | Behaviour |
|---|---|
| Mouse / touch selection | Button appears. **No focus change.** Click or tap to define |
| Keyboard selection (Shift+Arrow) | Button appears, **focusable but not focused** — inserted next in tab order, so a single Tab reaches it |
| Any input | A **keyboard shortcut** defines the current selection with no pointer at all. `d` is the cheapest; use `Ctrl`/`Cmd`+`D` only if you're willing to override bookmark |
| Screen readers | `aria-live="polite"` announces availability — *"Definition available for 'ubiquitous'"* — without stealing focus |
| Panel opens | *Then* move focus into the panel, and trap it there. Focus moves on user action, which is correct |
| `Esc` | Closes the panel and returns focus to where it was |

The keyboard shortcut is what actually solves the accessibility case, and it's simpler and more robust than auto-focus.

### Implementation note that follows from all of this

**Capture the selected string the moment the selection settles, and work from that captured value** — never from a re-read of `window.getSelection()` at activation time. Between selection and activation the user may have tapped the button, dismissed a native menu, or triggered a focus change, any of which can collapse the live selection. Capturing once removes the entire class of bug, and makes the unverified button-focus behaviour in point 1 irrelevant either way.

### Popover content, in priority order for B2–C1

1. Headword + part of speech + IPA (RP and General American) + audio button
2. **Definition — one or two senses, never eight**
3. One example sentence
4. 2–3 synonyms at the same register
5. Attribution + link to the full source entry

⭐ **Where the word is in the article's `## Key Vocabulary`, show that gloss first**, visually distinguished ("From this article's vocabulary"). It's written for this reader about this text and beats any generic dictionary — see [`01-architecture-fit.md`](01-architecture-fit.md) §1d.

### Accessibility

- Selection-only interaction is **mouse/touch-biased**. Keyboard users select with Shift+arrows, which fires `selectionchange` — so it works, but verify it. Consider a keyboard shortcut for "define current selection".
- Popover needs `role="dialog"`, an accessible label, focus management, and `Esc` to dismiss.
- Audio button needs a text label, not just an icon.
- Never rely on hover.

### Fits the existing design system

`docs/STYLE-SPEC.md` ("Quiet Editorial") governs the visual language, and `app/theme-toggle.js` means there's a dark mode. The popover must use the existing CSS custom properties from `app/globals.css` rather than introducing its own palette.

---

## 3. Lemmatization — the piece that decides whether this feels broken

Readers select `mitigated`, `knives`, `farthest`, `commissioned`. Dictionary keys are `mitigate`, `knife`, `far`, `commission`. Without lemmatization, roughly **30–40% of selections in running text fail** — and a dictionary that fails a third of the time reads as broken, not as incomplete.

### Options

| Library | Approach | Notes |
|---|---|---|
| **[wink-lemmatizer](https://winkjs.org/wink-lemmatizer/)** | Rule-based + exception lists | Separate `noun()`, `verb()`, `adjective()`. `farthest → far`, `knives → knife`, `eaten → eat`. ⭐ Recommended |
| **[javascript-lemmatizer](https://github.com/takafumir/javascript-lemmatizer)** | WordNet exception files + morphy rules | Solid; depends on Underscore.js |
| **[compromise](https://github.com/spencermountain/compromise)** | Full NLP, POS tagging | ~250 KB — too heavy for the client, but fine at build time, and POS lets you pick the *right* sense |
| **WordNet `*.exc` files** | The irregular-forms map ships inside the WordNet distribution | Free if you're already parsing WordNet — no new dependency |

### ⭐ Recommended: resolve it at build time

Because lookup is scoped to article text, you know every word a reader can possibly select. So build a **surface-form → headword map** during the build:

```json
{ "mitigated": "mitigate", "knives": "knife", "commissioned": "commission" }
```

Generate it by running every article token through a lemmatizer once in the build script, plus emitting regular inflections (`-s`, `-es`, `-ed`, `-ing`, `-er`, `-est`) per headword. Runtime then does a single object lookup — no NLP library shipped to the browser, no latency.

Keep a tiny runtime suffix-stripper as a last-resort fallback for anything unseen.

### Also handle

- **Possessives** — `teacher's` → `teacher`
- **Hyphenation** — `well-known`; try the whole form, then the parts
- **Capitalisation** — sentence-initial words; try as-selected, then lowercased
- **Multiword expressions** — `carbon footprint`, `power hunger`. Try the full selection first, then the head word. Your articles are dense with these
- **Curly apostrophes** — markdown produces `’` not `'`. Normalise both

---

## 4. Pronunciation audio

WordNet has none. Best options, in order:

### a) Browser `speechSynthesis` — start here

```js
speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(word), {
  lang: "en-GB", rate: 0.85,
}));
```

Zero bytes, zero licence, works offline, covers **every** word. Synthetic quality, voice varies by OS. For Phase 1 this is the correct choice — it's free and complete.

### b) Wikimedia Commons recordings — the quality upgrade

~942,000 human recordings. Naming is `{lang}-{region}-{word}.ogg`, e.g. `en-us-schedule.ogg`, `en-uk-schedule.ogg`. **URLs can't be constructed blindly** — the Commons path includes an MD5-derived prefix. Get the real URLs from the Wiktextract data, which carries `ogg_url` / `mp3_url` per entry.

**This mirrors a solved problem in this repo.** `scripts/download-covers.mjs` already downloads external media, compresses it with `sharp`, and self-hosts the result — precisely because `output: "export"` doesn't run Next's optimizer (see `docs/cover-images.md`). Audio should follow the same pattern: a build script fetches recordings for article vocabulary only, transcodes to a compact format, and writes to `public/audio/`. A few thousand words is a manageable payload; the full 20.4 GB bulk archive is not.

### c) Merriam-Webster audio

Human-recorded, learner-appropriate, comes free with the Learner's Dictionary API — but only usable if you're already doing build-time M-W enrichment, and the logo requirement applies.

### ✗ d) Google `gstatic.com` audio

Reachable via dictionaryapi.dev. Undocumented CDN URLs for content you have no licence to. Don't.

---

## 5. IPA

| Source | Coverage | Notes |
|---|---|---|
| **freedictionaryapi.com / Wiktextract** | Excellent | Multiple accents, **explicitly tagged** — the live `ubiquitous` response returned 8 transcriptions across RP, General American, Canadian and General Australian |
| **CMU Pronouncing Dictionary** | ~134k words, US only | ARPAbet, needs conversion to IPA. Public domain, tiny, trivially embeddable |
| **WordNet** | None | — |

For a B2–C1 audience, **showing RP and General American side by side** is genuinely useful — learners consistently want to know which variety they're hearing. Wiktextract gives you this with accent labels already attached, at build time, for free.

---

## 6. Attribution

Whatever ships, the site needs a visible credit — a footer line or an "About the dictionary" page:

| If you use | Show |
|---|---|
| WordNet | Princeton copyright notice (required by the licence) |
| Wiktionary / kaikki / Wordset (CC BY-SA 4.0) | Attribution + link to source page; share-alike applies to the data |
| Open English WordNet (CC BY 4.0) | Attribution |
| freedictionaryapi.com | Visible credit + link back to the Wiktionary page (given in `source.url`) |
| Merriam-Webster | The M-W logo, per their brand guidelines |
| Wikimedia Commons audio | Per-file licence + author credit |

Mark the attribution block `data-pagefind-ignore` so it doesn't leak into search excerpts — consistent with how `.cover-credit` and `.meta` are already handled in `app/articles/[slug]/page.js`.

---

## 7. Explicitly out of scope

Per your decision, **saved words / lookup history / Anki export are not part of this**. Lookup is read-only. That removes the strongest argument for a backend — see [`01-architecture-fit.md`](01-architecture-fit.md) §4.

Noted only so it's clear it was considered and dropped deliberately, not overlooked. If it ever returns, `localStorage` covers it with no backend; only *cross-device sync* would force a server.

---

**Sources:** see [`08-sources.md`](08-sources.md).
