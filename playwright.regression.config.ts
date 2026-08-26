import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config';

const sharedSettingsFiles = ['**/kpi-settings-ui.regression.spec.ts', '**/kpi-settings.regression.spec.ts'];

const project = (name: string) => {
  const matchedProject = baseConfig.projects?.find((candidate) => candidate.name === name);
  if (!matchedProject) throw new Error(`Base Playwright project is missing: ${name}`);
  return matchedProject;
};

const setupProject = project('setup');
const authProject = project('regression-auth');
const regressionProject = project('regression');
const regressionTestIgnore = Array.isArray(regressionProject.testIgnore)
  ? regressionProject.testIgnore
  : regressionProject.testIgnore
    ? [regressionProject.testIgnore]
    : [];

const regressionReporters: any[] = [
  ['./utils/diagnostic-reporter.ts'],
  ['blob'],
  ['json', { outputFile: 'test-results.json' }],
  [
    'allure-playwright',
    {
      resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
      detail: false,
    },
  ],
  ['line'],
];

export default defineConfig({
  ...baseConfig,
  reporter: regressionReporters,
  projects: [
    setupProject,
    authProject,
    {
      ...regressionProject,
      name: 'regression-read-only',
      testIgnore: [...regressionTestIgnore, ...sharedSettingsFiles],
    },
    {
      ...regressionProject,
      name: 'regression-settings',
      testMatch: sharedSettingsFiles,
      testIgnore: [],
      workers: 1,
    },
  ],
});
