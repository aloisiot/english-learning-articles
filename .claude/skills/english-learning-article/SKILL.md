---
name: "english-learning-article"
description: "Create a new English-learning article for the 30-minute conversation-class system. Use when the user asks to write, draft, or add an article/lesson for their English Learning project (science-environment, technology, philosophy, or a new topic)."
---

## English Learning — Article Creation Skill

This skill produces one markdown article for the English Learning project: a
short, original piece designed to support one 30-minute online English
conversation class (grammar point, reading text, vocabulary, discussion
questions, and its sources).

### Learner profile

- Level: Upper-intermediate / Advanced (B2–C1)
- Language: everything in English (no Portuguese scaffolding)
- Topics of interest so far: science & environment, technology, philosophy
  (open to more)

### Folder structure

```
English Learning/
  index.md                        ← master index, links to all subject indexes
  _templates/
    article-template.md
  science-environment/
    index.md
    2026-08-07-ocean-acidification.md
  technology/
    index.md
  philosophy/
    index.md
  _keywords/
    index.md                      ← alphabetical keyword → article map
```

- File naming: `YYYY-MM-DD-slug.md` — sorts chronologically, date visible
  without opening the file.
- New subject = new folder + its own `index.md`.
- `index.md` files are regenerated/updated whenever a new article is added.
- YAML front matter is the key mechanism for indexing — a script can scan
  all files, read the front matter, and rebuild the subject indexes and
  keyword index automatically.

Note: as actually implemented in the live site (`site/`), articles live
flat in `site/content/` rather than in per-topic subfolders — see
`docs/overview.md` for the as-built structure. This section is kept as the
original design reference.

### Article template

```markdown
---
title:
date: YYYY-MM-DD
level: B2-C1
topic: technology
grammar_focus: reported speech
keywords: [ai regulation, reported speech, tech policy]
series: a-stable-kebab-case-slug        # optional — only for series articles
series_order: 1                         # position within the series — see below
cover_image: "/images/covers/YYYY-MM-DD-slug.jpg"      # optional — see below
cover_image_alt: "Plain-language description of the photo"
cover_image_credit: "Photo by <Author> on Wikimedia Commons (<License>)"
---

## Grammar Spotlight: [Grammar Point]

Short explanation of the rule (3-4 sentences), with 1-2 example pairs
showing the transformation (e.g. direct speech → reported speech).

## [Title of this article's text — never the word "Article"]

Flexible length, roughly 250-350 words as a guide, summarized from
researched sources. The grammar point is naturally used within the text
(not visually marked/bolded — just genuinely present so the learner sees
it in context).

## Key Vocabulary

- **term** — definition (+ example sentence)
- (4-5 items max)

## Discussion Questions

3-4 questions about the SUBJECT of the article, not the grammar point.
Goal: get a real conversation going, not a grammar drill.

## Quick Recap

2-3 sentence summary, useful to skim before the next class.

## References

Every source actually used to research the article, as a markdown link
list. See "References — required" below.
```

### Titles — required

Every article carries **two** titles. Both must be written by hand; neither
is optional and neither is derived from the other.

| Where                              | What it is                                                                                                                       |
| ----------------------------------- | -----------------------------------------------------------------------------------------------------------------------------------|
| `title:` in the front matter       | The article's title. Appears as the page heading, in the subject and keyword indexes, in search results, and in the browser tab. |
| The heading on the reading section | A real title for the text itself, in place of a generic label.                                                                   |

