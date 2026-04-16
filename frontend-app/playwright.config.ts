import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ??
  // Docker prod-like stack: nginx serves Next + /api on one port.
  "http://127.0.0.1:8080";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  // This suite shares a single local DB/API; keep deterministic locally.
  workers: process.env.CI ? 1 : 1,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Dev server will be started manually
  // Run: npm run dev (in separate terminal) before running tests
});
