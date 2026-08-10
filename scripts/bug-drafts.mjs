import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { classifyRunFailure, defectMarker, DoqaClient } from '../mcp/doqa-client.mjs';

const activeBugStatuses = ['open', 'work', 'testing'];
const allowedAttachmentTypes = new Set(['image/jpeg', 'image/png', 'text/markdown', 'video/webm']);
const KPI_DATA_UNAVAILABLE = '[KPI_DATA_UNAVAILABLE]';

export async function resetBugDraftOutput(outputDir, trustedRoot = process.cwd()) {
  const resolvedOutput = path.resolve(outputDir);
  const resolvedRoot = path.resolve(trustedRoot);
  const relative = path.relative(resolvedRoot, resolvedOutput);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Bug draft output must be a child of the trusted directory');
  }
  await rm(resolvedOutput, { recursive: true, force: true });
  await mkdir(resolvedOutput, { recursive: true });
  return resolvedOutput;
}

export async function generateBugDrafts({ allureDir, outputDir, runId, client }) {
  const failures = await readFailedAllureResults(allureDir);
  await mkdir(outputDir, { recursive: true });
  const drafts = [];
  const excluded = failures
    .map((failure) => ({ failure, exclusion: bugDraftExclusion(failure) }))
    .filter(({ exclusion }) => exclusion !== null);
  const excludedFiles = new Set(excluded.map(({ failure }) => failure.file));
  const draftableFailures = failures.filter((failure) => !excludedFiles.has(failure.file));
  const effectiveClient = draftableFailures.length ? (client ?? new DoqaClient()) : null;

  for (const failure of draftableFailures) {
    const [caseSnapshot, duplicateSearch] = await Promise.all([
      effectiveClient.getCase(Number(failure.caseId)),
      effectiveClient.listRunBugs({
        search: defectMarker(failure.caseId),
        statuses: activeBugStatuses,
      }),
    ]);
    const sourceCase = caseSnapshot.case?.data ?? caseSnapshot.case;
    const duplicate = duplicateSearch.bugs.find(
      (bug) => bug.title?.includes(defectMarker(failure.caseId)) && activeBugStatuses.includes(bug.status),
    );
    const draftDir = path.join(outputDir, `TC-${failure.caseId}`);
    await mkdir(draftDir, { recursive: true });
    const attachments = await copySafeAttachments({
      allureDir,
      draftDir,
      result: failure.result,
    });
    const draft = buildBugDraft({
      failure,
      sourceCase,
      runId,
      attachments,
      duplicate,
    });
    await writeFile(path.join(draftDir, 'bug.md'), formatBugDraftMarkdown(draft), 'utf8');
    await writeFile(path.join(draftDir, 'draft.json'), JSON.stringify(draft, null, 2), 'utf8');
    drafts.push(draft);
  }

  await writeFile(path.join(outputDir, 'README.md'), formatDraftIndex(drafts, runId, excluded), 'utf8');
  return {
    outputDir,
    runId: runId ?? null,
    failures: failures.length,
    excluded: excluded.map(({ failure, exclusion }) => ({
      caseId: Number(failure.caseId),
      ...exclusion,
    })),
    drafts: drafts.map((draft) => ({
      caseId: draft.caseId,
      status: draft.status,
      classification: draft.classification,
      duplicate: draft.duplicate,
      attachments: draft.attachments.length,
      file: path.join(outputDir, `TC-${draft.caseId}`, 'bug.md'),
    })),
  };
}

export function bugDraftExclusion(failure) {
  const message = String(failure?.result?.statusDetails?.message ?? '');
  if (message.includes(KPI_DATA_UNAVAILABLE)) {
    return {
      classification: 'environment',
      reason: 'kpi_test_data_unavailable',
      evidence: redactSensitive(message),
    };
  }
  return null;
}

