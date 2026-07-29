import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeCaseData } from '../../mcp/doqa-client.mjs';

test('analyzeCaseData accepts a complete automation-ready case', () => {
  const result = analyzeCaseData({
    title: 'Login succeeds',
    description: '<p>Authentication flow</p>',
    preconditions: '<p>A dedicated user exists</p>',
    expectedResult: '<p>Dashboard is visible</p>',
    steps: [{ step: '<p>Submit valid credentials</p>', result: '<p>Dashboard opens</p>' }],
  });

  assert.equal(result.qualityScore, 100);
  assert.equal(result.automationScore, 100);
  assert.equal(result.recommendation, 'ready');
  assert.deepEqual(result.issues, []);
});

test('analyzeCaseData reports missing checks and exact duplicate steps', () => {
  const duplicateStep = { step: '<p>Click submit</p>', result: '', testData: null };
  const result = analyzeCaseData({
    title: 'Incomplete case',
    description: '',
    preconditions: '',
    expectedResult: '',
    steps: [duplicateStep, duplicateStep],
  });

  assert.equal(result.recommendation, 'needs_preparation');
  assert.ok(result.issues.includes('duplicate_steps'));
  assert.ok(result.issues.includes('step_1_missing_result'));
  assert.deepEqual(result.duplicateIndexes, [1]);
});
