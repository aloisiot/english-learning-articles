/**
 * Measures WordNet's multiword-expression inventory, and probes coverage of
 * vocabulary drawn from the site's own published articles.
 *
 * The point of this script: multiword lookup needs no enumeration of word
 * combinations, because the dictionary already ships its own phrase
 * inventory as headwords. The coverage probe then shows where that
 * inventory falls short — which is the measured basis for preferring
 * Wiktextract over WordNet as the shipping corpus.
 *
 * Produces the figures quoted in ../06-lookup-scope.md §2.
 * Expected output (wordnet-db@3.1.14):
 *
 *   total headwords : 147982
 *   single-word     : 83736
 *   MULTIWORD       : 64246
 *   max words in an entry: 9
 *   by length: { '2': 54577, '3': 7773, '4': 1461, '5': 298, '6': 80, '7': 28, '8': 20, '9': 9 }
 *   multiword-only index: raw 8.3MB gzip 1.8MB
 *     'carbon sink' -> not in WordNet
 *     'carbon footprint' -> not in WordNet
 *     ... (the rest FOUND)
 */
import zlib from "node:zlib";
import { parseWordNet, multiword, singleWord, mb } from "./lib/wordnet.mjs";

const entries = parseWordNet();
const multi = multiword(entries);
const single = singleWord(entries);

console.log("total headwords :", entries.size);
console.log("single-word     :", single.size);
console.log("MULTIWORD       :", multi.size);
console.log(
  "max words in an entry:",
  Math.max(...[...multi.keys()].map((w) => w.split(" ").length)),
);

const byLength = {};
for (const word of multi.keys()) {
  const n = word.split(" ").length;
  byLength[n] = (byLength[n] ?? 0) + 1;
}
console.log("by length:", byLength);

const raw = Buffer.from(JSON.stringify(Object.fromEntries(multi)), "utf8");
console.log(
  `multiword-only index: raw ${mb(raw.length)}MB` +
    ` gzip ${mb(zlib.gzipSync(raw, { level: 9 }).length)}MB`,
);

/*
  Coverage probe: phrases taken from the site's own published articles.
  'carbon sink' is the subject of 2026-08-07-ocean-carbon-sink.md — WordNet
  has no entry for it, and Wiktionary does. That single fact is why the
  shipping corpus should be Wiktextract, not WordNet.
*/
const PROBES = [
  "carbon sink",
  "power grid",
  "climate change",
  "sea level",
  "give up",
  "carbon footprint",
  "make sense",
  "take place",
];

for (const probe of PROBES) {
  const hit = multi.get(probe);
  console.log(
    " ",
    JSON.stringify(probe),
    "->",
    hit ? `FOUND: ${hit[0].d.slice(0, 60)}` : "not in WordNet",
  );
}
