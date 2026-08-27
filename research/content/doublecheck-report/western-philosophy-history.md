# What Knowledge Rests On — doublecheck report

Fact-check over
[`../decisions/western-philosophy-history.md`](../decisions/western-philosophy-history.md)
and the six articles. **Temporary** — delete when the series ships.
Every correction below is written back into `decisions/`, and into the
articles where it reached them.

Second pass, 2026-08-26. **The first pass was unsound and this replaces
it.** It reported a table of unbroken "Verified" lines naming SEP
entries whose text had never been retrieved — only search-engine
summaries of them. This pass fetched the full text of the SEP entries
and searched them. Three of the first pass's "verified" claims did not
survive that.

## Method, and its limits

Retrieved in full and searched: SEP *Aristotle's Metaphysics*, *Form vs.
Matter*, *Substance*, *Aristotle*, *Plato's Middle Period Metaphysics
and Epistemology*. Britannica *Aristotle* returned navigation and Quick
Facts only — its body text did not come through, so only the Quick Facts
(birth 384 BCE, death 322) are used from it.

**Not retrieved in full**, and therefore claims resting on them are
marked below rather than called verified: SEP *Socrates*, IEP
*Socrates*, SEP *Descartes' Method*, SEP *Descartes' Epistemology*, IEP
*Descartes*, SEP *Immanuel Kant*, SEP *Nietzsche*, Britannica *Cogito,
ergo sum*, and the two Nietzsche-on-Kant papers.

## Verified against retrieved source text

| Claim | What confirmed it |
|---|---|
| "At the heart of the Socratic elenchus is the 'What is *X*' question" | SEP *Plato's Middle Period Metaphysics* — verbatim |
| Elenctic inquiry shows interlocutors hold an inconsistent set of beliefs about the virtues | SEP, same entry |
| Failed definitions imply conditions on an adequate answer; a definition picks out the essence (*ousia*) | SEP, same entry |
| Plato's break with Socrates is over whether the essence is *in* the sensibles (Socrates: immanent universal) | SEP, same entry — this is the article-1→2 hinge, and it holds |
| Sun, Line and Cave are a single connected treatment | SEP, same entry (§13 heading) |
| Hylomorphism: "every physical object is a compound of matter and form" | SEP *Form vs. Matter* — verbatim |
| Aristotle sent to Athens ~age 17 to study at Plato's Academy; remained until Plato's death in 347 | SEP *Aristotle* (biography) — verbatim |
| Aristotle born 384 BCE, died 322 | Britannica *Aristotle*, Quick Facts |
| Whether principles of being can be both universal and separate is the live issue; Aristotle denies it | SEP *Aristotle's Metaphysics* |

## Could not confirm

- **The Third Man Argument is not in any cited SEP entry.** Searched all
  of *Aristotle's Metaphysics*, *Form vs. Matter*, *Substance*,
  *Aristotle*, *Plato's Middle Period Metaphysics* — no occurrence. The
  argument is standard and uncontroversial (Plato, *Parmenides* 132a-b),
  so the article's use of it is not in doubt; the **citation** was
  wrong. Recorded in `decisions/` with a pointer to SEP's *Plato's
  Parmenides* if a citation is ever needed.
- **"About twenty years" at the Academy is derived, not stated.** It
  follows by arithmetic from SEP's "about the age of seventeen" plus
  birth 384 and Plato's death 347. Sound, but no source states the
  figure. The hedge stays.
- **Descartes' "we reject all merely probable cognition…"** — SEP
  presents it as Descartes' own words, but SEP's text was not retrieved
  this pass and the primary (*Rules for the Direction of the Mind*) was
  not consulted. The article renders it as reported speech rather than
  inside quotation marks, which is the right confidence level.
- **Claims resting on the un-retrieved sources listed above** — the
  Delphi episode, 399 BC, the *Meditations*/*Discourse* dating, the
  Copernican inversion, "God is dead" in *The Gay Science* (1882) — are
  consistent across multiple secondary summaries and none is contentious,
  but none was checked against retrieved text this pass. They are not
  marked verified.

## Corrections made this pass

**1. Three phrasings falsely attributed to SEP — removed from
`decisions/`.** The file carried "a bastard confusion of universal and
particular", "eager to distance himself", and forms "enmeshed in
matter", each presented as SEP's wording. None appears in any of the
three SEP entries cited. They came from search summaries and were
recorded as though quoted. **Checked against the articles: none of the
three reached any article** — the Aristotle article paraphrases the
objection in its own words and is unaffected. Confined to `decisions/`,
now restated in verified form.

**2. A fabricated citation — removed.** The first report cited "SEP
*Aristotle's Metaphysics* (biography section)" for the Academy dates.
That entry has no biography section and contains none of those dates.
Replaced with SEP's *Aristotle* entry, which does. This was the first
pass inventing a source while purporting to check sources.

**3. Plato's death date — corrected in `decisions/` and in the
article.** The draft said flatly "his death in 348". SEP says 347.
Both circulate because the Athenian year straddles them; the
conventional form is 348/347 BC. `2026-08-26-the-second-world-behind-this-one.md`
now reads "348/347", and `decisions/` records *why*, so a later pass
does not flip it back to a single year.

## Carried over from the first pass (still stands)

These were real findings and their fixes remain correct:

- **Kant misquote.** "It was my recollection of David Hume that broke
  into my dogmatic slumber" was in quotation marks; no published
  translation reads that way (*interrupted*, not "broke into"; and
  translators split over *Erinnerung*). Now reported, not quoted, and
  the *Prolegomena* is named.
- **Nietzsche misattribution.** "what he called escapist,
  pain-relieving, heavenly otherworlds" — that phrasing is SEP's, not
  Nietzsche's. "What he called" made an encyclopedia's summary into a
  quotation from the subject. Rewritten.
- **Grammar collision.** Article 2 used nominalisation, which "Brazil,
  From Above" took on `main` for
  `2026-08-13-who-actually-ended-slavery.md`. Reassigned to articles
  with abstract and generic nouns.

## Consistency across articles

- **Body vs Quick Recap**, all six: no contradictions, and no hedge
  dropped in compression. The two genuinely uncertain points — the
  Socratic problem, and which Hume argument woke Kant — keep their
  hedge in the recap as well as the body.
- **Shared facts across articles:** the twenty years at the Academy
  appears in articles 2 and 3 and agrees in both, and both hedge it.
- **Forward links** 1→2, 2→3, 3→4, 4→5, 5→6 are each stated in the
  earlier article and picked up in the later one. The 2→3 hinge is now
  independently confirmed by SEP: Plato's departure from Socrates really
  is about whether the essence is immanent in sensibles.
- **Against Care needed:** the Aristotle→Descartes gap is named rather
  than smoothed; Hume appears only as Kant's trigger; "God is dead" is
  not triumphalism; will to power is explicitly not a political
  doctrine; Aristotle is not made a modern empiricist.
- **Structure** (scripted): six articles, `series_order` 1-6, five fixed
  headings each, reading-section title distinct from front-matter title,
  4-5 vocabulary terms, 3-4 questions, 2+ references, reading sections
  356-429 words against a ~500 ceiling, no grammar point colliding with
  the 17 now in the corpus.
