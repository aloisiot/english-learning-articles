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
 * The decisions here — what counts as an import, what counts as an
 * adapter, what is in scope at all — are pure functions with tests, and
 * the file walking is the thin part. That is the same split
 * daily-request.ts and daily.ts use.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Packages that may only be reached from an adapter. */
export const CONFINED = ["@supabase/supabase-js"];

/**
 * Only the deployed applications are in scope.
 *
 * scripts/ is repo tooling that runs outside the app — check-supabase.mjs
 * legitimately talks to Supabase to answer "is the project reachable",
 * and this file names the package in order to look for it. Neither is a
 * business rule, and neither ships. Scoping by workspace says that, where
 * an exclusion list would just accumulate.
 */
export const IN_SCOPE = ["class/", "site/", "lib/"];

export function inScope(path) {
  return IN_SCOPE.some((prefix) => path.startsWith(prefix));
}

/**
 * A path is allowed if it sits under a directory literally named
 * `adapters`. Matching the directory rather than a feature name keeps
 * the rule true for features that do not exist yet.
 */
export function isAdapterPath(path) {
  return path.split("/").includes("adapters");
}

/**
 * Comments are not imports.
 *
 * The first version of this check matched the package name anywhere in
 * the file, and immediately flagged three things that were not
 * violations: ports.ts explaining the rule, this file's own list, and a
 * doc comment quoting a deep import. Stripping comments first is what
 * makes the rule mean what it says.
 */
export function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * The confined packages this source actually imports.
 *
 * Matches the three forms that bring a module in — `from "pkg"`,
 * `require("pkg")` and `import("pkg")` — rather than any mention of the
 * name, and allows deep imports like `pkg/dist/…`. A string that merely
 * contains the name, such as the list above, is not an import and is not
 * a violation.
 */
export function findConfinedImports(source, confined = CONFINED) {
  const code = stripComments(source);

  return confined.filter((pkg) => {
    const name = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const specifier = `["'\`]${name}(?:/[^"'\`]*)?["'\`]`;
    return new RegExp(
      `(?:\\bfrom\\s*${specifier}|\\brequire\\s*\\(\\s*${specifier}|\\bimport\\s*\\(\\s*${specifier})`,
    ).test(code);
  });
}

/** The whole rule, over one file, as data. */
export function violationsIn(path, source) {
  if (!inScope(path) || isAdapterPath(path)) return [];
  return findConfinedImports(source).map((pkg) => ({ path, pkg }));
}

function trackedSourceFiles() {
  const out = execFileSync(
    "git",
    ["ls-files", "-z", "*.ts", "*.tsx", "*.js", "*.jsx", "*.mjs"],
    { encoding: "utf8" },
  );
  return out.split("\0").filter(Boolean);
}

// Tracked files rather than the working tree, so the question is about
// the repository — the same choice check-env-files.mjs makes.
function main() {
  const violations = trackedSourceFiles().flatMap((file) =>
    violationsIn(file, readFileSync(file, "utf8")),
  );

  if (violations.length > 0) {
    console.error(
      `\n✗ ${violations.length} import(s) of a confined package outside an adapters/ directory:\n`,
    );
    for (const v of violations) {
      console.error(`  ${v.path}  imports  ${v.pkg}`);
    }
    console.error(
      "\n  These may only be imported inside a features/*/adapters/ directory.",
    );
    console.error(
      "  The domain must not name the vendor — see class/server/ports.ts and",
    );
    console.error(
      "  research/accounts-and-scheduling/02 §6. Move the call behind a port.\n",
    );
    process.exit(1);
  }

  console.log("✓ No vendor SDK imported outside an adapters/ directory.");
}

// Importable for its tests without running the check.
if (process.argv[1] && process.argv[1].endsWith("check-adapter-boundary.mjs")) {
  main();
}
