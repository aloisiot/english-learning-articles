# What Knowledge Rests On — doublecheck report

Fact-check over
[`../decisions/western-philosophy-history.md`](../decisions/western-philosophy-history.md)
and the six articles. **Temporary** — delete when the series ships.
Corrections are written back into `decisions/`, and into the articles
where they reached them.

Three passes. **Pass 1 was unsound**: it reported a table of "Verified"
lines naming SEP entries whose text had never been retrieved — only
search-engine summaries of them. Pass 2 retrieved the Plato and
Aristotle entries and found three of pass 1's claims false. Pass 3
(2026-08-26) retrieved the remaining entries. This report is the state
after pass 3.

## What was actually retrieved

**Full text retrieved and searched:** SEP *Socrates*, IEP *Socrates*,
SEP *Plato's Middle Period Metaphysics and Epistemology*, SEP
*Aristotle's Metaphysics*, SEP *Form vs. Matter*, SEP *Substance*, SEP
*Aristotle*, SEP *Descartes' Epistemology*, SEP *Descartes' Method*,
SEP *Immanuel Kant*, SEP *Nietzsche*.

**Not retrieved:** Britannica *Aristotle* and *Cogito, ergo sum*
(Britannica returns navigation chrome, not body text, through the fetch
tool — only Quick Facts came through); SEP *Plato's Shorter Ethical
Works*; IEP *Descartes*; IEP *Nietzsche*; the Anderson OUP volume
(publisher page only); the two papers on Nietzsche contra Kant. Claims
resting only on these are marked below, not called verified.

## Verified verbatim against retrieved text

| Claim | Source |
|---|---|
| Socrates 469–399 BCE; trial 399 | SEP *Socrates* |
| Delphi via Chaerephon, cited to *Apology* 20e–23b | SEP *Socrates* |
| Socrates "likening his work to midwifery" | SEP *Socrates* |
| "Because he wrote nothing, what we know… comes to us mainly from his contemporaries and disciples" | IEP *Socrates* |
| Socratic problem is a standing dispute — "There is, and always will be, a 'Socratic problem'" (Guthrie) | SEP *Socrates* |
| "At the heart of the Socratic elenchus is the 'What is *X*' question"; interlocutors hold "an inconsistent set of beliefs about the virtues" | SEP *Plato's Middle Period Metaphysics* |
| Plato's break with Socrates is over whether the essence is immanent in sensibles | same |
| Sun, Line and Cave treated as one connected argument | same (§13) |
| "Aristotle famously contends that every physical object is a compound of matter and form" | SEP *Form vs. Matter* |
| Aristotle sent to Athens ~age 17 to the Academy; stayed until Plato's death in 347 | SEP *Aristotle* |
| Aristotle born 384 BCE, died 322 | Britannica Quick Facts |
| Aristotelians "make room for what Descartes terms 'probable cognition'"; Descartes in Rule 2: "we reject all […] merely probable cognition and resolve to believe only what is perfectly known and incapable of being doubted" (AT 10:362, CSM 1:10) | SEP *Descartes' Method* |
| Descartes rejects Aristotelian definitions and syllogisms | same |
| *Meditations* 1641, 2nd ed. 1642; doubt is *universal* and *hyperbolic*; Evil Genius Doubt; the dream assumption; "to reach certainty – to cast aside the loose earth and sand so as to come upon rock or clay" (*Discourse* 3) | SEP *Descartes' Epistemology* |
| *Critique of Pure Reason* 1781, 2nd ed. 1787; understanding "supplies forms that structure our experience of the sensible world, to which human knowledge is limited" | SEP *Immanuel Kant* |
| *The Gay Science* 1882, expanded ed. 1887 | SEP *Nietzsche* |
| Will to power quoted from *The Antichrist*; replaces "Schopenhauer's will to life"; "a drive to overcome resistance" | SEP *Nietzsche* |

## Could not confirm

