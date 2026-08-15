/**
 * Parses WordNet into a headword → senses index and measures the result as
 * JSON, gzip and SQLite.
 *
 * Produces the figures quoted in ../03-embedded-options.md "Part B".
 * Expected output (wordnet-db@3.1.14):
 *
 *   headwords: 147982
 *   senses:    207272
 *   json MB 22.4  gz MB 4.9
 *   sqlite MB 27.3
 */
import fs from "node:fs";
import zlib from "node:zlib";
import { DatabaseSync } from "node:sqlite";
import { parseWordNet, toJSON, countSenses, mb } from "./lib/wordnet.mjs";

const entries = parseWordNet();

console.log("headwords:", entries.size);
console.log("senses:   ", countSenses(entries));

const json = Buffer.from(toJSON(entries), "utf8");
fs.writeFileSync("wordnet.json", json);

const gz = zlib.gzipSync(json, { level: 9 });
fs.writeFileSync("wordnet.json.gz", gz);

console.log(`json MB ${mb(json.length)}  gz MB ${mb(gz.length)}`);

// SQLite: one row per headword, senses stored as a JSON blob. Mirrors the
// shape a sql.js-httpvfs build would use (see ../03-embedded-options.md §C
// option 3) so the size comparison is like-for-like.
fs.rmSync("wordnet.sqlite", { force: true });
const db = new DatabaseSync("wordnet.sqlite");
db.exec("CREATE TABLE entry(word TEXT PRIMARY KEY, json TEXT)");
db.exec("BEGIN");
const insert = db.prepare("INSERT INTO entry VALUES(?, ?)");
for (const [word, senses] of entries) insert.run(word, JSON.stringify(senses));
db.exec("COMMIT");
db.exec("VACUUM");
db.close();

console.log(`sqlite MB ${mb(fs.statSync("wordnet.sqlite").size)}`);
