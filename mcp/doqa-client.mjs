import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

dotenv.config();

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function resolveSpaceId(value) {
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/\/detail\/(\d+)\/(\d+)/);
  if (!match) throw new Error('DOQA_SPACE_ID must be a number or a DoQA /detail/{projectId}/{spaceId}/ URL');
  return Number(match[2]);
}

export function getDoqaConfig() {
  const endpoint = required('DOQA_ENDPOINT').replace(/\/$/, '');
  const spaceId = resolveSpaceId(required('DOQA_SPACE_ID'));
  return {
    endpoint,
    spaceId,
    projectId: process.env.DOQA_PROJECT_ID?.trim() || undefined,
    token: required('DOQA_TOKEN'),
  };
}

export function getAutotestReportToken() {
  return required('DOQA_AUTOTEST_TOKEN');
}

export class DoqaApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'DoqaApiError';
    this.status = status;
    this.details = details;
  }
}

export class DoqaClient {
  constructor(config = getDoqaConfig(), { fetchImpl = fetch } = {}) {
    this.config = config;
    this.fetch = fetchImpl;
  }

  async request(path, options = {}) {
    const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await this.fetch(`${this.config.endpoint}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: 'application/json',
        ...(options.body && !isMultipart ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!response.ok)
      throw new DoqaApiError(`DoQA API ${response.status} ${response.statusText}`, response.status, body);
    return { body, headers: response.headers };
  }

  async listAutomationCandidates({
    limit = 6,
    priorities = ['high', 'medium', 'low'],
    statuses = ['ready', 'review'],
    search,
    automationStatuses = ['planned'],
  } = {}) {
    const payload = {
      spaceId: this.config.spaceId,
      automationStatuses,
      priorities,
      statuses,
      sort: 'priority',
      direction: 'desc',
      ...(search ? { search } : {}),
    };
    const { body: tree } = await this.request('/api/cases/list', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const folders = await this.discoverFolders(tree);
    const leafFolders = folders.filter((folder) => folder.childrenCount === 0);
    const folderResults = await Promise.all(
      leafFolders.map(async (folder) => {
        const cases = [];
        for (let offset = 0; ; offset += 1) {
          const { body } = await this.request('/api/cases/list/part', {
            method: 'POST',
            body: JSON.stringify({ ...payload, folderId: folder.id, offset }),
          });
          const page = takeCases(body);
          cases.push(...page);
          if (page.length === 0) break;
        }
        return { folder, cases };
      }),
    );
    const cases = folderResults.flatMap(({ folder, cases: folderCases }) =>
      folderCases.map((item) => ({ ...item, folderId: item.folderId ?? folder.id })),
    );
    cases.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.id - b.id);
    return {
      spaceId: this.config.spaceId,
      limit,
      folders,
      cases: dedupeCases(cases).slice(0, limit),
      raw: tree,
    };
  }

  async getCase(caseId) {
    const { body, headers } = await this.request(`/api/cases/${encodeURIComponent(caseId)}`);
    const source = body?.data ?? body;
    return { case: body, etag: headers.get('etag') ?? source?.versionUuid ?? null };
  }

  async createCase(
    {
      folderId,
      title,
      description = '',
      preconditions = '',
      expectedResult = '',
      steps = [],
      priority = 'medium',
      status = 'ready',
      automationStatus = 'planned',
      tagIds = [],
      attributes = [],
    },
    { idempotencyKey } = {},
  ) {
    if (!folderId) throw new DoqaApiError('A DoQA folderId is required to create a case', 400, null);
    if (!title?.trim()) throw new DoqaApiError('A DoQA case title is required', 400, null);
    const payload = {
      spaceId: this.config.spaceId,
      folderId,
      title: title.trim(),
      description,
      preconditions,
      expectedResult,
      steps,
      priority,
      status,
      automationStatus,
      tagIds,
      attributes,
    };
    const { body } = await this.request('/api/cases', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey ?? stableKey('create-case', payload) },
      body: JSON.stringify(payload),
    });
    return body?.data ?? body;
  }

  async updateCase(caseId, changes, { snapshot } = {}) {
    const current = snapshot ?? (await this.getCase(caseId));
    if (!current.etag)
      throw new DoqaApiError(
        `DoQA did not return an ETag/versionUuid for case ${caseId}; refusing unsafe update`,
        428,
        null,
      );
    const source = current.case?.data ?? current.case;
    const payload = {
      id: source.id ?? Number(caseId),
      spaceId: source.spaceId ?? this.config.spaceId,
      title: source.title ?? '',
      description: source.description ?? '',
      preconditions: source.preconditions ?? '',
      expectedResult: source.expectedResult ?? '',
      priority: source.priority ?? 'medium',
      status: source.status ?? 'review',
      automationStatus: source.automationStatus ?? 'planned',
      steps: source.steps ?? [],
      tagIds: source.tagIds ?? [],
      attributes: source.attributes ?? [],
      ...changes,
    };
    const { body } = await this.request('/api/cases', {
      method: 'PATCH',
      headers: { 'If-Match': current.etag },
      body: JSON.stringify(payload),
    });
    return { case: body, caseId: payload.id, etag: current.etag, changes };
  }

  async analyzeCase(caseId) {
    const current = await this.getCase(caseId);
    return { ...current, analysis: analyzeCaseData(current.case?.data ?? current.case) };
  }

  async improveCase(caseId, { apply = false } = {}) {
    const analyzed = await this.analyzeCase(caseId);
    const source = analyzed.case?.data ?? analyzed.case;
    const changes = buildSafeCaseFixes(source);
    if (!apply || Object.keys(changes).length === 0) {
      return { caseId, applied: false, analysis: analyzed.analysis, changes, etag: analyzed.etag };
    }
    let updated;
    try {
      updated = await this.updateCase(caseId, changes, { snapshot: analyzed });
    } catch (error) {
      if (!(error instanceof DoqaApiError) || error.status !== 412) throw error;
      const refreshed = await this.analyzeCase(caseId);
      return {
        caseId,
        applied: false,
        conflict: true,
        reason: 'case_changed_after_analysis',
        before: analyzed.analysis,
        current: refreshed.analysis,
        changes: buildSafeCaseFixes(refreshed.case?.data ?? refreshed.case),
        etag: refreshed.etag,
      };
    }
    const after = await this.analyzeCase(caseId);
    return {
      caseId,
      applied: true,
      changes,
      before: analyzed.analysis,
      after: after.analysis,
      updatedCase: updated.case,
    };
  }

  async getRun(runId) {
    const { body } = await this.request(`/api/runs/${encodeURIComponent(runId)}`);
    return body?.data ?? body;
  }

  async listRunElements(runId, payload = {}) {
    const { body } = await this.request(`/api/runs/${encodeURIComponent(runId)}/elements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return unwrapArray(body);
  }

  async listRunBugs({ page = 1, limit = 50, search, statuses, priorities, runIds } = {}) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(statuses?.length ? { statuses: statuses.join(',') } : {}),
      ...(priorities?.length ? { priorities: priorities.join(',') } : {}),
      ...(runIds?.length ? { runIds: runIds.join(',') } : {}),
    });
    const { body } = await this.request(
      `/api/run-bugs/${encodeURIComponent(this.config.spaceId)}/list?${query}`,
    );
    return {
      bugs: unwrapArray(body),
      meta: body?.meta ?? body?.data?.meta ?? null,
    };
  }

  async getRunBugs(runId) {
    const { body } = await this.request(`/api/runs/${encodeURIComponent(runId)}/bugs`);
    return unwrapArray(body);
  }

  async getRunBug(bugId) {
    const { body, headers } = await this.request(`/api/run-bugs/${encodeURIComponent(bugId)}`);
    return {
      bug: body?.data ?? body,
      etag: headers.get('etag') ?? null,
    };
  }

  async getRunElementBugInfo(runElementId) {
    const { body } = await this.request(`/api/run-elements/${encodeURIComponent(runElementId)}/bugs-info`);
    return body?.data ?? body;
  }

  async createRunBug(
    {
      runElementId,
      title,
      priority = 'medium',
      status = 'open',
      actualResult,
      expectedResult,
      content = '',
      useRelationTracker = true,
    },
    { idempotencyKey } = {},
  ) {
    if (!Number.isInteger(Number(runElementId)) || Number(runElementId) <= 0) {
      throw new DoqaApiError('A positive runElementId is required to create a defect', 400, null);
    }
    if (!title?.trim()) throw new DoqaApiError('A defect title is required', 400, null);
    if (!actualResult?.trim()) {
      throw new DoqaApiError('A defect actualResult is required', 400, null);
    }
    if (!expectedResult?.trim()) {
      throw new DoqaApiError('A defect expectedResult is required', 400, null);
    }

    const payload = {
      title: title.trim(),
      priority,
      status,
      actualResult: actualResult.trim(),
      expectedResult: expectedResult.trim(),
      content,
      useRelationTracker: String(useRelationTracker),
      type: 'autotest',
      itemId: String(runElementId),
    };
    const form = new FormData();
    for (const [key, value] of Object.entries(payload)) form.append(key, value);

    const { body, headers } = await this.request('/api/run-bugs', {
      method: 'POST',
      headers: {
        'Idempotency-Key':
          idempotencyKey ??
          stableKey('create-run-defect', {
            spaceId: this.config.spaceId,
            runElementId: Number(runElementId),
            title: payload.title,
          }),
      },
      body: form,
    });
    return {
      bug: body?.data ?? body,
      etag: headers.get('etag') ?? null,
    };
  }

  async analyzeRunFailures(runId) {
    const [run, elements, runBugs] = await Promise.all([
      this.getRun(runId),
      this.listRunElements(runId),
      this.getRunBugs(runId),
    ]);
    const failures = elements
      .filter((element) => ['failed', 'broken', 'blocked'].includes(element.status))
      .map((element) => classifyRunFailure(element));
    return {
      run: {
        id: run.id,
        title: run.title,
        progress: run.progress,
        counts: run.counts,
      },
      failures,
      existingRunBugs: runBugs.map(safeBugSummary),
    };
  }

  async prepareRunDefect({
    runId,
    caseId,
    classification,
    evidence,
    title,
    actualResult,
    expectedResult,
    priority = 'high',
    apply = false,
  }) {
    if (classification !== 'product') {
      return {
        runId,
        caseId,
        applied: false,
        blocked: true,
        reason: 'only_confirmed_product_failures_can_create_defects',
        classification,
      };
    }
    if (!evidence?.trim()) {
      throw new DoqaApiError('Evidence is required for a confirmed product defect', 400, null);
    }

    const [run, elements, caseSnapshot] = await Promise.all([
      this.getRun(runId),
      this.listRunElements(runId),
      this.getCase(caseId),
    ]);
    const element = elements.find((candidate) =>
      [candidate.allureId, candidate.caseId, candidate.testCaseId, candidate.viewId]
        .filter((value) => value !== undefined && value !== null)
        .map(String)
        .includes(String(caseId)),
    );
    if (!element) {
      throw new DoqaApiError(`Run ${runId} has no element mapped to case ${caseId}`, 404, null);
    }
    if (!['failed', 'broken', 'blocked'].includes(element.status)) {
      throw new DoqaApiError(
        `Run element for case ${caseId} is ${element.status}; refusing to create a defect`,
        409,
        null,
      );
    }

    const marker = defectMarker(caseId);
    const { bugs: matchingBugs } = await this.listRunBugs({
      search: marker,
      statuses: ['open', 'work', 'testing'],
    });
    const duplicate = matchingBugs.find(
      (bug) => bug.title?.includes(marker) && ['open', 'work', 'testing'].includes(bug.status),
    );
    if (duplicate) {
      return {
        runId,
        caseId,
        runElementId: element.id,
        applied: false,
        duplicate: true,
        marker,
        existingBug: safeBugSummary(duplicate),
      };
    }

    const sourceCase = caseSnapshot.case?.data ?? caseSnapshot.case;
    const bugInfo = await this.getRunElementBugInfo(element.id);
    const resolvedTitle = truncate(title?.trim() || `${marker} ${sourceCase.title}`, 255);
    const resolvedActual =
      actualResult?.trim() || failureText(element) || `Autotest finished with status ${element.status}`;
    const resolvedExpected =
      expectedResult?.trim() || htmlToText(sourceCase.expectedResult) || 'The scenario passes';
    const content = buildDefectContent({
      marker,
      run,
      caseId,
      element,
      evidence: evidence.trim(),
      actualResult: resolvedActual,
      expectedResult: resolvedExpected,
    });
    const preview = {
      runId,
      caseId,
      runElementId: element.id,
      status: element.status,
      classification,
      marker,
      title: resolvedTitle,
      priority,
      actualResult: resolvedActual,
      expectedResult: resolvedExpected,
      relationTracker: Boolean(bugInfo?.relationTracker),
      relationType: bugInfo?.relationType ?? null,
    };
    if (!apply) return { ...preview, applied: false, dryRun: true };
    if (!bugInfo?.relationTracker) {
      throw new DoqaApiError(
        `DoQA has no tracker relation for run element ${element.id}; refusing an untracked defect`,
        409,
        { relationType: bugInfo?.relationType ?? null, exception: bugInfo?.exception ?? null },
      );
    }
    if (bugInfo?.exception) {
      throw new DoqaApiError('DoQA tracker integration is unavailable', 409, bugInfo.exception);
    }

    const created = await this.createRunBug({
      runElementId: element.id,
      title: resolvedTitle,
      priority,
      status: 'open',
      actualResult: resolvedActual,
      expectedResult: resolvedExpected,
      content,
      useRelationTracker: true,
    });
    const bugId = Number(created.bug?.id);
    if (!Number.isInteger(bugId) || bugId <= 0) {
      throw new DoqaApiError('DoQA did not return a valid created defect ID', 502, created.bug);
    }
    const verification = await this.waitForRunBugVerification({
      bugId,
      runId,
      runElementId: element.id,
      marker,
      requireTracker: true,
    });
    return {
      ...preview,
      applied: true,
      bug: verification,
    };
  }

  async waitForRunBugVerification({ bugId, runId, runElementId, marker, requireTracker = true }) {
    const timeoutMs = Number(process.env.DOQA_DEFECT_VERIFY_TIMEOUT_MS || 30_000);
    const deadline = Date.now() + timeoutMs;
    let latest;
    do {
      const [{ bug }, runBugs] = await Promise.all([this.getRunBug(bugId), this.getRunBugs(runId)]);
      latest = bug;
      const linked = runBugs.some(
        (candidate) =>
          Number(candidate.id) === Number(bugId) &&
          (!candidate.runElementId || Number(candidate.runElementId) === Number(runElementId)),
      );
      const trackerLinked = Boolean(bug?.integration?.link || bug?.integration?.title);
      if (linked && bug?.title?.includes(marker) && (!requireTracker || trackerLinked)) {
        return {
          ...safeBugSummary(bug),
          runId,
          runElementId,
          trackerLinked,
        };
      }
      if (Date.now() < deadline) await delay(1_000);
    } while (Date.now() < deadline);
    throw new DoqaApiError(
      `DoQA defect ${bugId} was created but failed link verification`,
      502,
      safeBugSummary(latest),
    );
  }

  async discoverFolders(tree) {
    const folders = takeFolders(tree);
    const expanded = new Set();
    for (let index = 0; index < folders.length; index += 1) {
      const folder = folders[index];
      if (folder.childrenCount === 0 || expanded.has(folder.id)) continue;
      expanded.add(folder.id);
      const { body } = await this.request('/api/cases/list', {
        method: 'POST',
        body: JSON.stringify({ spaceId: this.config.spaceId, folderId: folder.id }),
      });
      for (const child of takeFolders(body)) {
        if (!folders.some((item) => item.id === child.id)) folders.push(child);
      }
    }
    return folders;
  }

  async claimCase(caseId, { responsibleId, tagIds } = {}) {
    const current = await this.getCase(caseId);
    if (!current.etag)
      throw new DoqaApiError(
        `DoQA did not return an ETag/versionUuid for case ${caseId}; refusing unsafe update`,
        428,
        null,
      );
    const source = current.case?.data ?? current.case;
    const payload = {
      id: source.id ?? Number(caseId),
      spaceId: source.spaceId ?? this.config.spaceId,
      title: source.title,
      description: source.description ?? '',
      preconditions: source.preconditions ?? '',
      expectedResult: source.expectedResult ?? '',
      priority: source.priority ?? 'medium',
      status: 'review',
      automationStatus: 'planned',
      ...(source.steps ? { steps: source.steps } : {}),
      ...(tagIds ? { tagIds } : source.tagIds ? { tagIds: source.tagIds } : {}),
      ...(source.attributes ? { attributes: source.attributes } : {}),
      ...(responsibleId ? { responsibleId } : {}),
    };
    const updated = await this.updateCase(
      caseId,
      {
        status: payload.status,
        automationStatus: payload.automationStatus,
        ...(tagIds ? { tagIds } : {}),
        ...(responsibleId ? { responsibleId } : {}),
      },
      { snapshot: current },
    );
    return {
      case: updated.case,
      caseId: payload.id,
      claimed: true,
      status: 'review',
      automationStatus: 'planned',
    };
  }

  async createRunFromAutotestReport({ title, idempotencyKey }) {
    const reportToken = getAutotestReportToken();
    const runTitle = title?.trim() || `Автотесты ${new Date().toISOString()}`;
    const { body } = await this.request('/api/runs/from-autotest-report', {
      method: 'POST',
      headers: {
        'Idempotency-Key':
          idempotencyKey ?? stableKey('create-run', { spaceId: this.config.spaceId, title: runTitle }),
      },
      body: JSON.stringify({ token: reportToken.trim(), title: runTitle, spaceId: this.config.spaceId }),
    });

    return { ...body, title: runTitle, spaceId: this.config.spaceId };
  }

  async uploadAutotestReport({ reportPath, type = 'allure', title, trustedRoot, idempotencyKey }) {
    const reportToken = getAutotestReportToken();
    if (!reportPath?.trim()) throw new DoqaApiError('An autotest report path is required', 400, null);

    const safeReport = await validateReportPath(reportPath, { type, trustedRoot });
    const report = await fs.readFile(safeReport.path);
    const effectiveIdempotencyKey =
      idempotencyKey ??
      createHash('sha256')
        .update('upload-report')
        .update(String(this.config.spaceId))
        .update(type)
        .update(title?.trim() ?? '')
        .update(report)
        .digest('hex');
    const form = new FormData();
    form.append('token', reportToken.trim());
    form.append('type', type);
    form.append('spaceId', String(this.config.spaceId));
    if (title?.trim()) form.append('title', title.trim());
    form.append('file', new Blob([report]), path.basename(safeReport.path));

    const response = await this.fetch(`${this.config.endpoint}/api/autotests/report`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: 'application/json',
        'Idempotency-Key': effectiveIdempotencyKey,
      },
      body: form,
    });
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!response.ok)
      throw new DoqaApiError(`DoQA API ${response.status} ${response.statusText}`, response.status, body);
    return { ...body, spaceId: this.config.spaceId, type, reportBytes: safeReport.size };
  }
}

