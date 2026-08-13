# Doublecheck reports

Independent fact-checking passes over a series' `decisions/` file, one
file per series:

```
research/content/doublecheck-report/<series-slug>.md
```

**These are temporary.** A report records that a check happened and what
it found, at one moment, against one version of the research. It is not
part of the series' reasoning and it does not stay true — once its
findings have been acted on, it is a snapshot of a question already
settled.

## Lifetime

Delete the report when the series ships, alongside
`progress/<series-slug>.md`. Only `decisions/<series-slug>.md` survives.

The three folders under `research/content/` divide by how long their
contents stay true:

| Folder | Holds | Lifetime |
| --- | --- | --- |
| `decisions/` | Why the series is written this way | **Kept** |
| `progress/` | Where the work stands | Deleted when the series ships |
| `doublecheck-report/` | What one verification pass found | Deleted when the series ships |

## One exception worth honouring

**If a check finds something wrong, fix `decisions/` rather than leaving
the correction only in the report.** A report saying "the article claims
X, but the source says Y" is worthless once deleted if Y never made it
into the decisions file. The report is where a problem is *found*; the
decisions file is where the corrected understanding *lives*.

The same applies to a claim the check could not confirm. If a figure
turns out to be uncertain or contested, that belongs in the relevant
subject's **Care needed** block in `decisions/`, not only here — that is
the note a future revision will actually read.

By the time you delete a report, everything in it should either be
recorded in `decisions/` or genuinely not worth keeping.

## Naming

Same slug as everywhere else — the series key in
`site/content/series.json`, the `series:` value in each article's front
matter, the branch name, and the files in `decisions/` and `progress/`.
One identifier throughout.

## What a report should contain

Whatever form the check takes, it should be possible to tell from the
report:

- which file and which version was checked
- what was verified, claim by claim, with an explicit status
- what could **not** be confirmed, and why — an unverifiable claim is a
  more useful finding than a verified one
- whether the source file was changed as a result

A report that says only "all verified" is weak evidence: it does not
distinguish between claims that were checked against a primary source
and claims that were merely plausible. Prefer naming the source that
confirmed each item.

---

See [`../README.md`](../README.md) for the folder structure as a whole.
