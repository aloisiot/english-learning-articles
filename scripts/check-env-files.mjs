/**
 * `npm run check:env` — refuse to commit secrets that live in env files.
 *
 * Two rules, and the second is the one that earns this script its place:
 *
 * 1. **No env file but a template may be committed.** `.env`,
 *    `.env.local` and friends hold real credentials. .gitignore already
 *    says so in site/ and class/, but .gitignore is advisory — `git add
 *    -f` walks straight past it, and a workspace added later starts with
 *    no rules at all.
 *
 * 2. **A committed `.env.example` must declare no values.** This is the
 *    failure that actually happened: real values — an API key among
 *    them — were typed into class/.env.example, which is *tracked*,
 *    because it is the file that lists the variable names. Nothing in
 *    rule 1 would have caught it. The template is a list of names and
 *    comments; the moment a name has a value after it, the file has
 *    stopped being a template.
 *
 * Run over the index (default) for the pre-commit hook, or over
 * everything tracked (`--tracked`) for the push gate, where "is a secret
 * staged right now" is the wrong question and "is one in the repo at
 * all" is the right one.
 *
 * **No offending value is ever printed.** A hook that echoes the secret
 * it just caught into a terminal — and into CI logs — has moved the leak
 * rather than stopped it. Names and line numbers are enough to fix it.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** How a path is treated. */
export const SECRET_FILE = "secret";
export const EXAMPLE_FILE = "example";
export const NOT_AN_ENV_FILE = "other";

/**
 * Decide what kind of env file a path is, if any.
 *
 * `.envrc` and the like are left alone: they are a different tool's
 * file, and quietly claiming them would make this script's failures
 * surprising.
 */
export function classifyPath(path) {
  const base = path.slice(path.lastIndexOf("/") + 1);

  if (base !== ".env" && !base.startsWith(".env.")) return NOT_AN_ENV_FILE;
  if (base.endsWith(".example")) return EXAMPLE_FILE;

  return SECRET_FILE;
}

/**
 * Every `NAME=value` in a template that actually declares a value.
 *
 * Three things are read as "no value", because all three are ordinary in
 * a template and none of them can carry a secret: nothing after the `=`,
 * an explicitly empty `""` or `''`, and a trailing comment.
 */
export function declaredValues(contents) {
  const declared = [];

  contents.split(/\r?\n/).forEach((line, index) => {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(
      line,
    );
    if (match === null) return;

    const name = match[1];
    const value = match[2].trim();

    if (value === "") return;
    if (value === '""' || value === "''") return;
    if (value.startsWith("#")) return;

    declared.push({ line: index + 1, name });
  });

  return declared;
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`git ${args.join(" ")} failed:\n${result.stderr ?? ""}`);
    process.exit(1);
  }
  return result.stdout;
}

function nulSeparated(output) {
  return output.split("\0").filter((entry) => entry !== "");
}

/**
 * Paths to inspect, and how to read each one.
 *
 * Staged mode reads out of the index rather than off disk: those differ
 * whenever a file was edited after `git add`, and the index is what is
 * about to become a commit.
 */
function subject({ tracked }) {
  if (tracked) {
    return {
      label: "tracked files",
      paths: nulSeparated(git(["ls-files", "-z"])),
      read: (path) => {
        try {
          return readFileSync(path, "utf8");
        } catch {
          // Tracked but not on disk — a deletion that is not staged yet.
          return null;
        }
      },
    };
  }

  return {
    label: "staged changes",
    paths: nulSeparated(
      git(["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]),
    ),
    read: (path) => git(["show", `:${path}`]),
  };
}

function main() {
  const tracked = process.argv.includes("--tracked");
  const { label, paths, read } = subject({ tracked });

  const secrets = [];
  const templates = [];

  for (const path of paths) {
    const kind = classifyPath(path);
    if (kind === NOT_AN_ENV_FILE) continue;

    if (kind === SECRET_FILE) {
      secrets.push(path);
      continue;
    }

    const contents = read(path);
    if (contents === null) continue;

    const declared = declaredValues(contents);
    if (declared.length > 0) templates.push({ path, declared });
  }

  if (secrets.length === 0 && templates.length === 0) {
    console.log(`✓ No env-file secrets in ${label}.`);
    return;
  }

  console.error(`\n✗ Refusing to commit: env-file secrets in ${label}.\n`);

  if (secrets.length > 0) {
    console.error("These files hold real credentials and must not be committed:");
    for (const path of secrets) console.error(`    ${path}`);
    console.error(
      "\n  Unstage with:  git restore --staged <file>" +
        "\n  Keep it out for good by adding it to that workspace's .gitignore." +
        "\n  Only .env.example belongs in the repo.\n",
    );
  }

  if (templates.length > 0) {
    console.error(
      "These templates declare values. A template lists variable names;\n" +
        "a value after the `=` is a secret in a tracked file:",
    );
    for (const { path, declared } of templates) {
      for (const { line, name } of declared) {
        console.error(`    ${path}:${line}  ${name}`);
      }
    }
    console.error(
      "\n  Blank the value, and move any example into the comment above it." +
        "\n  If the real value was ever committed, rotate it — removing it" +
        "\n  from the working tree does not remove it from history.\n",
    );
  }

  console.error(
    "If you are certain this is wrong, `git commit --no-verify` skips this,\n" +
      "and `npm run check:env` runs it on its own.\n",
  );

  process.exit(1);
}

// Importable for tests, runnable as a hook. The realpath comparison is
// the ESM equivalent of `require.main === module`, and the realpath part
// matters: git hooks are reached through a symlinked path often enough
// that comparing the raw argv would silently stop running main().
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;

if (invokedDirectly) main();