function stableKey(operation, payload) {
  return createHash('sha256').update(operation).update(JSON.stringify(payload)).digest('hex');
}

export function classifyRunFailure(element = {}) {
  const actualResult = failureText(element);
  const text = actualResult.toLowerCase();
  let classification = 'needs_review';
  let confidence = 'low';
  const signals = [];

  if (/econnrefused|enotfound|net::err_|dns|socket hang up|browser.*disconnected|502|503|504/.test(text)) {
    classification = 'infrastructure';
    confidence = 'high';
    signals.push('infrastructure_signature');
  } else if (
    /strict mode violation|locator.*resolved to|element\(s\) not found|test timeout|page has been closed/.test(
      text,
    )
  ) {
    classification = 'test_or_product';
    confidence = 'medium';
    signals.push('playwright_observation_failure');
  }

  return {
    runElementId: element.id,
    caseId: element.allureId ?? element.caseId ?? element.testCaseId ?? element.viewId ?? element.autotestId,
    title: element.title,
    status: element.status,
    classification,
    confidence,
    signals,
    actualResult,
  };
}

export function defectMarker(caseId) {
  if (!Number.isInteger(Number(caseId)) || Number(caseId) <= 0) {
    throw new DoqaApiError('A positive caseId is required for a defect marker', 400, null);
  }
  return `[AUTO][TC-${Number(caseId)}]`;
}

