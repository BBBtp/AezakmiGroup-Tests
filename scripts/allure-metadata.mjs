import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function writeAllureMetadata({
  resultsDir,
  runUrl,
  reportUrl = runUrl,
  runId,
  runNumber,
  bridgePipelineId,
}) {
  if (!resultsDir?.trim()) throw new Error('Allure results directory is required');
  if (!runUrl?.trim()) throw new Error('GitHub run URL is required');
  const outputDir = path.resolve(resultsDir);
  await mkdir(outputDir, { recursive: true });
  const executor = {
    name: 'GitHub Actions',
    type: 'github',
    buildOrder: Number(runNumber) || undefined,
    buildName: `CRM regression #${runNumber || runId}`,
    buildUrl: runUrl,
    reportName: 'CRM regression Allure report',
    reportUrl,
  };
  await writeFile(path.join(outputDir, 'executor.json'), `${JSON.stringify(executor, null, 2)}\n`);
  const properties = [
    `github.run.url=${escapeProperty(runUrl)}`,
    `allure.report.url=${escapeProperty(reportUrl)}`,
    bridgePipelineId ? `doqa.bridge.pipeline.id=${escapeProperty(bridgePipelineId)}` : null,
  ].filter(Boolean);
  await writeFile(path.join(outputDir, 'environment.properties'), `${properties.join('\n')}\n`);
  return executor;
}

function escapeProperty(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('\n', '\\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeAllureMetadata({
    resultsDir: process.env.ALLURE_RESULTS_DIR,
    runUrl: process.env.GITHUB_RUN_URL,
    reportUrl:
      process.env.ALLURE_PAGES_ENABLED === 'true' ? process.env.ALLURE_PAGES_URL : process.env.GITHUB_RUN_URL,
    runId: process.env.GITHUB_RUN_ID,
    runNumber: process.env.GITHUB_RUN_NUMBER,
    bridgePipelineId: process.env.DOQA_BRIDGE_PIPELINE_ID,
  });
}
