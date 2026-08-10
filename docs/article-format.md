# Article format

## Article template

```markdown
---
title:
date: YYYY-MM-DD
level: B2-C1
topic: technology
grammar_focus: reported speech
keywords: [ai regulation, reported speech, tech policy]
series: eastern-philosophy-and-the-self   # optional — see docs/series.md
series_order: 1
cover_image: "/images/covers/YYYY-MM-DD-slug.jpg"  # optional — see docs/cover-images.md
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
list — see "References" below.
```

Note: `series`/`series_order` are the only per-article series fields.
The series' title and description live once in `site/content/series.json`
— see [series.md](./series.md) — never repeat them in an article's own
front matter.

## Titles — required

Every article carries **two** titles. Both must be written by hand; neither
is optional and neither is derived from the other.

| Where                              | What it is                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
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

## References

Every article ends with a `## References` section: a markdown link list
of the sources actually used to research and fact-check it (`- [Source
title](URL)`), never a placeholder. Prefer 2+ sources per article,
encyclopedic/academic ones over blogs or SEO content unless the blog is
itself the primary source under discussion. Only sources that actually
informed the article belong here — not a generic reading list.

References is not part of the 30-minute timing budget (see
[class-structure.md](./class-structure.md)) — it's a written record, not
read aloud in class.

For a series article, pull the list from the `Sources` column already
recorded for that subject in `research/<series-slug>.md` rather than
re-researching (see [series.md](./series.md) and the
`english-learning-series` skill).

Site-wise, References is a section like any other — it gets wrapped in
`.section-references` automatically — but it has no dedicated visual
treatment of its own yet (unlike Key Vocabulary or Quick Recap in
`docs/STYLE-SPEC.md` §6); it currently renders with the same base
paragraph/list styling as the reading section. The five articles
published before this rule was added (`site/content/2026-08-07-*.md`)
predate it and have no References section yet.
