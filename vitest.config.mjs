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
      // `text` for the terminal, `html` for `npm run test:coverage:open`.
      // Vitest also defaults to clover and json, which nothing here reads.
      reporter: ["text", "html"],
      thresholds: {
        100: true,
      },
    },
  },
});
