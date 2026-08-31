import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { resolveTestSelection } from './resolve-test-selection.mjs';

const githubApiVersion = '2026-03-10';
const execFileAsync = promisify(execFile);

export async function dispatchAndCollect({
  env = process.env,
  fetchImpl = fetch,
  extractArchive = extractAllureArtifact,
  wait = delay,
  now = Date.now,
} = {}) {
  const token = required(env, 'GITHUB_ACTIONS_TOKEN');
  const repository = required(env, 'GITHUB_REPOSITORY');
  const workflow = env.GITHUB_WORKFLOW?.trim() || 'nightly-regression.yml';
  const ref = env.GITHUB_REF?.trim() || env.CI_COMMIT_REF_NAME?.trim() || 'main';
  const pipelineId = required(env, 'CI_PIPELINE_ID');
  const projectId = required(env, 'CI_PROJECT_ID');
  const branch = env.CI_COMMIT_REF_NAME?.trim() || ref;
  const testCategory = env.TEST_CATEGORY?.trim() || 'all';
  const testIds = env.TEST_IDS?.trim() || '';
  const testGrep = env.TEST_GREP?.trim() || '';
  resolveTestSelection({ category: testCategory, testIds, testGrep });
  const timeoutMs = positiveNumber(env.BRIDGE_TIMEOUT_MS, 4 * 60 * 60 * 1000);
  const pollIntervalMs = positiveNumber(env.BRIDGE_POLL_INTERVAL_MS, 15_000);
  const outputPath = path.resolve(env.BRIDGE_RESULT_PATH?.trim() || 'bridge-result.json');
  const reportPath = path.resolve(env.BRIDGE_REPORT_PATH?.trim() || 'allure-results.zip');
  const workspacePath = path.resolve(env.BRIDGE_WORKSPACE_PATH?.trim() || '.');
  const resultsPath = path.join(workspacePath, 'allure-results');
  const apiBase = `https://api.github.com/repos/${repository}`;

  const dispatchResponse = await githubRequest(
    fetchImpl,
    `${apiBase}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        ref,
        inputs: {
          publish_to_doqa: false,
          bridge_pipeline_id: pipelineId,
          bridge_project_id: projectId,
          bridge_branch: branch,
          test_category: testCategory,
          test_ids: testIds,
          test_grep: testGrep,
        },
      }),
    },
  );
  const runId = Number(dispatchResponse.workflow_run_id);
  if (!Number.isInteger(runId) || runId <= 0) {
    throw new Error('GitHub workflow dispatch did not return workflow_run_id');
  }
  const runUrl = dispatchResponse.html_url || `https://github.com/${repository}/actions/runs/${runId}`;
  console.log(`GitHub regression dispatched: ${runUrl}`);

  const deadline = now() + timeoutMs;
  let run;
  do {
    run = await githubRequest(fetchImpl, `${apiBase}/actions/runs/${runId}`, token);
    if (run.status !== 'completed') {
      if (now() >= deadline) throw new Error(`GitHub workflow ${runId} did not finish before timeout`);
      await wait(pollIntervalMs);
    }
  } while (run.status !== 'completed');

  const artifacts = await githubRequest(
    fetchImpl,
    `${apiBase}/actions/runs/${runId}/artifacts?per_page=100`,
    token,
  );
  const artifactName = `allure-results-${runId}`;
  const artifact = artifacts.artifacts?.find((candidate) => candidate.name === artifactName);
  if (!artifact?.archive_download_url) {
    throw new Error(`GitHub workflow ${runId} did not produce artifact ${artifactName}`);
  }
  const archiveResponse = await fetchImpl(artifact.archive_download_url, {
    headers: githubHeaders(token),
    redirect: 'follow',
  });
  if (!archiveResponse.ok) {
    throw new Error(`GitHub artifact download failed with HTTP ${archiveResponse.status}`);
  }
  await writeFile(reportPath, Buffer.from(await archiveResponse.arrayBuffer()));
  await extractArchive(reportPath, workspacePath);
  await assertAllureResultsPresent(resultsPath);

  const result = {
    runId,
    runUrl,
    conclusion: run.conclusion,
    reportPath,
    resultsPath,
    artifactName,
    testCategory,
    testIds,
    testGrep,
  };
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(`GitHub regression completed with conclusion: ${run.conclusion}`);
  return result;
}

export async function extractAllureArtifact(archivePath, destinationPath) {
  await mkdir(destinationPath, { recursive: true });
  await execFileAsync('unzip', ['-q', '-o', archivePath, '-d', destinationPath]);
}

export async function assertBridgeSuccess(
  resultPath = process.env.BRIDGE_RESULT_PATH || 'bridge-result.json',
) {
  const result = JSON.parse(await readFile(path.resolve(resultPath), 'utf8'));
  if (result.conclusion !== 'success') {
    throw new Error(`GitHub regression ${result.runId} finished with conclusion: ${result.conclusion}`);
  }
  return result;
}

async function assertAllureResultsPresent(resultsPath) {
  let entries;
  try {
    entries = await readdir(resultsPath, { recursive: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`GitHub artifact does not contain ${resultsPath}`);
    }
    throw error;
  }
  if (!entries.some((entry) => entry.endsWith('-result.json'))) {
    throw new Error(`GitHub artifact does not contain Allure result files in ${resultsPath}`);
  }
}

async function githubRequest(fetchImpl, url, token, init = {}) {
  const response = await fetchImpl(url, {
    ...init,
    headers: { ...githubHeaders(token), ...init.headers },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = null;
  }
  if (!response.ok) {
    const message = body?.message ? `: ${body.message}` : '';
    throw new Error(`GitHub API ${response.status}${message}`);
  }
  return body;
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': githubApiVersion,
  };
}

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes('--assert-success')) await assertBridgeSuccess();
    else {
      const result = await dispatchAndCollect();
      if (process.argv.includes('--assert-success-after-collect') && result.conclusion !== 'success') {
        throw new Error(`GitHub regression ${result.runId} finished with conclusion: ${result.conclusion}`);
      }
    }
  } catch (error) {
    console.error(`DoQA GitHub bridge failed: ${error.message}`);
    process.exitCode = 1;
  }
}
