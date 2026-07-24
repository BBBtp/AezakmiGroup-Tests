import { defineConfig, devices } from '@playwright/test';
import { testSettings } from './config/test-settings';

const baseReporters: any[] = [
  ['blob'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'test-results.json' }],
  ['junit', { outputFile: 'results.xml' }],
  ['line'],
];

const reporters = [
  ['./utils/diagnostic-reporter.ts'],
  ...baseReporters.slice(0, -1),
  ['allure-playwright', { outputFolder: process.env.ALLURE_RESULTS_DIR || 'allure-results' }],
  baseReporters.at(-1)!,
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  reporter: reporters,

  use: {
    baseURL: testSettings.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: process.env.CI ? 60000 : 30000,
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
