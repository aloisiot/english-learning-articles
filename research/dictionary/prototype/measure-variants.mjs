/**
 * Measures shipping variants of the WordNet index: how small does it get once
 * multiword entries are dropped, senses capped, and the whole thing sharded
 * by first letter and brotli-compressed?
 *
 * The per-letter shard figure is the one that decides whether a complete
 * embedded dictionary is viable on a static host.
 *
 * Produces the figures quoted in ../03-embedded-options.md "Part B".
 * Run build-wordnet-index.mjs first — this reads wordnet.json.
 *
 * Expected output (wordnet-db@3.1.14):
 *
 *   A single-word, <=3 senses: 83736 headwords | raw 12.1MB | gzip 2.9MB | brotli 2.1MB
 *   B + defs capped 120 chars: 83736 headwords | raw 11.9MB | gzip 2.8MB | brotli 2.0MB
 *   per-letter brotli shards total 2.7MB, avg shard 102KB
 *   variant A sqlite 14.5MB
 */
import fs from "node:fs";
import zlib from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import { mb } from "./lib/wordnet.mjs";

const brotli = (buf) =>
  zlib.brotliCompressSync(buf, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  });

const all = JSON.parse(fs.readFileSync("wordnet.json", "utf8"));

/** Variant A: single-word headwords only, at most three senses each. */
const a = new Map();
for (const [word, senses] of Object.entries(all)) {
  if (word.includes(" ")) continue;
  // eslint-disable-next-line no-control-regex
  if (!/^[\x00-\x7F]*$/.test(word)) continue; // ASCII only, matching the reference impl
  a.set(word, senses.slice(0, 3));
}

/** Variant B: as A, with definitions truncated to 120 characters. */
const b = new Map(
  [...a].map(([w, senses]) => [
    w,
    senses.map((s) => ({ ...s, d: s.d.slice(0, 120) })),
  ]),
);

function report(label, map) {
  const raw = Buffer.from(JSON.stringify(Object.fromEntries(map)), "utf8");
  const gz = zlib.gzipSync(raw, { level: 9 });
  const br = brotli(raw);
  console.log(
    `${label}: ${map.size} headwords | raw ${mb(raw.length)}MB` +
      ` | gzip ${mb(gz.length)}MB | brotli ${mb(br.length)}MB`,
  );
}

report("A single-word, <=3 senses", a);
report("B + defs capped 120 chars", b);

// Per-letter shards of variant A. This is the number that matters for
// serving: a reader touches maybe 8-12 letters, not all 26.
let shardTotal = 0;
for (const letter of "abcdefghijklmnopqrstuvwxyz") {
  const shard = new Map([...a].filter(([w]) => w.startsWith(letter)));
  if (shard.size === 0) continue;
  shardTotal += brotli(
    Buffer.from(JSON.stringify(Object.fromEntries(shard)), "utf8"),
  ).length;
}
console.log(
  `per-letter brotli shards total ${mb(shardTotal)}MB,` +
    ` avg shard ${Math.round(shardTotal / 26 / 1e3)}KB`,
);

fs.rmSync("wn_a.sqlite", { force: true });
const db = new DatabaseSync("wn_a.sqlite");
db.exec("CREATE TABLE entry(word TEXT PRIMARY KEY, json TEXT)");
db.exec("BEGIN");
const insert = db.prepare("INSERT INTO entry VALUES(?, ?)");
for (const [word, senses] of a) insert.run(word, JSON.stringify(senses));
db.exec("COMMIT");
db.exec("PRAGMA page_size=4096");
db.exec("VACUUM");
db.close();

console.log(`variant A sqlite ${mb(fs.statSync("wn_a.sqlite").size)}MB`);
