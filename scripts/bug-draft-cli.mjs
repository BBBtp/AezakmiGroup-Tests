import path from 'node:path';

import dotenv from 'dotenv';

import { generateBugDrafts, resetBugDraftOutput } from './bug-drafts.mjs';

dotenv.config();

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const allureDir = path.resolve(argument('allure-dir', process.env.ALLURE_RESULTS_DIR || 'allure-results'));
const outputDir = path.resolve(argument('output', process.env.BUG_DRAFTS_DIR || 'bug-drafts'));
const runValue = argument('run', '');
const runId = runValue ? Number(runValue) : undefined;
if (runValue && (!Number.isInteger(runId) || runId <= 0)) {
  throw new Error('--run must be a positive integer');
}

await resetBugDraftOutput(outputDir);
const result = await generateBugDrafts({
  allureDir,
  outputDir,
  runId,
});
console.log(JSON.stringify(result, null, 2));
