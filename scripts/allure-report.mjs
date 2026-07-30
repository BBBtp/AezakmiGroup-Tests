import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';

export async function prepareAllureResults(sourceDir, outputDir) {
  await mkdir(outputDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  const resultFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('-result.json'));
  const latestById = new Map();
  const excluded = [];

  for (const entry of resultFiles) {
    const sourcePath = path.join(sourceDir, entry.name);
    let result;
    try {
      result = JSON.parse(await readFile(sourcePath, 'utf8'));
    } catch {
      excluded.push({ file: entry.name, reason: 'invalid_json' });
      continue;
    }
    const allureIds = (result.labels ?? [])
      .filter((label) => String(label.name).toUpperCase() === 'ALLURE_ID')
      .map((label) => String(label.value).trim());
    if (allureIds.length !== 1 || !/^\d+$/.test(allureIds[0])) {
      excluded.push({ file: entry.name, name: result.name, reason: 'missing_or_invalid_allure_id' });
      continue;
    }
    if (!['passed', 'failed', 'broken', 'skipped'].includes(result.status)) {
      excluded.push({
        file: entry.name,
        name: result.name,
        reason: `status_${result.status ?? 'missing'}`,
      });
      continue;
    }
    const allureId = allureIds[0];
    const candidate = {
      entry,
      result,
      allureId,
      identity: allureTestIdentity(result),
    };
    const current = latestById.get(allureId);
    if (current && current.identity !== candidate.identity) {
      throw new Error(`Allure report contains duplicate test-case ID ${allureId}`);
    }
    if (!current || compareAllureResults(current, candidate) < 0) {
      if (current) {
        excluded.push({
          file: current.entry.name,
          name: current.result.name,
          reason: 'superseded_retry',
        });
      }
      latestById.set(allureId, candidate);
    } else {
      excluded.push({
        file: candidate.entry.name,
        name: candidate.result.name,
        reason: 'superseded_retry',
      });
    }
  }

  const accepted = [...latestById.values()].sort(
    (left, right) => Number(left.allureId) - Number(right.allureId),
  );
  if (accepted.length === 0) {
    throw new Error('No publishable Allure test results with one numeric ALLURE_ID were found');
  }

  const ids = new Set(accepted.map(({ allureId }) => allureId));
  const statusCounts = {};
  for (const { result } of accepted) {
    statusCounts[result.status] = (statusCounts[result.status] ?? 0) + 1;
  }

  const copied = new Set();
  for (const { entry, result } of accepted) {
    await copyFile(path.join(sourceDir, entry.name), path.join(outputDir, entry.name));
    copied.add(entry.name);
    for (const attachment of collectAttachments(result)) {
      if (path.basename(attachment) !== attachment) {
        throw new Error(`Unsafe Allure attachment path: ${attachment}`);
      }
      if (copied.has(attachment)) continue;
      const attachmentPath = path.join(sourceDir, attachment);
      try {
        if ((await stat(attachmentPath)).isFile()) {
          await copyFile(attachmentPath, path.join(outputDir, attachment));
          copied.add(attachment);
        }
      } catch {
        throw new Error(`Allure attachment is missing: ${attachment}`);
      }
    }
  }

  for (const metadata of ['categories.json', 'environment.properties', 'executor.json']) {
    const metadataPath = path.join(sourceDir, metadata);
    try {
      if ((await stat(metadataPath)).isFile()) {
        await copyFile(metadataPath, path.join(outputDir, metadata));
        copied.add(metadata);
      }
    } catch {
      // Optional Allure metadata.
    }
  }

  return {
    testCount: accepted.length,
    allureIds: [...ids].sort((left, right) => Number(left) - Number(right)),
    statusCounts,
    excluded,
    copiedFiles: [...copied],
  };
}

function allureTestIdentity(result) {
  for (const value of [result.historyId, result.testCaseId, result.fullName]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return JSON.stringify({
    name: result.name ?? null,
    package: labelValue(result, 'package'),
    suite: labelValue(result, 'suite'),
  });
}

function compareAllureResults(left, right) {
  const leftTimestamp = Number(left.result.stop ?? left.result.start ?? 0);
  const rightTimestamp = Number(right.result.stop ?? right.result.start ?? 0);
  return leftTimestamp - rightTimestamp || left.entry.name.localeCompare(right.entry.name);
}

function labelValue(result, name) {
  return result.labels?.find((label) => label.name === name)?.value ?? null;
}

export function verifyDoqaRun(run, elements, expectedIds) {
  if (!run || typeof run !== 'object') throw new Error('DoQA did not return the created run');
  if (!run.progress || typeof run.progress !== 'object') {
    throw new Error('Created DoQA run has no progress data');
  }
  const progressCount = ['passed', 'failed', 'broken', 'blocked', 'skipped', 'initial']
    .map((status) => Number(run.progress[status] ?? 0))
    .reduce((total, count) => total + count, 0);
  if (progressCount !== expectedIds.length) {
    throw new Error(
      `DoQA run progress mismatch: expected ${expectedIds.length} results, received ${progressCount}`,
    );
  }
  if (!Array.isArray(elements)) throw new Error('DoQA run elements response is not an array');
  const expected = expectedIds.map(String);
  const reportedCount = Number(run.counts?.tests);
  if (!Number.isInteger(reportedCount) || reportedCount !== expected.length) {
    throw new Error(
      `DoQA run test count mismatch: expected ${expected.length}, received ${run.counts?.tests ?? 'missing'}`,
    );
  }
  if (elements.length !== expected.length) {
    throw new Error(
      `DoQA run element count mismatch: expected ${expected.length}, received ${elements.length}`,
    );
  }
  const elementIds = new Set(
    elements
      .flatMap((element) => [element.allureId, element.caseId, element.testCaseId, element.viewId])
      .filter((value) => value !== undefined && value !== null)
      .map(String),
  );
  const missingIds = expected.filter((id) => !elementIds.has(id));
  if (missingIds.length) {
    throw new Error(`DoQA run is missing test-case mappings for Allure IDs: ${missingIds.join(', ')}`);
  }
  return {
    runId: run.id,
    tests: reportedCount,
    elements: elements.length,
    progress: run.progress,
    allureIds: expected,
  };
}

export async function writeZipArchive(sourceDir, outputPath) {
  const files = await collectFiles(sourceDir, path.basename(sourceDir));
  if (files.length === 0) throw new Error(`No report files found in ${sourceDir}`);

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

function collectAttachments(value) {
  if (Array.isArray(value)) return value.flatMap(collectAttachments);
  if (!value || typeof value !== 'object') return [];
  const own = Array.isArray(value.attachments)
    ? value.attachments.map((attachment) => attachment.source).filter(Boolean)
    : [];
  return [...own, ...Object.values(value).flatMap(collectAttachments)];
}

async function collectFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(full, relative)));
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
