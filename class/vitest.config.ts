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
    // Both shapes, while the migration to feature slices is in progress:
    // test/ is the old flat directory, features/*/test/ the new home
    // beside the module each file tests.
    include: [
      "test/**/*.test.{ts,tsx}",
      "features/*/test/**/*.test.{ts,tsx}",
    ],
  },
});