export async function readFailedAllureResults(allureDir) {
  const entries = await readdir(allureDir, { withFileTypes: true });
  const latestResults = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('-result.json')) continue;
    const result = JSON.parse(await readFile(path.join(allureDir, entry.name), 'utf8'));
    const ids = (result.labels ?? [])
      .filter((label) => String(label.name).toUpperCase() === 'ALLURE_ID')
      .map((label) => String(label.value).trim());
    if (ids.length !== 1 || !/^\d+$/.test(ids[0])) continue;
    const candidate = {
      caseId: ids[0],
      file: entry.name,
      result,
    };
    const current = latestResults.get(candidate.caseId);
    if (!current || compareAllureResults(current, candidate) < 0) {
      latestResults.set(candidate.caseId, candidate);
    }
  }
  return [...latestResults.values()]
    .filter(({ result }) => ['failed', 'broken'].includes(result.status))
    .sort((left, right) => Number(left.caseId) - Number(right.caseId));
}

function compareAllureResults(left, right) {
  const leftTimestamp = Number(left.result.stop ?? left.result.start ?? 0);
  const rightTimestamp = Number(right.result.stop ?? right.result.start ?? 0);
  return leftTimestamp - rightTimestamp || left.file.localeCompare(right.file);
}

export function buildBugDraft({ failure, sourceCase, runId, attachments = [], duplicate }) {
  const actualResult = redactSensitive(
    failure.result.statusDetails?.message || `Autotest finished with status ${failure.result.status}`,
  );
  const expectedResult =
    htmlToText(sourceCase.expectedResult) ||
    htmlToText(sourceCase.steps?.at(-1)?.result) ||
    'Сценарий завершается ожидаемым бизнес-результатом.';
  const classification = classifyRunFailure({
    id: null,
    viewId: Number(failure.caseId),
    title: sourceCase.title ?? failure.result.name,
    status: failure.result.status,
    progressInfo: { error: actualResult },
  });
  const marker = defectMarker(failure.caseId);
  const title = truncate(`${marker} ${sourceCase.title ?? failure.result.name}`, 255);
  const preconditions = htmlToText(sourceCase.preconditions);
  const steps = (sourceCase.steps ?? []).map((step, index) => ({
    number: index + 1,
    action: htmlToText(step.step),
    expected: htmlToText(step.result),
  }));
  const content = formatContent({
    preconditions,
    steps,
    actualResult,
    runId,
    caseId: failure.caseId,
    testPath: failure.result.fullName,
    project: labelValue(failure.result, 'parentSuite'),
    classification,
  });

  return {
    caseId: Number(failure.caseId),
    marker,
    status: failure.result.status,
    title,
    priority: sourceCase.priority ?? 'high',
    actualResult,
    expectedResult,
    content,
    classification: {
      value: classification.classification,
      confidence: classification.confidence,
      signals: classification.signals,
      confirmedProduct: false,
    },
    duplicate: duplicate
      ? {
          found: true,
          id: duplicate.id,
          title: duplicate.title,
          status: duplicate.status,
        }
      : { found: false },
    source: {
      runId: runId ?? null,
      testCaseId: Number(failure.caseId),
      testPath: failure.result.fullName ?? null,
      project: labelValue(failure.result, 'parentSuite') ?? null,
    },
    attachments,
  };
}

