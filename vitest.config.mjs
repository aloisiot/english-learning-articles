import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["site", "class", "lib", "scripts"],
    coverage: {
      provider: "v8",
      // Where the pure logic modules live — link signing, room-name
      // derivation, expiry arithmetic, sync codecs. The threshold below
      // is deliberately pointed at these rather than at the repo: a
      // repo-wide percentage would be met by testing the easy half.
      // See research/video-calls/08-implementation-plan.md.
      // Both shapes while the move to feature slices is in progress. The
      // globs change in the same commit as the modules, deliberately: the
      // threshold is configured by path, so moving a module out from under
      // its glob drops it from the report and the suite keeps passing while
      // guarding nothing. See research/accounts-and-scheduling/06 §4.
      include: [
        "class/features/*/domain/**/*.{js,mjs,ts,tsx}",
        "class/lib/**/*.{js,mjs,ts,tsx}",
        "lib/**/*.{js,mjs,ts,tsx}",
      ],
      // `text` for the terminal, `html` for `npm run test:coverage:open`.
      // Vitest also defaults to clover and json, which nothing here reads.
      reporter: ["text", "html"],
      thresholds: {
        100: true,
      },
    },
  },
});
