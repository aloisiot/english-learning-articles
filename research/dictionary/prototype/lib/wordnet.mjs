/**
 * WordNet 3.1 parser.
 *
 * Reads the `data.*` files from the `wordnet-db` npm package and returns a
 * headword → senses index. Deliberately dependency-free and side-effect-free
 * so it can be lifted straight into `site/scripts/build-dictionary.mjs`.
 *
 * WordNet's data file format, per line (one line = one synset):
 *
 *   offset lex_filenum ss_type w_cnt word lex_id [word lex_id ...] p_cnt ... | gloss
 *   └─ parts[0]        parts[2] parts[3] is w_cnt in HEX; words at parts[4 + 2i]
 *
 * The gloss after `|` is semicolon-separated; segments wrapped in double
 * quotes are example sentences, the rest are the definition.
 *
 * Lines beginning with two spaces are the copyright header, not data.
 */
import fs from "node:fs";
import path from "node:path";

/** WordNet part-of-speech file names → the single-letter code used in output. */
export const POS = { noun: "n", verb: "v", adj: "a", adv: "r" };

/** Locate the bundled `dict` directory inside the wordnet-db package. */
export function dictDir(root = process.cwd()) {
  return path.join(root, "node_modules", "wordnet-db", "dict");
}

/**
 * Parse every data.* file into `Map<headword, Sense[]>`.
 *
 * A Map (not a plain object) because headwords include strings like
 * "__proto__" and "constructor" that would collide with Object.prototype.
 * Insertion order is preserved, matching the reference Python implementation
 * so the serialized bytes — and therefore the measured sizes — are identical.
 *
 * @returns {Map<string, Array<{p: string, d: string, e: string[]}>>}
 */
export function parseWordNet(dir = dictDir()) {
  /** @type {Map<string, Array<{p: string, d: string, e: string[]}>>} */
  const entries = new Map();

  for (const [pos, code] of Object.entries(POS)) {
    // latin1: WordNet data files are ISO-8859-1, not UTF-8.
    const raw = fs.readFileSync(path.join(dir, `data.${pos}`), "latin1");

    for (const line of raw.split("\n")) {
      if (line.startsWith("  ") || line === "") continue;

      const bar = line.indexOf("|");
      const head = bar === -1 ? line : line.slice(0, bar);
      const gloss = bar === -1 ? "" : line.slice(bar + 1);

      const parts = head.split(/\s+/).filter(Boolean);
      const wordCount = parseInt(parts[3], 16);

      const segments = gloss.trim().split(";").map((s) => s.trim());
      const definition = segments.filter((s) => !s.startsWith('"')).join("; ");
      const examples = segments
        .filter((s) => s.startsWith('"'))
        .map((s) => s.replace(/^"+|"+$/g, ""))
        .slice(0, 1);

      for (let i = 0; i < wordCount; i++) {
        const word = parts[4 + 2 * i].replace(/_/g, " ").toLowerCase();
        const sense = { p: code, d: definition, e: examples };
        const existing = entries.get(word);
        if (existing) existing.push(sense);
        else entries.set(word, [sense]);
      }
    }
  }

  return entries;
}

/** Serialize a Map to minified JSON with the key order preserved. */
export function toJSON(map) {
  return JSON.stringify(Object.fromEntries(map));
}

/** Total number of senses across all headwords. */
export function countSenses(map) {
  let n = 0;
  for (const senses of map.values()) n += senses.length;
  return n;
}

/** Headwords containing a space — WordNet's multiword expressions. */
export function multiword(map) {
  return new Map([...map].filter(([w]) => w.includes(" ")));
}

/** Headwords with no space. */
export function singleWord(map) {
  return new Map([...map].filter(([w]) => !w.includes(" ")));
}

/** Format a byte count as megabytes to one decimal place. */
export function mb(bytes) {
  return (bytes / 1e6).toFixed(1);
}
