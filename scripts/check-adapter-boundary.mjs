/**
 * `@supabase/supabase-js` may be imported only inside an `adapters/`
 * directory. Nowhere else, ever.
 *
 * The rule is from research/accounts-and-scheduling/02 §6, and the
 * reason it is checked rather than trusted is in the same place: what
 * makes leaving Supabase *bounded* is that the business rules never
 * mention it. One import in a route handler, added on a deadline, is all
 * it takes for that to stop being true — and nothing would fail. The
 * cost of the arrangement is "the discipline to keep the SDK import
 * confined to one directory", and discipline that is not enforced is a
 * comment.
 *
 * A script rather than a lint plugin, because that is this repo's idiom:
 * scripts/check-env-files.mjs already guards the other boundary that
 * matters, and neither needs an ESLint installation to be true.
 *
 * Scope: every tracked .ts/.tsx/.js/.jsx/.mjs file. Tracked, so that the
 * question is about the repository rather than about whatever happens to
 * be on disk — the same choice check-env-files.mjs makes for the same
 * reason.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Packages that may only be reached from an adapter. */
const CONFINED = ["@supabase/supabase-js"];

/**
 * A path is allowed if it sits under a directory literally named
 * `adapters`. Matching the directory rather than a feature name keeps
 * the rule true for features that do not exist yet.
 */
function isAdapter(path) {
  return path.split("/").includes("adapters");
}

function trackedSourceFiles() {
  const out = execFileSync(
    "git",
    ["ls-files", "-z", "*.ts", "*.tsx", "*.js", "*.jsx", "*.mjs"],
    { encoding: "utf8" },
  );
  return out.split("\0").filter(Boolean);
}

/**
 * Matches `from "pkg"`, `require("pkg")` and `import("pkg")`, including
 * deep imports like `@supabase/supabase-js/dist/...`.
 *
 * Deliberately textual. A parser would be more precise about a package
 * named inside a comment or a string, and the trade is accepted: this
 * check should be readable by whoever it fails on, and a false positive
 * on a mention in prose is cheap to resolve by rewording. A false
 * negative is not.
 */
function importsConfined(source) {
  return CONFINED.filter((pkg) => {
    const quoted = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`["'\`]${quoted}(/[^"'\`]*)?["'\`]`).test(source);
  });
}

const violations = [];

for (const file of trackedSourceFiles()) {
  if (isAdapter(file)) continue;

  const source = readFileSync(file, "utf8");
  for (const pkg of importsConfined(source)) {
    source.split("\n").forEach((line, i) => {
      if (line.includes(pkg)) {
        violations.push({ file, line: i + 1, pkg, text: line.trim() });
      }
    });
  }
}

if (violations.length > 0) {
  console.error(
    `\n✗ ${violations.length} import(s) of a confined package outside an adapters/ directory:\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}`);
  }
  console.error(
    "\n  These packages may only be imported inside a features/*/adapters/",
  );
  console.error(
    "  directory. The domain must not name the vendor — see ports.ts and",
  );
  console.error(
    "  research/accounts-and-scheduling/02 §6. Move the call behind a port.\n",
  );
  process.exit(1);
}

console.log("✓ No vendor SDK imported outside an adapters/ directory.");
