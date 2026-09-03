import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    name: "class",
    environment: "node",
    // Feature tests live beside the feature they test — that is the
    // point of the layout. test/ survives the move holding only the
    // workspace harness, which belongs to no feature and mirrors the
    // same file in site/ and lib/.
    include: [
      "features/*/test/**/*.test.{ts,tsx}",
      "test/**/*.test.{ts,tsx}",
    ],
  },
});
