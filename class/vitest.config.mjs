import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "class",
    environment: "node",
    include: ["test/**/*.test.{js,jsx}"],
  },
});
