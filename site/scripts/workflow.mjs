/**
 * One command instead of three.
 *
 *   npm run dev:all     covers → build → dev   (start working)
 *   npm run build:all    covers → build         (finish writing)
 *
 * Why a Node script rather than `npm run covers && npm run build`:
 *
 * 1. **Covers must not abort the sequence.** Cover images are optional
 *    per article, and `download-covers.mjs` legitimately leaves entries
 *    queued when Wikimedia rate-limits a batch. Chaining with `&&` would
 *    treat that as fatal and skip the build — losing the search index
 *    rebuild over an image that can be fetched later. Here a covers
 *    failure prints a warning and the run continues.
 * 2. **Cross-platform.** `&&` chains behave differently in PowerShell,
 *    and this project already prefers Node over shell for that reason
 *    (see postbuild.mjs).
 * 3. **`dev` never exits.** It has to be the last step and must inherit
 *    the terminal, including Ctrl-C.
 */
import { spawn } from "node:child_process";

const MODES = {
  "dev": {
    steps: ["covers", "build", "dev"],
    describe: "covers → build → dev",
  },
  "content": {
    steps: ["covers", "build"],
    describe: "covers → build",
  },
};

// Steps that may fail without stopping the run. Cover images are
// additive — a missing one renders as no image, not a broken page.
const NON_FATAL = new Set(["covers"]);

/**
 * Set on every child process this runner spawns. If a nested run sees it
 * already set, one of the npm scripts below points back at this file and
 * we are in a cycle.
 *
 * This happened: `build` in package.json was repointed at
 * `workflow.mjs build`, so the runner's own build step re-entered the
 * runner, forever, printing plausible-looking output the whole time. The
 * only thing that stopped it was Ctrl-C. Delegating by npm script *name*
 * is convenient — it keeps the real commands defined in one place — but
 * it means a rename in package.json can quietly turn a sequence into a
 * loop. Failing fast is the trade for keeping that single definition.
 */
const GUARD = "EL_WORKFLOW_ACTIVE";

function runStep(script) {
  return new Promise((resolve) => {
    const child = spawn("npm", ["run", script], {
      stdio: "inherit",
      env: { ...process.env, [GUARD]: "1" },
      // npm resolves through a shell on Windows.
      shell: process.platform === "win32",
    });

    child.on("close", (code, signal) => resolve({ code, signal }));
    child.on("error", (err) => {
      console.error(`\nCould not start "npm run ${script}": ${err.message}`);
      resolve({ code: 1, signal: null });
    });
  });
}

async function main() {
  if (process.env[GUARD]) {
    console.error(
      `\nRefusing to run: scripts/workflow.mjs has re-entered itself.\n\n` +
        `One of the npm scripts it calls (covers, build, dev) points back at\n` +
        `this file, so the sequence would loop forever. Check "scripts" in\n` +
        `package.json — "dev" should be "next dev" and "build" should be\n` +
        `"next build && node scripts/postbuild.mjs". Only workflow:* entries\n` +
        `should reference workflow.mjs.\n`,
    );
    process.exit(1);
  }

  const mode = MODES[process.argv[2]];

  if (!mode) {
    console.error(
      `Usage: node scripts/workflow.mjs <${Object.keys(MODES).join("|")}>`,
    );
    process.exit(1);
  }

  const { steps } = mode;

  for (const [index, script] of steps.entries()) {
    const position = `[${index + 1}/${steps.length}]`;
    console.log(`\n${position} ${script}\n${"─".repeat(40)}`);

    const { code, signal } = await runStep(script);

    // Ctrl-C is how you stop `dev`, not a failure. npm usually absorbs
    // the signal and reports 128+signo as an ordinary exit code rather
    // than surfacing `signal` to us, so both forms have to be caught —
    // otherwise quitting the dev server prints "dev failed" and exits
    // 130, which looks alarming and breaks any calling script.
    const INTERRUPTED = new Set([130, 143]); // SIGINT, SIGTERM
    if (signal || INTERRUPTED.has(code)) {
      console.log(`\nStopped.`);
      process.exit(0);
    }

    if (code !== 0) {
      if (NON_FATAL.has(script)) {
        console.log(
          `\n! "${script}" did not finish cleanly — continuing anyway.\n` +
            `  Cover images are optional; anything unresolved stays queued in\n` +
            `  scripts/cover-images.json and can be retried with "npm run covers".`,
        );
        continue;
      }

      console.error(`\n"${script}" failed — stopping here.`);
      process.exit(code ?? 1);
    }
  }

  console.log(`\nDone (${mode.describe}).`);
}

main();
