import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzePlaywrightReport } from '../../scripts/playwright-report.mjs';

test('analyzePlaywrightReport detects a test that passes only after retry', () => {
  const summary = analyzePlaywrightReport({
    suites: [
      {
        title: 'KPI',
        specs: [
          {
            title: 'loads dashboard',
            tests: [{ results: [{ status: 'failed' }, { status: 'passed' }] }],
          },
        ],
      },
    ],
  });

  assert.equal(summary.tests, 1);
  assert.equal(summary.counts.passed, 1);
  assert.deepEqual(summary.flaky, [{ title: 'KPI › loads dashboard', statuses: ['failed', 'passed'] }]);
});

test('analyzePlaywrightReport summarizes stable and failed tests without false flaky results', () => {
  const summary = analyzePlaywrightReport({
    suites: [
      {
        title: 'Auth',
        specs: [
          { title: 'login', tests: [{ results: [{ status: 'passed' }] }] },
          { title: 'logout', tests: [{ results: [{ status: 'timedOut' }] }] },
        ],
      },
    ],
  });

  assert.equal(summary.tests, 2);
  assert.deepEqual(summary.counts, {
    passed: 1,
    failed: 1,
    skipped: 0,
    interrupted: 0,
    other: 0,
  });
  assert.deepEqual(summary.flaky, []);
});
