import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { writeAllureMetadata } from '../../scripts/allure-metadata.mjs';
import { assertBridgeSuccess, dispatchAndCollect } from '../../scripts/github-actions-bridge.mjs';

test('dispatchAndCollect waits for GitHub and downloads the combined Allure artifact', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crm-ci-bridge-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const resultPath = path.join(root, 'bridge-result.json');
  const reportPath = path.join(root, 'allure-results.zip');
  const extractedArchives = [];
  const requests = [];
  const responses = [
    jsonResponse({ workflow_run_id: 456, html_url: 'https://github.test/actions/runs/456' }),
    jsonResponse({ status: 'in_progress', conclusion: null }),
    jsonResponse({ status: 'completed', conclusion: 'success' }),
    jsonResponse({
      artifacts: [
        {
          name: 'allure-results-456',
          archive_download_url: 'https://github.test/artifacts/456.zip',
        },
      ],
    }),
    new Response(Buffer.from('allure archive')),
  ];
  const fetchImpl = async (url, init) => {
    requests.push({ url, init });
    return responses.shift();
  };

  const result = await dispatchAndCollect({
    env: {
      GITHUB_ACTIONS_TOKEN: 'masked-token',
      GITHUB_REPOSITORY: 'owner/repository',
      CI_PIPELINE_ID: '100',
      CI_PROJECT_ID: '200',
      CI_COMMIT_REF_NAME: 'main',
      TEST_GREP: '@niches',
      BRIDGE_RESULT_PATH: resultPath,
      BRIDGE_REPORT_PATH: reportPath,
      BRIDGE_WORKSPACE_PATH: root,
    },
    fetchImpl,
    extractArchive: async (archivePath, destinationPath) => {
      extractedArchives.push({ archivePath, destinationPath });
      const resultsPath = path.join(destinationPath, 'allure-results');
      await mkdir(resultsPath, { recursive: true });
      await writeFile(path.join(resultsPath, 'example-result.json'), '{}');
    },
    wait: async () => {},
  });

  assert.equal(result.conclusion, 'success');
  assert.equal(await readFile(reportPath, 'utf8'), 'allure archive');
  assert.deepEqual(extractedArchives, [{ archivePath: reportPath, destinationPath: root }]);
  assert.equal(result.resultsPath, path.join(root, 'allure-results'));
  assert.equal((await assertBridgeSuccess(resultPath)).runId, 456);
  assert.equal(requests[0].init.headers.Authorization, 'Bearer masked-token');
  assert.deepEqual(JSON.parse(requests[0].init.body).inputs, {
    publish_to_doqa: false,
    bridge_pipeline_id: '100',
    bridge_project_id: '200',
    bridge_branch: 'main',
    test_grep: '@niches',
  });
  assert.equal(result.testGrep, '@niches');
  assert.doesNotMatch(JSON.stringify(await readFile(resultPath, 'utf8')), /masked-token/);
});

test('writeAllureMetadata records the stable report URL without credentials', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'crm-allure-metadata-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  await writeAllureMetadata({
    resultsDir: root,
    runUrl: 'https://github.test/actions/runs/456',
    reportUrl: 'https://owner.github.io/repository/',
    runId: '456',
    runNumber: '12',
    bridgePipelineId: '100',
    branch: 'main',
    commit: 'abc123',
    runnerOs: 'Linux',
    runnerArch: 'X64',
    browser: 'Chromium 140',
    nodeVersion: 'v20.19.0',
  });

  const executor = JSON.parse(await readFile(path.join(root, 'executor.json'), 'utf8'));
  const environment = await readFile(path.join(root, 'environment.properties'), 'utf8');
  assert.equal(executor.reportUrl, 'https://owner.github.io/repository/');
  assert.match(environment, /doqa\.bridge\.pipeline\.id=100/);
  assert.match(environment, /git\.branch=main/);
  assert.match(environment, /git\.commit=abc123/);
  assert.match(environment, /runner\.os=Linux/);
  assert.match(environment, /browser=Chromium 140/);
  assert.deepEqual(
    JSON.parse(await readFile(path.join(root, 'categories.json'), 'utf8')).map(({ name }) => name),
    ['Инфраструктурные проблемы', 'Проблемы автотеста', 'Дефекты продукта — требуется triage'],
  );
});

test('nightly regression uses one shard for filtered runs and three shards otherwise', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/nightly-regression.yml', import.meta.url),
    'utf8',
  );

  assert.match(workflow, /test_grep:/);
  assert.match(workflow, /fromJSON\(inputs\.test_grep != '' && '\[1\]' \|\| '\[1,2,3\]'\)/);
  assert.match(workflow, /REGRESSION_SHARD_TOTAL:.*inputs\.test_grep != '' && 1 \|\| 3/);
  assert.match(workflow, /args\+=\(--grep "\$TEST_GREP"\)/);
  assert.match(workflow, /actions\/cache\/restore@v4/);
  assert.match(workflow, /npm run allure:history:restore/);
  assert.match(workflow, /npm run allure:history:stage/);
  assert.match(workflow, /actions\/cache\/save@v4/);
});

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
