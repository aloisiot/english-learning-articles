import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["site", "class", "lib"],
    coverage: {
      provider: "v8",
      // Where Phase 3+'s pure logic modules (link signing, room-name
      // derivation, expiry arithmetic, sync codecs) are expected to
      // live. No files match yet — that's the point, see
      // research/video-calls/08-implementation-plan.md.
      include: ["class/lib/**/*.{js,mjs}", "lib/**/*.{js,mjs}"],
      thresholds: {
        100: true,
      },
    },
  },
});
