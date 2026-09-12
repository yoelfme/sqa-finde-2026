import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.spec.js"],
    exclude: ["**/node_modules/**"],
    testTimeout: 45_000,
    hookTimeout: 45_000,
    fileParallelism: false,
  },
});
