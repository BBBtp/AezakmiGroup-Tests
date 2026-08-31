import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { testSettings } from './config/test-settings';

const adminStorageState = path.resolve('.auth/admin.json');
const desktopChrome = {
  ...devices['Desktop Chrome'],
  viewport: { width: 1920, height: 1080 },
};
const unauthenticatedRegressionFiles = [
  '**/access-control.regression.spec.ts',
  '**/auth-ui.regression.spec.ts',
  '**/functionality.regression.spec.ts',
  '**/validation.regression.spec.ts',
];

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
  [
    'allure-playwright',
    {
      resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
      detail: false,
    },
  ],
  baseReporters.at(-1)!,
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
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

  projects: [
    {
      name: 'setup',
      testMatch: '**/*.setup.ts',
    },
    {
      name: 'smoke-auth',
      testMatch: '**/auth.smoke.spec.ts',
      use: desktopChrome,
    },
    {
      name: 'smoke',
      testMatch: '**/*.smoke.spec.ts',
      testIgnore: '**/auth.smoke.spec.ts',
      dependencies: ['setup'],
      use: {
        ...desktopChrome,
        storageState: adminStorageState,
      },
    },
    {
      name: 'regression-auth',
      testMatch: unauthenticatedRegressionFiles,
      use: desktopChrome,
    },
    {
      name: 'regression',
      testMatch: '**/*.regression.spec.ts',
      testIgnore: unauthenticatedRegressionFiles,
      dependencies: ['setup'],
      use: {
        ...desktopChrome,
        storageState: adminStorageState,
      },
    },
  ],
});
