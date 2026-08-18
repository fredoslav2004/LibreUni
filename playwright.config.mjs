import { defineConfig, devices } from '@playwright/test';

// Keep local and CI browser runs quiet when the host injects conflicting color
// settings. Node warns whenever NO_COLOR is present alongside FORCE_COLOR.
delete process.env.NO_COLOR;
process.env.FORCE_COLOR = '0';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
  ],
  use: {
    actionTimeout: 10_000,
    baseURL: 'http://127.0.0.1:4321',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node tools/run-test-server.mjs',
    reuseExistingServer: !isCI,
    timeout: 120_000,
    url: 'http://127.0.0.1:4321/',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: /e2e\/.*\.spec\.mjs/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'mobile-chrome',
      testMatch: /e2e\/.*\.spec\.mjs/,
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'ux',
      testMatch: /ux\/.*\.spec\.mjs/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'visual',
      testMatch: /visual\/.*\.spec\.mjs/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
});
