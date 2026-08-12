# How AI Got Here — progress

Work queue for this series. **Delete this file once the series ships** —
see [`../README.md`](../README.md) for what "shipped" means.

Nothing here is worth keeping afterwards: statuses, logs and next-step
notes all go stale the moment the work is done, and a stale one makes a
finished series look unfinished. The reasoning that outlives the work is
in [`../decisions/how-ai-got-here.md`](../decisions/how-ai-got-here.md).

## Subjects

| #   | Subject                                                                                                              | Status      | Grammar focus                     | Sources |
| --- | -------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------- | ------- |
| 1   | The question before the machines — Turing's 1950 paper, the imitation game, Dartmouth 1956 and the naming of the field | drafted     | Modal perfect                     | See notes below |
| 2   | The AI winters — perceptron hype, Minsky & Papert, the Lighthill report, two collapses in funding                      | drafted     | Inversion for emphasis            | See notes below |
| 3   | Why it suddenly worked — data, compute and patience; AlexNet (2012), GPUs, the transformer paper (2017)                | drafted     | Phrasal verbs                     | See notes below |
| 4   | What it is actually good at — protein structure prediction, translation, accessibility tools                           | drafted     | Non-defining relative clauses     | See notes below |
| 5   | The bill that came later — the data-labelling workforce, training data and copyright, energy                           | drafted     | Concessive clauses                | See notes below |
| 6   | The part we still cannot check — hallucination, opacity, and evaluating systems by how convincing they sound           | drafted     | Hedging / modal verbs of probability | See notes below |

Status values: not started → researching → researched → approved →
drafted → published.

## Progress log

- 2026-08-12: Scouted six subjects and proposed the throughline. User
  approved the six-article arc, chose to accept overlap with the existing
  standalone AI-energy article, approved extending the grammar rotation,
  and raised the target article length to up to 500 words.
- 2026-08-12: Confirmed the 500-word length needs no change to the class
  timing budget — the learner reads fast and earlier articles underran.
  `docs/class-structure.md` updated accordingly.
- 2026-08-12: Researched subject 1. Five sources, two of them primary
  (Turing's paper, the Dartmouth proposal). Recorded facts, angle,
  grammar fit, and one accuracy caveat about the Turing test's status.
- 2026-08-12: Researched subjects 2-6 in sequence. All six subjects now
  "researched". Primary sources secured for the Lighthill report and both
  the AlexNet and transformer papers; peer-reviewed anchors for the
  perceptron controversy (Olazaran) and hallucination (*Nature*).
  Recorded a conflict-of-interest caveat on subject 5, which involves
  Anthropic. Two series-wide callbacks confirmed: machine translation
  (article 2 → 4) and plausibility-as-measure (article 1 → 6).
- 2026-08-12: User approved the plan. All six subjects marked "approved";
  series registered in `site/content/series.json`. Drafted article 1,
  `2026-08-12-the-question-before-the-machines.md` (305-word reading
  section). Subject 1 marked "drafted".
- 2026-08-12: Drafted articles 2-6. All six now "drafted" and registered
  under `series_order` 1-6. Verified programmatically: every article has
  distinct front-matter and reading-section titles, the five fixed
  headings, 5 vocabulary terms, 4 discussion questions, 4-5 references,
  and a reading section of 270-315 words (within the ~500 cap). Cover
  images not yet added; search index not yet rebuilt.
- 2026-08-12: Queued cover-image candidates for all six articles in
  `site/scripts/cover-images.json` (status `pending`), one Commons file
  each, with a `notes` line recording why that image was chosen. Awaiting
  `npm run covers` on a machine with normal internet access — the script
  re-verifies every licence live before downloading.

## Next step

Review the six drafts, then add cover images (see `docs/cover-images.md`
and the `english-learning-cover-image` skill) — the philosophy series has
them and this one does not yet. Run `npm run build` to regenerate the
search index so the new articles and the `how-ai-got-here` series filter
are searchable. Mark subjects "published" once live.

## Todo

- [x] Agree theme and scope with the user
- [x] Scout subjects and propose throughline
- [x] Confirm length/timing (500 words, budget unchanged)
- [x] Research subject 1
- [x] Research subject 2
- [x] Research subject 3
- [x] Research subject 4
- [x] Research subject 5
- [x] Research subject 6
- [ ] Present full plan for approval
- [ ] Register series in `site/content/series.json`
- [x] Draft articles 1-6
- [x] Search Commons and queue cover candidates for all six
- [ ] Run `npm run covers` to download, compress and attach them
- [ ] Rebuild search index (`npm run build`)
- [ ] Mark series published
