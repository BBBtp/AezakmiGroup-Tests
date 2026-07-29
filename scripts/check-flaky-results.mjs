import fs from 'node:fs/promises';
import path from 'node:path';

import { analyzePlaywrightReport } from './playwright-report.mjs';

const inputArgument = process.argv.find((argument) => argument.startsWith('--input='));
const labelArgument = process.argv.find((argument) => argument.startsWith('--label='));
const inputPath = path.resolve(inputArgument?.slice('--input='.length) || 'test-results.json');
const label = labelArgument?.slice('--label='.length) || 'Playwright';

let reportText;
try {
  reportText = await fs.readFile(inputPath, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.warn(`Flaky check skipped: ${inputPath} does not exist`);
  process.exit(0);
}

let report;
try {
  report = JSON.parse(reportText);
} catch (error) {
  throw new Error(`Playwright JSON report is invalid: ${inputPath}: ${error.message}`);
}

const summary = analyzePlaywrightReport(report);
console.log(JSON.stringify({ label, ...summary }, null, 2));
await appendGitHubSummary(label, summary);

if (summary.flaky.length) {
  console.error(`Flaky tests detected: ${summary.flaky.map((testCase) => testCase.title).join(', ')}`);
  process.exitCode = 1;
}

async function appendGitHubSummary(summaryLabel, summary) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const rows = Object.entries(summary.counts)
    .map(([status, count]) => `| ${status} | ${count} |`)
    .join('\n');
  const flakyList = summary.flaky.length
    ? summary.flaky.map((testCase) => `- ${testCase.title}: ${testCase.statuses.join(' → ')}`).join('\n')
    : 'Flaky tests were not detected.';
  await fs.appendFile(
    summaryPath,
    `## ${summaryLabel}\n\n| Status | Tests |\n|---|---:|\n${rows}\n\n### Flaky control\n\n${flakyList}\n\n`,
  );
}
