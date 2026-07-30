import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import dotenv from 'dotenv';

import { generateBugDrafts, resetBugDraftOutput } from './bug-drafts.mjs';
import { publishAllureResults } from './doqa-publication.mjs';

dotenv.config();

const args = process.argv.slice(2);
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const allureDir = path.resolve('allure-results');

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

let publication;
let publishError;
try {
  const title = process.env.DOQA_RUN_TITLE?.trim() || `Автотесты ${new Date().toLocaleString('ru-RU')}`;
  publication = await publishAllureResults({
    allureDir,
    title,
  });
} catch (error) {
  publishError = error;
  console.error(`DoQA run was not created: ${error.message}`);
  if (error.details) console.error(`DoQA details: ${JSON.stringify(error.details)}`);
}

let bugDrafts;
let bugDraftError;
if (publication) {
  try {
    const bugDraftsDir = path.resolve(process.env.BUG_DRAFTS_DIR?.trim() || 'bug-drafts');
    await resetBugDraftOutput(bugDraftsDir);
    bugDrafts = await generateBugDrafts({
      allureDir,
      outputDir: bugDraftsDir,
      runId: publication.verification.runId,
    });
  } catch (error) {
    bugDraftError = error;
    console.error(`Bug drafts were not prepared: ${error.message}`);
  }
}

if (publication) {
  console.log(JSON.stringify({ playwrightExitCode: exitCode, ...publication, bugDrafts }, null, 2));
}
process.exitCode = Number(exitCode) || (publishError || bugDraftError ? 1 : 0);
