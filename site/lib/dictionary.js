import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "lib", "dictionary-data");

/** Every shard id `app/dictionary/[shard]/route.js` should pre-render, including `forms`. */
export function shardIds() {
  return fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

/** Read one shard's JSON. `shard` is a letter (`"b"`), `"misc"`, or `"forms"`. */
export function loadShard(shard) {
  return JSON.parse(
    fs.readFileSync(path.join(dataDir, `${shard}.json`), "utf8"),
  );
}
