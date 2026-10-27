import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  outputDir: '.playwright/results',
  use: {
    baseURL: 'http://127.0.0.1:4422',
    viewport: { width: 1600, height: 1000 },
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
      args: ['--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: 'python3 scripts/serve.py --port 4422',
    url: 'http://127.0.0.1:4422/__beacon_health__',
    reuseExistingServer: false,
  },
});