export function redactSensitive(value) {
  return String(value ?? '')
    .replace(/(authorization\s*:\s*bearer\s+)[^\s]+/gi, '$1[REDACTED]')
    .replace(/((?:password|passwd|token|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/(fill\s+")[^"]+("\s+[^"\n]*(?:password|token|secret)[^"\n]*)/gi, '$1[REDACTED]$2')
    .trim();
}

export function formatBugDraftMarkdown(draft) {
  const attachmentLines = draft.attachments.length
    ? draft.attachments.map((attachment) => `- ${attachment.file}`).join('\n')
    : '- Вложений нет.';
  const duplicateLine = draft.duplicate.found
    ? `Найден активный дубль #${draft.duplicate.id}: ${draft.duplicate.title}`
    : 'Активный дубль по маркеру не найден.';
  return [
    `# ${draft.title}`,
    '',
    `- Приоритет: ${draft.priority}`,
    `- Статус автотеста: ${draft.status}`,
    `- Предварительная классификация: ${draft.classification.value} (${draft.classification.confidence})`,
    `- Дедупликация: ${duplicateLine}`,
    '',
    '## Фактический результат',
    '',
    draft.actualResult,
    '',
    '## Ожидаемый результат',
    '',
    draft.expectedResult,
    '',
    '## Содержание',
    '',
    draft.content,
    '',
    '## Вложения',
    '',
    attachmentLines,
    '',
    '> Перед созданием бага подтвердите, что это дефект продукта, и при необходимости уточните',
    '> бизнес-формулировку фактического результата.',
    '',
  ].join('\n');
}

async function copySafeAttachments({ allureDir, draftDir, result }) {
  const attachments = collectAttachments(result).filter(
    (attachment) =>
      allowedAttachmentTypes.has(attachment.type) &&
      /screenshot|video|error-context/i.test(attachment.name ?? ''),
  );
  const copied = [];
  for (const [index, attachment] of attachments.entries()) {
    if (path.basename(attachment.source) !== attachment.source) continue;
    const extension = path.extname(attachment.source);
    const baseName = safeFileName(attachment.name || `attachment-${index + 1}`);
    const file = `${String(index + 1).padStart(2, '0')}-${baseName}${extension}`;
    const sourcePath = path.join(allureDir, attachment.source);
    const outputPath = path.join(draftDir, file);
    if (attachment.type === 'text/markdown') {
      await writeFile(outputPath, redactSensitive(await readFile(sourcePath, 'utf8')), 'utf8');
    } else {
      await copyFile(sourcePath, outputPath);
    }
    copied.push({
      name: attachment.name,
      type: attachment.type,
      file,
      requiresVisualReview: attachment.type.startsWith('image/') || attachment.type.startsWith('video/'),
    });
  }
  return copied;
}

function collectAttachments(value) {
  if (Array.isArray(value)) return value.flatMap(collectAttachments);
  if (!value || typeof value !== 'object') return [];
  const own = Array.isArray(value.attachments) ? value.attachments.filter((item) => item?.source) : [];
  return [...own, ...Object.values(value).flatMap(collectAttachments)];
}

function formatContent({
  preconditions,
  steps,
  actualResult,
  runId,
  caseId,
  testPath,
  project,
  classification,
}) {
  const lines = [];
  if (preconditions) lines.push('Предусловие:', preconditions, '');
  if (steps.length) {
    lines.push('Шаги воспроизведения:');
    for (const step of steps) {
      lines.push(`${step.number}. ${step.action}`);
      if (step.expected) lines.push(`   Ожидается на шаге: ${step.expected}`);
    }
    lines.push('');
  }
  lines.push('Наблюдаемая ошибка:', actualResult, '', 'Источник:');
  if (runId) lines.push(`DoQA run: ${runId}`);
  lines.push(`Test case: #${caseId}`);
  if (testPath) lines.push(`Автотест: ${testPath}`);
  if (project) lines.push(`Playwright project: ${project}`);
  lines.push(
    `Предварительная классификация: ${classification.classification} (${classification.confidence})`,
  );
  return lines.join('\n');
}

function formatDraftIndex(drafts, runId, excluded = []) {
  const lines = ['# Черновики багов', '', runId ? `DoQA run: ${runId}` : 'DoQA run: не указан', ''];
  if (!drafts.length && !excluded.length) {
    lines.push('Failed/broken результатов с корректным Allure ID нет.', '');
    return lines.join('\n');
  }
  if (drafts.length) {
    lines.push('| ТК | Статус | Классификация | Дубль | Черновик |', '|---:|---|---|---|---|');
    for (const draft of drafts) {
      lines.push(
        `| ${draft.caseId} | ${draft.status} | ${draft.classification.value} | ${
          draft.duplicate.found ? `#${draft.duplicate.id}` : 'нет'
        } | [открыть](TC-${draft.caseId}/bug.md) |`,
      );
    }
    lines.push('');
  }
  if (excluded.length) {
    lines.push('## Исключено из продуктовых багов', '', '| ТК | Классификация | Причина |', '|---:|---|---|');
    for (const { failure, exclusion } of excluded) {
      lines.push(`| ${failure.caseId} | ${exclusion.classification} | ${exclusion.reason} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function labelValue(result, name) {
  return result.labels?.find((label) => label.name === name)?.value;
}

function htmlToText(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function safeFileName(value) {
  const normalized = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'attachment';
}

function truncate(value, maxLength) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}
