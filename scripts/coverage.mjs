/**
 * `npm run test:coverage:open` — run the suite with coverage, then open
 * the HTML report in a browser.
 *
 * A Node script rather than `vitest run --coverage && open coverage/...`
 * for the two reasons this repo already prefers Node over shell (see
 * site/scripts/postbuild.mjs and workflow.mjs): `open` is macOS-only,
 * and `&&` behaves differently in PowerShell.
 *
 * The report opens even when the run fails. A failure is usually a
 * coverage threshold, and the report is exactly what tells you which
 * branch went uncovered — so hiding it on failure would hide the answer.
 * The exit code is still Vitest's, so this stays usable in a gate.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPORT = path.join(process.cwd(), "coverage", "index.html");

const OPENERS = {
  darwin: ["open", []],
  win32: ["cmd", ["/c", "start", ""]],
};

function openReport() {
  if (!fs.existsSync(REPORT)) {
    console.error(`\nNo coverage report at ${REPORT}.`);
    return;
  }

  const [command, args] = OPENERS[process.platform] ?? ["xdg-open", []];
  const opened = spawnSync(command, [...args, REPORT], { stdio: "ignore" });

  if (opened.error) {
    // Not a failure worth a non-zero exit: the report exists and the
    // path is right there to open by hand.
    console.log(`\nCoverage report written to ${REPORT}`);
    return;
  }

  console.log(`\nOpened ${REPORT}`);
}

const run = spawnSync("npx", ["vitest", "run", "--coverage"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

openReport();

process.exit(run.status ?? 1);
