import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { restoreAllureHistory, stageAllureHistory } from '../../scripts/allure-history.mjs';

test('Allure history is staged from a report and restored into the next results', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crm-allure-history-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const reportDir = path.join(root, 'report');
  const cacheDir = path.join(root, 'cache');
  const resultsDir = path.join(root, 'results');
  await mkdir(path.join(reportDir, 'history'), { recursive: true });
  await writeFile(path.join(reportDir, 'history', 'history.json'), '{}\n');
  await writeFile(path.join(reportDir, 'history', 'history-trend.json'), '[]\n');
  await writeFile(path.join(reportDir, 'history', 'retry-trend.json'), '[]\n');

  const staged = await stageAllureHistory({ reportDir, cacheDir });
  const restored = await restoreAllureHistory({ cacheDir, resultsDir });

  assert.equal(staged.staged, true);
  assert.equal(restored.restored, true);
  assert.deepEqual(restored.files, ['history-trend.json', 'history.json', 'retry-trend.json']);
  assert.equal(await readFile(path.join(resultsDir, 'history', 'history.json'), 'utf8'), '{}\n');
});

test('Allure history restore is a no-op on the first run', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crm-allure-history-empty-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = await restoreAllureHistory({
    cacheDir: path.join(root, 'missing-cache'),
    resultsDir: path.join(root, 'results'),
  });

  assert.deepEqual(result, { restored: false, files: [] });
});
