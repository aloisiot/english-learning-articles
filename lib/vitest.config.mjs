import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "lib",
    environment: "node",
    include: ["test/**/*.test.{js,jsx}"],
  },
});
