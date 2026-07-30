import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateReportPath } from '../../mcp/doqa-client.mjs';
import { prepareAllureResults, verifyDoqaRun, writeZipArchive } from '../../scripts/allure-report.mjs';

test('prepareAllureResults keeps mapped passed, failed and skipped tests with attachments', async (t) => {
  const root = await temporaryDirectory(t);
  const source = path.join(root, 'source');
  const output = path.join(root, 'publishable');
  await mkdir(source);
  await writeFile(
    path.join(source, 'valid-result.json'),
    JSON.stringify({
      name: 'Mapped test',
      status: 'passed',
      labels: [{ name: 'ALLURE_ID', value: '812' }],
      attachments: [{ source: 'evidence.txt' }],
    }),
  );
  await writeFile(
    path.join(source, 'setup-result.json'),
    JSON.stringify({ name: 'authenticate', labels: [] }),
  );
  await writeFile(
    path.join(source, 'skipped-result.json'),
    JSON.stringify({
      name: 'Skipped mapped test',
      status: 'skipped',
      labels: [{ name: 'ALLURE_ID', value: '813' }],
    }),
  );
  await writeFile(
    path.join(source, 'failed-result.json'),
    JSON.stringify({
      name: 'Failed mapped test',
      status: 'failed',
      labels: [{ name: 'ALLURE_ID', value: '814' }],
    }),
  );
  await writeFile(path.join(source, 'evidence.txt'), 'diagnostic evidence');

  const result = await prepareAllureResults(source, output);

  assert.equal(result.testCount, 3);
  assert.deepEqual(result.allureIds, ['812', '813', '814']);
  assert.deepEqual(result.statusCounts, { passed: 1, skipped: 1, failed: 1 });
  assert.equal(result.excluded.length, 1);
  assert.equal(await readFile(path.join(output, 'evidence.txt'), 'utf8'), 'diagnostic evidence');
});

test('prepareAllureResults rejects duplicate Allure IDs', async (t) => {
  const root = await temporaryDirectory(t);
  const source = path.join(root, 'source');
  await mkdir(source);
  const result = (name) =>
    JSON.stringify({ name, status: 'passed', labels: [{ name: 'ALLURE_ID', value: '900' }] });
  await writeFile(path.join(source, 'first-result.json'), result('First'));
  await writeFile(path.join(source, 'second-result.json'), result('Second'));

  await assert.rejects(prepareAllureResults(source, path.join(root, 'output')), /duplicate test-case ID 900/);
});

test('prepareAllureResults publishes only the final retry of the same test', async (t) => {
  const root = await temporaryDirectory(t);
  const source = path.join(root, 'source');
  const output = path.join(root, 'publishable');
  await mkdir(source);
  await writeFile(
    path.join(source, 'first-result.json'),
    allureResult({
      status: 'failed',
      stop: 100,
      attachment: 'first.png',
    }),
  );
  await writeFile(
    path.join(source, 'retry-result.json'),
    allureResult({
      status: 'passed',
      stop: 200,
      attachment: 'retry.png',
    }),
  );
  await writeFile(path.join(source, 'first.png'), 'first');
  await writeFile(path.join(source, 'retry.png'), 'retry');

  const result = await prepareAllureResults(source, output);

  assert.equal(result.testCount, 1);
  assert.deepEqual(result.allureIds, ['568']);
  assert.deepEqual(result.statusCounts, { passed: 1 });
  assert.deepEqual(result.excluded, [
    {
      file: 'first-result.json',
      name: 'Regular user access',
      reason: 'superseded_retry',
    },
  ]);
  assert.equal(await readFile(path.join(output, 'retry.png'), 'utf8'), 'retry');
  await assert.rejects(readFile(path.join(output, 'first.png'), 'utf8'), { code: 'ENOENT' });
});

test('prepareAllureResults still rejects the same Allure ID for different test histories', async (t) => {
  const root = await temporaryDirectory(t);
  const source = path.join(root, 'source');
  await mkdir(source);
  await writeFile(
    path.join(source, 'first-result.json'),
    allureResult({ historyId: 'history-a', status: 'passed', stop: 100 }),
  );
  await writeFile(
    path.join(source, 'second-result.json'),
    allureResult({ historyId: 'history-b', status: 'passed', stop: 200 }),
  );

  await assert.rejects(prepareAllureResults(source, path.join(root, 'output')), /duplicate test-case ID 568/);
});

test('validateReportPath enforces trusted directory, type, size and non-empty archive', async (t) => {
  const root = await temporaryDirectory(t);
  const trusted = path.join(root, 'trusted');
  await mkdir(trusted);
  const archive = path.join(trusted, 'allure.zip');
  await writeFile(archive, 'zip-content');

  const valid = await validateReportPath(archive, { type: 'allure', trustedRoot: trusted });
  assert.equal(valid.size, 11);

  const outside = path.join(root, 'outside.zip');
  await writeFile(outside, 'zip-content');
  await assert.rejects(
    validateReportPath(outside, { type: 'allure', trustedRoot: trusted }),
    /trusted report directory/,
  );

  const empty = path.join(trusted, 'empty.zip');
  await writeFile(empty, '');
  await assert.rejects(
    validateReportPath(empty, { type: 'allure', trustedRoot: trusted }),
    /empty autotest report/,
  );
});

test('writeZipArchive refuses an empty report directory', async (t) => {
  const root = await temporaryDirectory(t);
  const source = path.join(root, 'empty');
  await mkdir(source);

  await assert.rejects(writeZipArchive(source, path.join(root, 'report.zip')), /No report files/);
});

test('verifyDoqaRun checks counts, progress, elements and Allure ID mapping', () => {
  const verified = verifyDoqaRun(
    { id: 321, counts: { tests: 2 }, progress: { passed: 2 } },
    [{ viewId: 812 }, { caseId: 813 }],
    ['812', '813'],
  );
  assert.equal(verified.runId, 321);
  assert.equal(verified.tests, 2);

  assert.throws(
    () =>
      verifyDoqaRun(
        { id: 321, counts: { tests: 2 }, progress: { passed: 2 } },
        [{ viewId: 812 }, { viewId: 999 }],
        ['812', '813'],
      ),
    /missing test-case mappings.*813/,
  );
});

function allureResult({ historyId = 'regular-user-access-history', status, stop, attachment }) {
  return JSON.stringify({
    name: 'Regular user access',
    fullName: 'regression/access-control.regression.spec.ts:28:7',
    historyId,
    testCaseId: 'regular-user-access-test',
    status,
    start: stop - 10,
    stop,
    labels: [{ name: 'ALLURE_ID', value: '568' }],
    attachments: attachment ? [{ source: attachment }] : [],
  });
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'crm-doqa-test-'));
  t.after(async () => {
    const { rm } = await import('node:fs/promises');
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}
