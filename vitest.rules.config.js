// Security-rules tests only: run against the Firestore + Storage emulators via
// `npm run test:rules` (firebase emulators:exec). Excluded from the unit run.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
    fileParallelism: false, // both files share one emulator
    testTimeout: 20000,
  },
});
