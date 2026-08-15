# Prototype — reproducing the measured numbers

Node ESM scripts that produce every "measured" figure quoted in
[`../03-embedded-options.md`](../03-embedded-options.md) and
[`../06-lookup-scope.md`](../06-lookup-scope.md).

Ported from the original Python on 2026-08-11. Node rather than Python because
the rest of the repo is Node — and because `lib/wordnet.mjs` is written to be
lifted straight into `site/scripts/build-dictionary.mjs` rather than rewritten.

## Requirements

**Node ≥ 22.5.0.** Uses the built-in `node:sqlite` (still flagged experimental —
it prints a warning, which is expected) and `node:zlib` for gzip and brotli. No
native dependencies, no build step.

## Run

```bash
npm install
npm run all          # or: build → variants → multiword, individually
```

`measure-variants.mjs` reads `wordnet.json`, so run `build` first. `npm run all`
does this in order.

## Files

| File | What it does |
|---|---|
| `lib/wordnet.mjs` | The parser. Reads `data.{noun,verb,adj,adv}` into `Map<headword, Sense[]>`. **This is the piece that becomes the real build script** |
| `build-wordnet-index.mjs` | Full index → JSON, gzip, SQLite. Headword and sense counts |
| `measure-variants.mjs` | Shipping variants: single-word only, capped senses, per-letter brotli shards |
| `measure-multiword.mjs` | Multiword inventory + coverage probe against the site's own article vocabulary |

## Expected output

```
headwords: 147982
senses:    207272
json MB 22.4  gz MB 4.8
sqlite MB 27.3

A single-word, <=3 senses: 83736 headwords | raw 12.1MB | gzip 2.9MB | brotli 2.1MB
B + defs capped 120 chars: 83736 headwords | raw 11.9MB | gzip 2.8MB | brotli 2.0MB
per-letter brotli shards total 2.7MB, avg shard 102KB
variant A sqlite 14.5MB

total headwords : 147982
single-word     : 83736
MULTIWORD       : 64246
max words in an entry: 9
by length: { '2': 54577, '3': 7773, '4': 1461, '5': 298, '6': 80, '7': 28, '8': 20, '9': 9 }
multiword-only index: raw 8.3MB gzip 1.7MB
  "carbon sink" -> not in WordNet
  "power grid" -> FOUND: a system of high tension cables by which electrical power is
  "climate change" -> FOUND: a change in the world's climate
  "sea level" -> FOUND: level of the ocean's surface (especially that halfway betwee
  "give up" -> FOUND: stop maintaining or insisting on; of ideas or claims
  "carbon footprint" -> not in WordNet
  "make sense" -> FOUND: be reasonable or logical or comprehensible
  "take place" -> FOUND: come to pass
```

The two misses are the point: `carbon sink` is the subject of a published article
(`2026-08-07-ocean-carbon-sink.md`) and WordNet has no entry for it. That is the
measured basis for choosing Wiktextract over WordNet as the shipping corpus —
see [`../06-lookup-scope.md`](../06-lookup-scope.md) §3.

### Note on the port: gzip figures moved by 0.1 MB

The Node port produces **byte-identical JSON** to the original Python
(22,384,731 bytes), so the parser is a faithful reimplementation. But Node's
`zlib.gzipSync` and Python's `gzip.compress` differ by ~0.8% at the same
compression level, which straddles a rounding boundary in two places:

| Figure | Python | Node |
|---|---|---|
| Full index, gzip | 4.9 MB | **4.8 MB** |
| Multiword-only index, gzip | 1.8 MB | **1.7 MB** |

**brotli figures are identical** (2.1 MB, 2.0 MB, 2.7 MB total, 102 KB average),
as are all headword counts, raw sizes and SQLite sizes. The docs quote the Node
numbers, since these scripts are now the reference implementation.

## Output format

`build-wordnet-index.mjs` writes `wordnet.json`, keyed by lowercase headword:

```json
{
  "ubiquitous": [
    { "p": "a", "d": "being present everywhere at once", "e": [] }
  ],
  "mitigate": [
    { "p": "v", "d": "make less severe or harsh", "e": ["mitigating circumstances"] },
    { "p": "v", "d": "lessen or to try to lessen the seriousness or extent of",
      "e": ["The circumstances extenuate the crime"] }
  ]
}
```

- `p` — part of speech: `n` noun, `v` verb, `a` adjective, `r` adverb
- `d` — definition (the non-quoted segments of the WordNet gloss)
- `e` — example sentences (the quoted segments), capped at one

Generated artefacts are gitignored; regenerate with `npm run all`.

## What this prototype does *not* do

The gap between these scripts and a shippable build — see
[`../05-implementation-plan.md`](../05-implementation-plan.md):

- Lemmatization / surface-form map
- Wiktextract ingest (the actual shipping corpus)
- `## Key Vocabulary` parsing
- IPA and audio extraction

## Licence

Generated data derives from **Princeton WordNet 3.1**. Redistribution must carry
the Princeton copyright notice — see `node_modules/wordnet-db/LICENSE` and
<https://wordnet.princeton.edu/license-and-commercial-use>.
