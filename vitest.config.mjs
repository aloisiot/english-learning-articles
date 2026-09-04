import { coverageConfigDefaults, defineConfig } from "vitest/config";

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
      //
      // One glob per feature's domain, and it is load-bearing: the
      // threshold is configured by path, so a module that moves out from
      // under its glob leaves the report entirely and the suite goes on
      // passing, guarding nothing and looking exactly as green. Any move
      // of a domain module changes this line in the same commit.
      // See research/accounts-and-scheduling/06 §4.
      include: [
        "class/features/*/domain/**/*.{js,mjs,ts,tsx}",
        "lib/**/*.{js,mjs,ts,tsx}",
      ],
      // Presentational components are exempt, and the rule is the file
      // extension rather than a list of paths, so it cannot go stale:
      // in lib/, .tsx is a component and .ts is logic.
      //
      // An icon holds no decision. Covering one means rendering it and
      // asserting its path data, which is the golden-value mistake this
      // repo already names — a test that asserts the code does what the
      // code does. The threshold exists for modules that decide things,
      // and it is worth more if it is not diluted by markup.
      // Spread rather than replaced: passing a bare array overrides
      // Vitest's own exclusions, which is how lib/vitest.config.mjs
      // turned up in the report at 0% the first time this was written.
      exclude: [...coverageConfigDefaults.exclude, "lib/**/*.tsx"],
      // `text` for the terminal, `html` for `npm run test:coverage:open`.
      // Vitest also defaults to clover and json, which nothing here reads.
      reporter: ["text", "html"],
      thresholds: {
        100: true,
      },
    },
  },
});
