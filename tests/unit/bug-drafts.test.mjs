import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { generateBugDrafts, redactSensitive, resetBugDraftOutput } from '../../scripts/bug-drafts.mjs';

test('generateBugDrafts creates copy-ready text and safe evidence package', async (t) => {
  const root = await temporaryDirectory(t);
  const allureDir = path.join(root, 'allure-results');
  const outputDir = path.join(root, 'bug-drafts');
  await mkdir(allureDir);
  await writeFile(path.join(allureDir, 'screen.png'), 'image');
  await writeFile(path.join(allureDir, 'video.webm'), 'video');
  await writeFile(path.join(allureDir, 'error-context.md'), 'password=context-secret');
  await writeFile(path.join(allureDir, 'stdout.txt'), 'password=should-not-be-copied');
  await writeFile(
    path.join(allureDir, 'failed-result.json'),
    JSON.stringify({
      name: 'Regular user access',
      fullName: 'regression/access-control.regression.spec.ts:28:7',
      status: 'failed',
      statusDetails: {
        message: 'Expected dashboard. authorization: Bearer private-token password=private-value',
      },
      labels: [
        { name: 'ALLURE_ID', value: '568' },
        { name: 'parentSuite', value: 'regression-auth' },
      ],
      attachments: [
        { name: 'stdout', source: 'stdout.txt', type: 'text/plain' },
        { name: 'screenshot', source: 'screen.png', type: 'image/png' },
      ],
      steps: [
        {
          attachments: [
            { name: 'video', source: 'video.webm', type: 'video/webm' },
            {
              name: 'error-context',
              source: 'error-context.md',
              type: 'text/markdown',
            },
          ],
        },
      ],
    }),
  );
  const client = {
    async getCase() {
      return {
        case: {
          id: 568,
          title: 'Regular user не получает admin-действия',
          priority: 'high',
          preconditions: '<p>Regular user авторизован.</p>',
          expectedResult: '<p>Пользователь остаётся авторизованным.</p>',
          steps: [
            {
              step: '<p>Вернуться на Dashboard.</p>',
              result: '<p>Dashboard отображается.</p>',
            },
          ],
        },
      };
    },
    async listRunBugs() {
      return { bugs: [], meta: null };
    },
  };

  const result = await generateBugDrafts({
    allureDir,
    outputDir,
    runId: 349,
    client,
  });
  const markdown = await readFile(path.join(outputDir, 'TC-568', 'bug.md'), 'utf8');
  const json = JSON.parse(await readFile(path.join(outputDir, 'TC-568', 'draft.json'), 'utf8'));

  assert.equal(result.failures, 1);
  assert.equal(result.drafts[0].attachments, 3);
  assert.match(markdown, /\[AUTO\]\[TC-568\]/);
  assert.match(markdown, /DoQA run: 349/);
  assert.doesNotMatch(markdown, /private-token|private-value|should-not-be-copied/);
  assert.equal(json.attachments[0].file, '01-screenshot.png');
  assert.equal(json.attachments[1].file, '02-video.webm');
  assert.equal(json.attachments[2].file, '03-error-context.md');
  assert.equal(await readFile(path.join(outputDir, 'TC-568', '01-screenshot.png'), 'utf8'), 'image');
  assert.equal(
    await readFile(path.join(outputDir, 'TC-568', '03-error-context.md'), 'utf8'),
    'password=[REDACTED]',
  );
});

test('generateBugDrafts writes an empty index when there are no failures', async (t) => {
  const root = await temporaryDirectory(t);
  const allureDir = path.join(root, 'allure-results');
  const outputDir = path.join(root, 'bug-drafts');
  await mkdir(allureDir);
  await writeFile(
    path.join(allureDir, 'passed-result.json'),
    JSON.stringify({
      name: 'Passed',
      status: 'passed',
      labels: [{ name: 'ALLURE_ID', value: '568' }],
    }),
  );

  const result = await generateBugDrafts({
    allureDir,
    outputDir,
    client: {},
  });

  assert.equal(result.failures, 0);
  assert.match(await readFile(path.join(outputDir, 'README.md'), 'utf8'), /результатов.*нет/i);
});