**`## Article` is not an acceptable heading.** It is the same on every page,
so it names nothing: the learner cannot tell one text from another by it,
and there is no way to refer to a piece during class ("take another look at
_The Grid Nobody Planned For_"). It reads as a placeholder that was never
filled in — which is what it is.

**The two titles must not be the same.** The front-matter title frames the
subject for someone browsing the index; the section title names the piece
of writing sitting in front of the learner. Using one as the other prints
the same words on screen twice.

The other five section headings — Grammar Spotlight, Key Vocabulary,
Discussion Questions, Quick Recap, References — stay fixed. They label a
_kind_ of content that is genuinely the same in every article, which is
exactly what the reading section is not.

### References — required

Every article ends with a `## References` section listing the sources
actually used to research and fact-check it — never a placeholder, never
skipped because the article "only" summarizes common knowledge. This is a
distinct role from writing the article itself: verify a claim came from
somewhere real before it goes in the text, and keep the source.

- **Format:** a markdown link list, one source per line —
  `- [Source title](URL)`. Prefer 2+ sources per article; encyclopedic or
  academic sources (Britannica, Stanford Encyclopedia of Philosophy, IEP,
  established research/news outlets) over blogs or SEO content, unless the
  blog is itself the primary source (e.g. an original essay being
  discussed).
- **What belongs here:** only sources whose content actually informed the
  article — not a generic reading list. If a specific fact, figure, or
  quote came from one source, that source must be in this list.
- **Not part of the 30-minute budget.** Unlike the other four fixed
  sections, References is not read aloud or covered live in class — it's a
  written record for transparency and follow-up reading. Leave it out of
  the timing budget below entirely.
- **Series articles:** pull this list straight from the `Sources` column
  already recorded for that subject in `research/<series-slug>.md` (see
  the `english-learning-series` skill) rather than re-researching — the
  research tracking file is the source of truth for what was actually
  used.

### Series fields — optional

`series` and `series_order` only apply when the article is part of a
connected set — see the `english-learning-series` skill for how a series
is planned and sequenced. The series' **title and description are not
front-matter fields on the article** — they live once in
`site/content/series.json` (one entry per series slug, not per article),
so editing a series' title or blurb never means touching every article in
it. Do not add `series_title`/`series_description` to an article; that was
an earlier convention the registry replaced.

### Cover image — optional

Every article may carry a cover image (`cover_image`, `cover_image_alt`,
`cover_image_credit` front-matter fields, shown in the template above).
This is handled by the separate **`english-learning-cover-image`** skill
— use it as the final step below, once the article text itself is
finished. It is optional per article, not a hard requirement like
References.

### Fitting a 30-minute class — timing budget

The whole article + questions must fit inside the 30-minute class. Article
length is flexible, but should stay close to this budget so a class never
runs long:

| Segment              | Time    | Content sizing                   |
| --------------------- | ------- | -------------------------------- |
| Grammar spotlight    | ~3 min  | 3-4 sentence rule + 1-2 examples |
| Reading the article  | ~5 min  | roughly 200-250 words            |
| Vocabulary review    | ~4 min  | 4-5 terms                        |
| Discussion questions | ~15 min | 3-4 questions                    |
| Buffer/wrap-up       | ~3 min  | —                                |

This replaces the earlier 300-500 word / open-ended question guidance.
Word count is a flexible guideline rather than a hard cap, but questions
stay capped at 3-4. References sits outside this table — see above.

Notes:

- YAML front matter is the key mechanism for indexing — a script can scan
  all files, read the front matter, and rebuild the subject indexes and
  keyword index automatically.
- Grammar rule should show up naturally in the article's language, not be
  visually highlighted/bolded.
- Discussion questions are about the topic, to keep the conversation
  interesting — occasional grammar-related questions are fine, but not
  the default.

### Grammar rotation (B2–C1 candidates)

To avoid repeating the same structure too often, rotate through: reported
speech, mixed/3rd conditionals, passive voice, phrasal verbs, cleft
sentences, participle clauses, modal perfect ("should have known"),
inversion for emphasis. Or fit the article to whatever grammar point the
teacher picks for a given class.

### Working defaults

- Article length: flexible (not a strict word count), while still fitting
  the 30-minute class timing budget above.
- Grammar point selection: system-driven (rotate through the list above)
  unless the user specifies one.
- Articles to prepare per week/topic: 5 (as a batch size, when generating
  in bulk).

### When creating an article, do this

1. Confirm topic/subject folder (science-environment, technology,
   philosophy, or a new one) and, if not specified, pick the next grammar
   point in the rotation.
2. Research the subject briefly for accurate, current content to summarize
   — keep track of every source actually used as you go, not just at the
   end.
3. Fill the template: distinct front-matter `title` and reading-section
   title, ~200-350 word text with the grammar point naturally present,
   4-5 vocabulary terms, 3-4 topic-focused discussion questions, 2-3
   sentence recap, and the References list of sources actually used.
4. Save as `YYYY-MM-DD-slug.md` inside the correct subject folder using
   today's date.
5. Note that the subject `index.md` and the `_keywords/index.md` should be
   updated to include the new article (front matter drives this).
6. Run the `english-learning-cover-image` skill to search for, download,
   and attach a cover image — unless the user says to skip it for this
   article.

