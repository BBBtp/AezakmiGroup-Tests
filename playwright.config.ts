import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'results.xml' }],
    ['line']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://totally-adequate-goldfinch.cloudpub.ru/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    viewport: { width: 1280, height: 720 },
  },

  timeout: 60000,
  expect: { timeout: 10000 },

  globalSetup: './fixtures/global-setup.ts',

  projects: [
    { name: 'smoke', testMatch: '**/*.smoke.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }, retries: process.env.CI ? 2 : 1  },
    { name: 'regression', testMatch: '**/*.regression.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } }, retries: process.env.CI ? 2 : 1 },
  ],
});
