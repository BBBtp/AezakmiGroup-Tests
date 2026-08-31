import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function writeAllureMetadata({
  resultsDir,
  runUrl,
  reportUrl = runUrl,
  runId,
  runNumber,
  bridgePipelineId,
  branch = process.env.GITHUB_REF_NAME,
  commit = process.env.GITHUB_SHA,
  runnerOs = process.env.RUNNER_OS,
  runnerArch = process.env.RUNNER_ARCH,
  browser = 'Chromium',
  nodeVersion = process.version,
  categoriesFile = path.resolve('config/allure/categories.json'),
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
  await copyFile(categoriesFile, path.join(outputDir, 'categories.json'));
  const properties = [
    'environment=CRM S1',
    `browser=${escapeProperty(browser)}`,
    `node.version=${escapeProperty(nodeVersion)}`,
    runnerOs ? `runner.os=${escapeProperty(runnerOs)}` : null,
    runnerArch ? `runner.arch=${escapeProperty(runnerArch)}` : null,
    branch ? `git.branch=${escapeProperty(branch)}` : null,
    commit ? `git.commit=${escapeProperty(commit)}` : null,
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
    reportUrl: process.env.ALLURE_REPORT_URL?.trim() || process.env.GITHUB_RUN_URL,
    runId: process.env.GITHUB_RUN_ID,
    runNumber: process.env.GITHUB_RUN_NUMBER,
    bridgePipelineId: process.env.DOQA_BRIDGE_PIPELINE_ID,
  });
}