function failureText(element = {}) {
  const info = element.progressInfo;
  if (typeof info === 'string') return info.trim();
  if (info && typeof info === 'object') {
    return String(info.error ?? info.message ?? info.details ?? info.actualResult ?? '').trim();
  }
  return '';
}

function buildDefectContent({ marker, run, caseId, element, evidence, actualResult, expectedResult }) {
  return [
    `<p><strong>${escapeHtml(marker)} Подтверждённый дефект продукта</strong></p>`,
    `<p>DoQA run: ${escapeHtml(run.id)} — ${escapeHtml(run.title ?? '')}</p>`,
    `<p>Test case: #${escapeHtml(caseId)} — ${escapeHtml(element.title ?? '')}</p>`,
    `<p>Классификация: product</p>`,
    `<p>Основание: ${escapeHtml(evidence)}</p>`,
    `<p>Ожидаемый результат: ${escapeHtml(expectedResult)}</p>`,
    `<p>Фактический результат: ${escapeHtml(actualResult)}</p>`,
  ].join('');
}

function safeBugSummary(bug) {
  if (!bug || typeof bug !== 'object') return null;
  return {
    id: bug.id,
    title: bug.title,
    status: bug.status,
    priority: bug.priority,
    runId: bug.runId ?? bug.run?.id ?? null,
    runElementId: bug.runElementId ?? null,
    integration: bug.integration
      ? {
          title: bug.integration.title ?? null,
          type: bug.integration.type ?? null,
          link: bug.integration.link ?? null,
        }
      : null,
  };
}

function unwrapArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value.data)) return value.data;
  if (value.data && typeof value.data === 'object') return unwrapArray(value.data);
  return [];
}

function truncate(value, maxLength) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function validateReportPath(
  reportPath,
  { type = 'allure', trustedRoot, maxBytes = 50 * 1024 * 1024 } = {},
) {
  if (!['allure', 'junit'].includes(type)) {
    throw new DoqaApiError(`Unsupported autotest report type: ${type}`, 400, null);
  }
  const resolvedPath = path.resolve(reportPath);
  let realPath;
  try {
    realPath = await fs.realpath(resolvedPath);
  } catch {
    throw new DoqaApiError(`Autotest report does not exist: ${resolvedPath}`, 400, null);
  }
  if (trustedRoot) {
    let realRoot;
    try {
      realRoot = await fs.realpath(path.resolve(trustedRoot));
    } catch {
      throw new DoqaApiError(
        `Trusted report directory does not exist: ${path.resolve(trustedRoot)}`,
        400,
        null,
      );
    }
    if (realPath !== realRoot && !realPath.startsWith(`${realRoot}${path.sep}`)) {
      throw new DoqaApiError('Autotest report must be inside the trusted report directory', 403, null);
    }
  }
  const extension = path.extname(realPath).toLowerCase();
  const allowedExtensions = type === 'allure' ? ['.zip'] : ['.xml', '.zip'];
  if (!allowedExtensions.includes(extension)) {
    throw new DoqaApiError(
      `${type} report must use one of these extensions: ${allowedExtensions.join(', ')}`,
      400,
      null,
    );
  }
  const stats = await fs.stat(realPath);
  if (!stats.isFile()) throw new DoqaApiError('Autotest report must be a regular file', 400, null);
  if (stats.size === 0) throw new DoqaApiError('Refusing to upload an empty autotest report', 400, null);
  if (stats.size > maxBytes) {
    throw new DoqaApiError(`Autotest report exceeds the ${maxBytes}-byte limit`, 413, null);
  }
  return { path: realPath, size: stats.size };
}