- **"Dogmatic slumber" is not in SEP's Kant entry.** Full text searched;
  no occurrence. The phrase is genuinely Kant's (*Prolegomena*) but the
  primary was not retrieved, and translations split over *Erinnerung*.
  The article reports rather than quotes it. The two-word phrase
  "dogmatic slumber" is retained in the summary and recap, which is safe
  — every translation uses those words.
- **The Third Man Argument is in none of the cited SEP entries.**
  Standard and uncontroversial (*Parmenides* 132a-b); the argument is
  fine, the citation was wrong. Recorded in `decisions/`.
- **"About twenty years" at the Academy is derived, not stated** — it
  follows from SEP's "about the age of seventeen", birth 384, and Plato's
  death 347. The hedge stays.
- **"God is dead", *perspectivism*, and the thing-in-itself critique**
  were not located in the searched portion of SEP *Nietzsche*, and the
  two Nietzsche-contra-Kant papers were not retrieved. Standard, but not
  verified here. A future pass should go to *The Gay Science* §125 and
  §108 directly.
- **The 1637/1641 split** (phrase coined in the *Discourse*, argument
  made in Meditation II) rests on Britannica at one remove. The 1641 and
  1637 dates themselves are independently confirmed.

## Corrections made

**Pass 3 — no article changes were required.** Every date and
attribution in the six articles matched the retrieved text: 1641, 1637,
1781, 1882 all confirmed; the Descartes quotation is rendered as
reported speech, which is correct given the original contains an
ellipsis ("we reject all […] merely probable cognition"); the Kant
passage reports rather than quotes. Pass 3's output is therefore an
upgrade in citation confidence in `decisions/`, plus the ellipsis note
and the "not in SEP" flags above.

**Pass 2 — three phrasings falsely attributed to SEP, removed from
`decisions/`:** "a bastard confusion of universal and particular",
"eager to distance himself", forms "enmeshed in matter". None appears in
any cited SEP entry; all came from search summaries recorded as though
quoted. **Checked against the articles: none had reached one.**

**Pass 2 — a fabricated citation, removed.** Pass 1 cited "SEP
*Aristotle's Metaphysics* (biography section)" for the Academy dates.
That entry has no biography section and none of those dates. Replaced
with SEP *Aristotle*.

**Pass 2 — Plato's death 348 → 348/347**, in `decisions/` and in
`2026-08-26-the-second-world-behind-this-one.md`, with the reason
recorded so a later pass does not flip it back.

**Pass 1 — still standing:** the Kant misquote ("broke into my dogmatic
slumber" — no translation reads that way), the Nietzsche misattribution
("what he called escapist, pain-relieving, heavenly otherworlds" is
SEP's phrasing, not Nietzsche's), and the nominalisation grammar
collision with `2026-08-13-who-actually-ended-slavery.md`.

## Consistency across articles

- **Body vs Quick Recap**, all six: no contradictions, no hedge dropped
  in compression. The genuinely uncertain points — the Socratic problem,
  and which Hume argument woke Kant — keep their hedge in both.
- **Shared facts:** the twenty years at the Academy appears in articles 2
  and 3, agrees, and is hedged in both.
- **Forward links** 1→2, 2→3, 3→4, 4→5, 5→6 each stated in the earlier
  article and picked up in the later one. The 2→3 hinge is independently
  confirmed by SEP: Plato's departure from Socrates really is about
  whether the essence is immanent in sensibles.
- **Against Care needed:** the Aristotle→Descartes gap is named, not
  smoothed; Hume appears only as Kant's trigger; "God is dead" is not
  triumphalism; will to power is explicitly not a political doctrine —
  and SEP's framing of it as a psychological drive confirms that is the
  right call; Aristotle is not made a modern empiricist.
- **Structure** (scripted): `series_order` 1-6, five fixed headings each,
  reading title distinct from front-matter title, 4-5 vocabulary terms,
  3-4 questions, 2+ references, reading sections 356-429 words against a
  ~500 ceiling, no grammar point colliding with the 17 in the corpus.
