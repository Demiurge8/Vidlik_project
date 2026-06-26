import type { PlaywrightTestConfig } from "@playwright/test";

const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  `"${process.execPath}" node_modules/next/dist/bin/next dev`;

const config: PlaywrightTestConfig = {
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: webServerCommand,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      TURBOPACK: "0",
    },
  },
};

export default config;