export function analyzeCaseData(source = {}) {
  const steps = Array.isArray(source.steps) ? source.steps : [];
  const normalizedSteps = steps.map((step) => ({
    step: htmlToText(step.step),
    result: htmlToText(step.result),
    testData: htmlToText(step.testData),
  }));
  const issues = [];
  if (!htmlToText(source.title)) issues.push('missing_title');
  if (!htmlToText(source.description)) issues.push('missing_description');
  if (!htmlToText(source.preconditions)) issues.push('missing_preconditions');
  if (!htmlToText(source.expectedResult)) issues.push('missing_expected_result');
  if (normalizedSteps.length === 0) issues.push('missing_steps');
  normalizedSteps.forEach((step, index) => {
    if (!step.step) issues.push(`step_${index + 1}_missing_action`);
    if (!step.result) issues.push(`step_${index + 1}_missing_result`);
  });
  const duplicateIndexes = normalizedSteps
    .map((step, index) => ({ key: JSON.stringify(step), index }))
    .filter((item, index, all) => all.findIndex((candidate) => candidate.key === item.key) !== index)
    .map((item) => item.index);
  if (duplicateIndexes.length) issues.push('duplicate_steps');

  const qualityScore = Math.max(
    0,
    100 -
      (issues.includes('missing_title') ? 15 : 0) -
      (issues.includes('missing_description') ? 10 : 0) -
      (issues.includes('missing_preconditions') ? 15 : 0) -
      (issues.includes('missing_expected_result') ? 20 : 0) -
      (issues.includes('missing_steps') ? 30 : 0) -
      issues.filter((issue) => issue.includes('missing_action') || issue.includes('missing_result')).length *
        8 -
      (issues.includes('duplicate_steps') ? 5 : 0),
  );
  const automationBlockers = [];
  if (!normalizedSteps.length) automationBlockers.push('Нет шагов для автоматизации');
  if (normalizedSteps.some((step) => !step.result))
    automationBlockers.push('У части шагов нет проверяемого результата');
  if (/captcha|sms|ручн|вручную|телефон|почт/i.test(JSON.stringify(source)))
    automationBlockers.push('Есть потенциальное ручное или внешнее действие');
  const automationScore = Math.max(0, 100 - automationBlockers.length * 25);
  const recommendation =
    qualityScore < 60 ? 'needs_preparation' : automationBlockers.length ? 'needs_preparation' : 'ready';
  return { qualityScore, automationScore, recommendation, issues, automationBlockers, duplicateIndexes };
}

