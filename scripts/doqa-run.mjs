import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import dotenv from 'dotenv';

import { DoqaClient } from '../mcp/doqa-client.mjs';
import { prepareAllureResults, verifyDoqaRun, writeZipArchive } from './allure-report.mjs';

dotenv.config();

const args = process.argv.slice(2);
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const workDir = await mkdtemp(path.join(os.tmpdir(), 'crm-doqa-run-'));
const allureDir = path.resolve('allure-results');
const publishableDir = path.join(workDir, 'allure-results');
const archivePath = path.join(workDir, 'allure-results.zip');

await rm(allureDir, { recursive: true, force: true });
await mkdir(allureDir, { recursive: true });

const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(command, ['playwright', 'test', ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('error', reject);
  child.on('close', (code) => resolve(code ?? 1));
});

let publishError = null;
try {
  if (exitCode !== 0) {
    throw new Error(`Playwright exited with code ${exitCode}; publishing a failed preflight is blocked`);
  }

  const preflight = await prepareAllureResults(allureDir, publishableDir);
  await writeZipArchive(publishableDir, archivePath);

  const client = new DoqaClient();
  const title = process.env.DOQA_RUN_TITLE?.trim() || `Автотесты ${new Date().toLocaleString('ru-RU')}`;
  const run = await client.uploadAutotestReport({
    reportPath: archivePath,
    trustedRoot: workDir,
    type: 'allure',
    title,
  });
  const runId = Number(run.runId ?? run.id ?? run.data?.id);
  if (!Number.isInteger(runId) || runId <= 0) throw new Error('DoQA upload did not return a valid run ID');
  const verification = await waitForRunVerification(client, runId, preflight.allureIds);
  console.log(
    JSON.stringify(
      {
        message: 'DoQA report uploaded and verified',
        title,
        preflight: {
          tests: preflight.testCount,
          allureIds: preflight.allureIds,
          excludedResults: preflight.excluded.length,
        },
        verification,
      },
      null,
      2,
    ),
  );
} catch (error) {
  publishError = error;
  console.error(`DoQA run was not created: ${error.message}`);
  if (error.details) console.error(`DoQA details: ${JSON.stringify(error.details)}`);
}

process.exitCode = Number(exitCode) || (publishError ? 1 : 0);
await rm(workDir, { recursive: true, force: true });

async function waitForRunVerification(client, runId, expectedIds) {
  const timeoutMs = Number(process.env.DOQA_VERIFY_TIMEOUT_MS || 30_000);
  const deadline = Date.now() + timeoutMs;
  let lastError;
  do {
    const [run, elements] = await Promise.all([client.getRun(runId), client.listRunElements(runId)]);
    try {
      return verifyDoqaRun(run, elements, expectedIds);
    } catch (error) {
      lastError = error;
    }
    if (Date.now() < deadline) await delay(1_000);
  } while (Date.now() < deadline);
  throw new Error(`DoQA run ${runId} was uploaded but failed verification: ${lastError?.message}`);
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
