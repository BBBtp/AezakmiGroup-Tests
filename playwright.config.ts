import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }],
    ['json', {
      outputFile: 'test-results.json'
    }],
    ['junit', {
      outputFile: 'results.xml'
    }],
    ['line']
  ],

  use: {
    baseURL: 'https://totally-adequate-goldfinch.cloudpub.ru/',

    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    viewport: { width: 1280, height: 720 },
  },

  timeout: 60000,
  expect: {
    timeout: 10000
  },

  globalSetup: './fixtures/global-setup.ts',

  projects: [
    {
      name: 'smoke',
      testMatch: '**/*.smoke.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      retries: 1,
    },
    {
      name: 'regression',
      testMatch: '**/*.regression.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      retries: 1,
    },
  ],
});