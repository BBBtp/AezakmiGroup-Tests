import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';

import dotenv from 'dotenv';

import { DoqaClient } from '../mcp/doqa-client.mjs';

dotenv.config();

const args = process.argv.slice(2);
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const workDir = await mkdtemp(path.join(os.tmpdir(), 'crm-doqa-run-'));
const allureDir = path.resolve('allure-results');
const archivePath = path.join(workDir, 'allure-results.zip');

await rm(allureDir, { recursive: true, force: true });
await mkdir(allureDir, { recursive: true });

const exitCode = await new Promise((resolve, reject) => {
  const child = spawn(command, ['playwright', 'test', ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('error', reject);
  child.on('close', code => resolve(code ?? 1));
});

let publishError = null;
try {
  const reportToken = process.env.DOQA_AUTOTEST_TOKEN?.trim() || process.env.DOQA_TOKEN?.trim();
  if (!reportToken) throw new Error('DOQA_TOKEN is not set');

  await writeZipArchive(allureDir, archivePath);

  const client = new DoqaClient();
  const title = process.env.DOQA_RUN_TITLE?.trim() || `Автотесты ${new Date().toLocaleString('ru-RU')}`;
  const run = await client.uploadAutotestReport({ reportToken, reportPath: archivePath, type: 'allure', title });
  console.log(`DoQA report uploaded; run created: ${run.runId ?? run.id ?? 'unknown'} (${title})`);
} catch (error) {
  publishError = error;
  console.error(`DoQA run was not created: ${error.message}`);
  if (error.details) console.error(`DoQA details: ${JSON.stringify(error.details)}`);
}

process.exitCode = Number(exitCode) || (publishError ? 1 : 0);
await rm(workDir, { recursive: true, force: true });

async function writeZipArchive(sourceDir, outputPath) {
  const files = await collectFiles(sourceDir, path.basename(sourceDir));
  if (files.length === 0) throw new Error(`No Allure result files found in ${sourceDir}`);

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name);
    const data = await readFile(file.path);
    const compressed = deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    localParts.push(local, compressed);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centralParts.push(central);
    offset += local.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  await writeFile(outputPath, Buffer.concat([...localParts, centralDirectory, end]));
}

async function collectFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(full, relative));
    else files.push({ path: full, name: relative });
  }
  return files;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