function htmlToText(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRichText(value) {
  const text = htmlToText(value);
  return text ? `<p>${text}</p>` : '';
}

function buildSafeCaseFixes(source) {
  const changes = {};
  const normalizedFields = ['description', 'preconditions', 'expectedResult'];
  for (const field of normalizedFields) {
    const normalized = normalizeRichText(source[field]);
    if (normalized && normalized !== source[field]) changes[field] = normalized;
  }
  if (Array.isArray(source.steps)) {
    const seen = new Set();
    const steps = source.steps
      .filter((step) => {
        const key = JSON.stringify({
          step: htmlToText(step.step),
          result: htmlToText(step.result),
          testData: htmlToText(step.testData),
        });
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((step) => ({
        ...step,
        step: normalizeRichText(step.step),
        result: step.result ? normalizeRichText(step.result) : step.result,
        testData: step.testData ? normalizeRichText(step.testData) : step.testData,
      }));
    if (JSON.stringify(steps) !== JSON.stringify(source.steps)) changes.steps = steps;
  }
  return changes;
}

function takeCases(value) {
  if (Array.isArray(value)) return value.flatMap(takeCases);
  if (!value || typeof value !== 'object') return [];
  if (
    typeof value.id === 'number' &&
    (typeof value.title === 'string' || typeof value.name === 'string') &&
    value.isFolder !== true
  ) {
    return [{ ...value, title: value.title ?? value.name }];
  }
  return Object.values(value).flatMap(takeCases);
}

function takeFolders(value) {
  if (Array.isArray(value)) return value.flatMap(takeFolders);
  if (!value || typeof value !== 'object') return [];
  const folders = [];
  if (value.isFolder === true && typeof value.id === 'number')
    folders.push({
      id: value.id,
      name: value.name,
      childrenCount: value.childrenCount ?? 0,
      totalCount: value.totalCount ?? 0,
    });
  for (const child of Object.values(value)) folders.push(...takeFolders(child));
  return folders.filter((folder, index, all) => all.findIndex((item) => item.id === folder.id) === index);
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3;
}

function dedupeCases(cases) {
  return cases.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}
