import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { DoqaClient } from '../mcp/doqa-client.mjs';
import { prepareAllureResults, verifyDoqaRun, writeZipArchive } from './allure-report.mjs';

export async function publishAllureResults({
  allureDir,
  title = `Автотесты ${new Date().toLocaleString('ru-RU')}`,
  client = new DoqaClient(),
}) {
  const workDir = await mkdtemp(path.join(os.tmpdir(), 'crm-doqa-publish-'));
  const publishableDir = path.join(workDir, 'allure-results');
  const archivePath = path.join(workDir, 'allure-results.zip');

  try {
    const preflight = await prepareAllureResults(allureDir, publishableDir);
    await writeZipArchive(publishableDir, archivePath);
    const run = await client.uploadAutotestReport({
      reportPath: archivePath,
      trustedRoot: workDir,
      type: 'allure',
      title,
    });
    const runId = Number(run.runId ?? run.id ?? run.data?.id);
    if (!Number.isInteger(runId) || runId <= 0) {
      throw new Error('DoQA upload did not return a valid run ID');
    }
    const verification = await waitForRunVerification(client, runId, preflight.allureIds);
    return {
      message: 'DoQA report uploaded and verified',
      title,
      preflight: {
        tests: preflight.testCount,
        allureIds: preflight.allureIds,
        statusCounts: preflight.statusCounts,
        excludedResults: preflight.excluded.length,
      },
      verification,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

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
