/**
 * Prebuild step (runs before `next build`, see package.json).
 *
 * Scans every article for the words a reader could actually select, resolves
 * each to a dictionary headword, and writes the result as static JSON:
 *
 *   lib/dictionary-data/forms.json   surface form  -> headword (inflections only)
 *   lib/dictionary-data/<letter>.json  headword -> WordNet senses
 *
 * `app/dictionary/[shard]/route.js` serves these at build time as
 * `force-static` routes, so the browser fetches only the shards it touches
 * and no WordNet data ships to the client that the corpus never uses.
 *
 * Phase 1 scope: WordNet only, offline, no network calls. Key Vocabulary
 * glosses and freedictionaryapi.com enrichment are a later pass — see
 * research/dictionary/05-implementation-plan.md.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import lemmatizer from "wink-lemmatizer";
import { loadWordnetIndex } from "./lib/wordnet.mjs";

const contentDir = path.join(process.cwd(), "content");
const outDir = path.join(process.cwd(), "lib", "dictionary-data");

/** Strip the markdown down to the words a reader would see rendered. */
function extractText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"); // links -> link text only
}

/** Pull every candidate word (and hyphen-part) out of the article text. */
function tokenize(text) {
  const tokens = new Set();
  const matches = text.match(/[A-Za-z][A-Za-z'’-]*/g) ?? [];

  for (const raw of matches) {
    let token = raw
      .toLowerCase()
      .replace(/['’]s$/, "") // possessive: "teacher's" -> "teacher"
      .replace(/^[-'’]+|[-'’]+$/g, ""); // stray leading/trailing marks

    if (token.length < 2) continue;
    tokens.add(token);

    if (token.includes("-")) {
      for (const part of token.split("-")) {
        if (part.length >= 2) tokens.add(part);
      }
    }
  }

  return tokens;
}

/** Try the token as-is, then its noun/verb/adjective lemma, against the index. */
function resolveHeadword(token, wordnet) {
  if (wordnet.has(token)) return token;

  for (const lemma of [
    lemmatizer.verb(token),
    lemmatizer.noun(token),
    lemmatizer.adjective(token),
  ]) {
    if (lemma !== token && wordnet.has(lemma)) return lemma;
  }

  return null;
}

function shardKey(headword) {
  const first = headword[0];
  return /[a-z]/.test(first) ? first : "misc";
}

function main() {
  const wordnet = loadWordnetIndex();

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  const vocabulary = new Set();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
    const { content } = matter(raw);
    for (const token of tokenize(extractText(content))) {
      vocabulary.add(token);
    }
  }

  const forms = {};
  const shards = new Map(); // shardKey -> { headword: senses }
  let resolvedCount = 0;

  for (const token of vocabulary) {
    const headword = resolveHeadword(token, wordnet);
    if (!headword) continue;

    resolvedCount++;
    if (headword !== token) forms[token] = headword;

    const key = shardKey(headword);
    if (!shards.has(key)) shards.set(key, {});
    shards.get(key)[headword] = wordnet.get(headword);
  }

  fs.mkdirSync(outDir, { recursive: true });
  // Clear stale shards from a previous run (e.g. a letter with no entries left).
  for (const existing of fs.readdirSync(outDir)) {
    fs.rmSync(path.join(outDir, existing));
  }

  fs.writeFileSync(
    path.join(outDir, "forms.json"),
    JSON.stringify(forms),
  );
  let totalBytes = fs.statSync(path.join(outDir, "forms.json")).size;

  for (const [key, entries] of shards) {
    const file = path.join(outDir, `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(entries));
    totalBytes += fs.statSync(file).size;
  }

  console.log(
    `dictionary: ${vocabulary.size} unique tokens, ${resolvedCount} resolved, ` +
      `${shards.size} shards + forms map, ${(totalBytes / 1024).toFixed(0)} KB raw`,
  );
}

main();
