import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import dotenv from 'dotenv';

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

let publishError = null;
try {
  if (exitCode !== 0) {
    throw new Error(`Playwright exited with code ${exitCode}; publishing a failed preflight is blocked`);
  }

  const title = process.env.DOQA_RUN_TITLE?.trim() || `Автотесты ${new Date().toLocaleString('ru-RU')}`;
  const result = await publishAllureResults({
    allureDir,
    title,
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  publishError = error;
  console.error(`DoQA run was not created: ${error.message}`);
  if (error.details) console.error(`DoQA details: ${JSON.stringify(error.details)}`);
}

process.exitCode = Number(exitCode) || (publishError ? 1 : 0);
