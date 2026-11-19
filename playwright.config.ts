import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = `http://localhost:${port}`;
const e2eDatabase = "data/rewind-e2e.db";

for (const suffix of ["", "-wal", "-shm"]) {
  fs.rmSync(`${e2eDatabase}${suffix}`, { force: true });
}

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI
      ? "npm run start -- --port 3000"
      : "npm run db:setup && npm run build && npm run start -- --port 3000",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      REWIND_DB_PATH: e2eDatabase,
    },
  },
});
