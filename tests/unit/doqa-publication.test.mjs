import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { publishAllureResults } from '../../scripts/doqa-publication.mjs';

test('publishAllureResults uploads a filtered archive and verifies the created run', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crm-doqa-publication-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const allureDir = path.join(root, 'allure-results');
  await mkdir(allureDir);
  await writeFile(
    path.join(allureDir, 'mapped-result.json'),
    JSON.stringify({
      name: 'Mapped test',
      status: 'passed',
      labels: [{ name: 'ALLURE_ID', value: '812' }],
    }),
  );
  let uploaded;
  const client = {
    async uploadAutotestReport(input) {
      uploaded = input;
      assert.ok((await stat(input.reportPath)).size > 0);
      return { runId: 321 };
    },
    async getRun() {
      return { id: 321, counts: { tests: 1 }, progress: { passed: 1 } };
    },
    async listRunElements() {
      return [{ viewId: 812 }];
    },
  };

  const result = await publishAllureResults({ allureDir, title: 'CI regression', client });

  assert.equal(uploaded.title, 'CI regression');
  assert.equal(uploaded.type, 'allure');
  assert.equal(result.verification.runId, 321);
  assert.deepEqual(result.preflight.allureIds, ['812']);
});
