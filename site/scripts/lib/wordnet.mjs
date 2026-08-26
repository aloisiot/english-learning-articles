import fs from "node:fs";
import path from "node:path";

const DICT_DIR = path.join(
  process.cwd(),
  "node_modules",
  "wordnet-db",
  "dict",
);

// File name -> the one-letter part-of-speech code stored against each sense.
const POS_FILES = { noun: "n", verb: "v", adj: "a", adv: "r" };

/**
 * Parses one WNDB data file into `{ headword: [{ p, d, e }, ...] }`.
 *
 * Format (see https://wordnet.princeton.edu/documentation/wndb5wn):
 *   synset_offset  lex_filenum  ss_type  w_cnt  word  lex_id  [word lex_id ...]  p_cnt  [ptr ...]  | gloss
 * Lines indented with two spaces are the license header, not data.
 */
function parseFile(file, code, index) {
  const raw = fs.readFileSync(file, "latin1");

  for (const line of raw.split("\n")) {
    if (line.startsWith("  ") || !line.trim()) continue;

    const barIdx = line.indexOf("|");
    if (barIdx === -1) continue;

    const parts = line.slice(0, barIdx).trim().split(/\s+/);
    const wordCount = parseInt(parts[3], 16);
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(parts[4 + 2 * i].replace(/_/g, " ").toLowerCase());
    }

    // The gloss packs the definition and examples into one `;`-separated
    // string; quoted segments are examples, everything else is definition.
    const segments = line
      .slice(barIdx + 1)
      .trim()
      .split(";")
      .map((s) => s.trim());
    const defs = segments.filter((s) => !s.startsWith('"'));
    const examples = segments
      .filter((s) => s.startsWith('"'))
      .map((s) => s.replace(/^"|"$/g, ""));

    const sense = { p: code, d: defs.join("; "), e: examples.slice(0, 1) };

    for (const word of words) {
      if (!index.has(word)) index.set(word, []);
      index.get(word).push(sense);
    }
  }
}

/** Load the full Princeton WordNet index: headword -> array of senses. */
export function loadWordnetIndex() {
  const index = new Map();
  for (const [file, code] of Object.entries(POS_FILES)) {
    parseFile(path.join(DICT_DIR, `data.${file}`), code, index);
  }
  return index;
}
