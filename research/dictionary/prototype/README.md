# Prototype — reproducing the measured numbers

These two scripts produced every "measured" figure in [`../03-embedded-options.md`](../03-embedded-options.md).
Run on 2026-08-11 against `wordnet-db@3.1.14`.

## Setup

```bash
npm init -y
npm install wordnet-db
pip install brotli
```

## Run

```bash
python3 build-wordnet-index.py     # parses WordNet → JSON + gzip + SQLite, prints sizes
python3 measure-variants.py        # variant sizes, brotli, per-letter shard sizes
```

## Expected output

```
headwords: 147982
senses:    207272
json MB 22.4  gz MB 4.9
sqlite MB 27.3

A single-word, <=3 senses:  83736 headwords | raw 12.1MB | gzip 2.9MB | brotli 2.1MB
B + defs capped 120 chars:  83736 headwords | raw 11.9MB | gzip 2.8MB | brotli 2.0MB
per-letter brotli shards total 2.7MB, avg shard 102KB
variant A sqlite 14.5MB
```

## Output format

`build-wordnet-index.py` emits `wordnet.json` keyed by lowercase headword:

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
- `d` — definition (WordNet gloss, non-quoted segments joined)
- `e` — example sentences (quoted gloss segments), capped at 1

## Not yet implemented

These are the gaps between the prototype and a shippable feature — see [`../05-implementation-plan.md`](../05-implementation-plan.md):

- Lemmatization / surface-form map (`forms.json`)
- Article-vocabulary scoping (the step that gets you from 2.1 MB to ~200 KB)
- Enrichment from freedictionaryapi.com / Merriam-Webster
- IPA and audio extraction

## Licence

The generated data derives from **Princeton WordNet 3.1**. Any redistribution must carry the Princeton
copyright notice — see the `LICENSE` file inside `node_modules/wordnet-db/`, and
https://wordnet.princeton.edu/license-and-commercial-use
