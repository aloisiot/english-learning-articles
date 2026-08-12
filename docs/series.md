# Series

Some articles are written as a connected set — a small arc where each class
builds on the one before, rather than three unrelated topics. This is
optional: most articles will never carry these fields.

Two front-matter fields per article drive it:

| Field          | What it is                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| `series`       | A stable slug shared by every article in the set, e.g. `eastern-philosophy-and-the-self`. |
| `series_order` | The article's position within the series (1, 2, 3, …). Determines reading/teaching order.  |

The series' **title and description live in one place**,
`site/content/series.json`, rather than being repeated in every
article's front matter:

```json
{
  "eastern-philosophy-and-the-self": {
    "title": "Eastern Philosophy and the Self",
    "description": "One or two sentences — the throughline tying the articles together."
  }
}
```

This replaced an earlier version where `series_title` and
`series_description` were duplicated verbatim across every article in
the set — editing a series' title meant editing every article that
carried it, which is exactly the kind of duplication a single source of
truth avoids. `lib/articles.js` (`getSeriesMeta()`, `getAllSeries()`)
reads the registry first and falls back to `article.series_title`/
`article.series_description` only for a series that predates it — new
series should only ever need an entry here, not per-article fields.
`description` is optional: a series with none just skips straight from
the title to the article-count/topic line on the homepage.

`description` is normally the same sentence(s) as the "Theme &
throughline" already written in `research/content/<series-slug>.md` during
planning (see the `english-learning-series` skill) — copy it over rather
than redrafting, so the two stay in sync.

Site behaviour (implemented in `site/`):

- The **homepage** shows a "Series" section above the full article list,
  one entry per series, linking to its first (`series_order: 1`) article.
- Any article carrying a `series` field gets a **left-hand sidebar** on
  its page (≥1280px viewports — was 1100px before the 2026-08 measure
  widening, see `docs/STYLE-SPEC.md` §4/§7), listing every article in
  that series in order, with the current one bolded. Articles with no
  `series` field get no sidebar at all — not even an empty one.
- The article itself always stays centred on the page, exactly as on any
  other article — the sidebar sits in a mirrored two-column layout (an
  invisible spacer balances it on the other side) rather than shifting
  the reading column off-centre.
- Below 1280px there's no room for a true sidebar alongside the article's
  measure, so it collapses to a plain block above the article — the first
  thing on the page, not a sidebar — rather than disappearing.
- `series` is also wired into the search page as a filter, alongside
  topic, grammar point, and level.

Nothing about the reading section, grammar spotlight, vocabulary,
discussion questions, or references changes for a series article — it's
still a complete, self-contained 30-minute class on its own. The series is
a navigation layer on top, not a requirement that classes be taken in
order.

## Research tracking

Planning a series (picking subjects, researching each one, deciding the
order) happens in `research/content/<series-slug>.md` before any article is
drafted — see the `english-learning-series` skill for the full process
and file format. That file, not chat history, is the source of truth for
where a series' research stands.
