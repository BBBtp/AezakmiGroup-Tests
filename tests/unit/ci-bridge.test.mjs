import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
      BRIDGE_RESULT_PATH: resultPath,
      BRIDGE_REPORT_PATH: reportPath,
    },
    fetchImpl,
    wait: async () => {},
  });

  assert.equal(result.conclusion, 'success');
  assert.equal(await readFile(reportPath, 'utf8'), 'allure archive');
  assert.equal((await assertBridgeSuccess(resultPath)).runId, 456);
  assert.equal(requests[0].init.headers.Authorization, 'Bearer masked-token');
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
  });

  const executor = JSON.parse(await readFile(path.join(root, 'executor.json'), 'utf8'));
  const environment = await readFile(path.join(root, 'environment.properties'), 'utf8');
  assert.equal(executor.reportUrl, 'https://owner.github.io/repository/');
  assert.match(environment, /doqa\.bridge\.pipeline\.id=100/);
});

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