test('generateBugDrafts keeps only the latest failed retry for an Allure ID', async (t) => {
  const root = await temporaryDirectory(t);
  const allureDir = path.join(root, 'allure-results');
  const outputDir = path.join(root, 'bug-drafts');
  await mkdir(allureDir);
  await writeAllureResult(allureDir, 'first-result.json', {
    status: 'failed',
    stop: 100,
    message: 'First attempt',
  });
  await writeAllureResult(allureDir, 'retry-result.json', {
    status: 'broken',
    stop: 200,
    message: 'Latest retry',
  });

  const result = await generateBugDrafts({
    allureDir,
    outputDir,
    client: bugDraftClient(),
  });
  const json = JSON.parse(await readFile(path.join(outputDir, 'TC-571', 'draft.json'), 'utf8'));
  const index = await readFile(path.join(outputDir, 'README.md'), 'utf8');

  assert.equal(result.failures, 1);
  assert.equal(result.drafts.length, 1);
  assert.equal(json.status, 'broken');
  assert.equal(json.actualResult, 'Latest retry');
  assert.equal(index.match(/\| 571 \|/g)?.length, 1);
});

test('generateBugDrafts ignores an earlier failure when the final retry passed', async (t) => {
  const root = await temporaryDirectory(t);
  const allureDir = path.join(root, 'allure-results');
  const outputDir = path.join(root, 'bug-drafts');
  await mkdir(allureDir);
  await writeAllureResult(allureDir, 'failed-result.json', {
    status: 'failed',
    stop: 100,
    message: 'Transient failure',
  });
  await writeAllureResult(allureDir, 'passed-retry-result.json', {
    status: 'passed',
    stop: 200,
  });

  const result = await generateBugDrafts({
    allureDir,
    outputDir,
    client: {},
  });

  assert.equal(result.failures, 0);
  assert.equal(result.drafts.length, 0);
});

test('generateBugDrafts excludes a missing KPI dataset from product bug drafts', async (t) => {
  const root = await temporaryDirectory(t);
  const allureDir = path.join(root, 'allure-results');
  const outputDir = path.join(root, 'bug-drafts');
  await mkdir(allureDir);
  await writeFile(
    path.join(allureDir, 'kpi-result.json'),
    JSON.stringify({
      name: 'KPI statistics',
      fullName: 'regression/kpi-staff-api.regression.spec.ts:15:7',
      status: 'failed',
      statusDetails: {
        message:
          '[KPI_DATA_UNAVAILABLE] requires at least 1 KPI manager(s); received managers=0, managersWithStartScore=0',
      },
      labels: [
        { name: 'ALLURE_ID', value: '902' },
        { name: 'parentSuite', value: 'regression' },
      ],
    }),
  );
  const client = {
    async getCase() {
      throw new Error('DoQA must not be called for an environment precondition');
    },
    async listRunBugs() {
      throw new Error('Duplicate search must not run for an environment precondition');
    },
  };

  const result = await generateBugDrafts({ allureDir, outputDir, runId: 400, client });
  const index = await readFile(path.join(outputDir, 'README.md'), 'utf8');

  assert.equal(result.failures, 1);
  assert.equal(result.drafts.length, 0);
  assert.deepEqual(result.excluded, [
    {
      caseId: 902,
      classification: 'environment',
      reason: 'kpi_test_data_unavailable',
      evidence:
        '[KPI_DATA_UNAVAILABLE] requires at least 1 KPI manager(s); received managers=0, managersWithStartScore=0',
    },
  ]);
  assert.match(index, /Исключено из продуктовых багов/);
  assert.match(index, /\| 902 \| environment \| kpi_test_data_unavailable \|/);
});

test('resetBugDraftOutput refuses to delete its trusted root', async (t) => {
  const root = await temporaryDirectory(t);
  await assert.rejects(resetBugDraftOutput(root, root), /must be a child/);
  assert.equal(
    redactSensitive('token=abc password: xyz authorization: Bearer qwerty'),
    'token=[REDACTED] password: [REDACTED] authorization: Bearer [REDACTED]',
  );
});

async function writeAllureResult(allureDir, file, { status, stop, message }) {
  await writeFile(
    path.join(allureDir, file),
    JSON.stringify({
      name: 'Navigation',
      fullName: 'regression/navigation-dashboard.regression.spec.ts:26:7',
      status,
      stop,
      statusDetails: message ? { message } : undefined,
      labels: [
        { name: 'ALLURE_ID', value: '571' },
        { name: 'parentSuite', value: 'regression' },
      ],
    }),
  );
}

function bugDraftClient() {
  return {
    async getCase() {
      return {
        case: {
          id: 571,
          title: 'Navigation',
          expectedResult: 'Dashboard доступен.',
        },
      };
    },
    async listRunBugs() {
      return { bugs: [], meta: null };
    },
  };
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'crm-bug-draft-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
