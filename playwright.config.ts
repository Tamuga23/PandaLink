import { defineConfig } from "@playwright/test";

// Smoke test contra el dev server de Vite.
// Requiere una vez: npx playwright install chromium
export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1280, height: 800 }, // tablet horizontal
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
