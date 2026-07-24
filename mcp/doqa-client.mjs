import dotenv from 'dotenv';
import fs from 'node:fs/promises';

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
  return { endpoint, spaceId, projectId: process.env.DOQA_PROJECT_ID?.trim() || undefined, token: required('DOQA_TOKEN') };
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
  constructor(config = getDoqaConfig()) {
    this.config = config;
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.config.endpoint}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });

    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!response.ok) throw new DoqaApiError(`DoQA API ${response.status} ${response.statusText}`, response.status, body);
    return { body, headers: response.headers };
  }

  async listAutomationCandidates({ limit = 6, priorities = ['high', 'medium', 'low'], statuses = ['ready', 'review'], search, automationStatuses = ['planned'] } = {}) {
    const payload = {
      spaceId: this.config.spaceId,
      automationStatuses,
      priorities,
      statuses,
      sort: 'priority',
      direction: 'desc',
      ...(search ? { search } : {}),
    };
    const { body: tree } = await this.request('/api/cases/list', { method: 'POST', body: JSON.stringify(payload) });
    const folders = await this.discoverFolders(tree);
    const leafFolders = folders.filter((folder) => folder.childrenCount === 0);
    const folderResults = await Promise.all(leafFolders.map(async (folder) => {
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
    }));
    const cases = folderResults.flatMap(({ folder, cases: folderCases }) => folderCases.map((item) => ({ ...item, folderId: item.folderId ?? folder.id })));
    cases.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.id - b.id);
    return { spaceId: this.config.spaceId, limit, folders, cases: dedupeCases(cases).slice(0, limit), raw: tree };
  }

  async getCase(caseId) {
    const { body, headers } = await this.request(`/api/cases/${encodeURIComponent(caseId)}`);
    const source = body?.data ?? body;
    return { case: body, etag: headers.get('etag') ?? source?.versionUuid ?? null };
  }

  async createCase({
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
  }) {
    if (!folderId) throw new DoqaApiError('A DoQA folderId is required to create a case', 400, null);
    if (!title?.trim()) throw new DoqaApiError('A DoQA case title is required', 400, null);
    const { body } = await this.request('/api/cases', {
      method: 'POST',
      body: JSON.stringify({
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
      }),
    });
    return body?.data ?? body;
  }

  async updateCase(caseId, changes) {
    const current = await this.getCase(caseId);
    if (!current.etag) throw new DoqaApiError(`DoQA did not return an ETag/versionUuid for case ${caseId}; refusing unsafe update`, 428, null);
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

  async improveCase(caseId, { apply = true } = {}) {
    const analyzed = await this.analyzeCase(caseId);
    const source = analyzed.case?.data ?? analyzed.case;
    const changes = buildSafeCaseFixes(source);
    if (!apply || Object.keys(changes).length === 0) {
      return { caseId, applied: false, analysis: analyzed.analysis, changes, etag: analyzed.etag };
    }
    const updated = await this.updateCase(caseId, changes);
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
    const data = body?.data ?? body;
    return Array.isArray(data) ? data : [];
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
    if (!current.etag) throw new DoqaApiError(`DoQA did not return an ETag/versionUuid for case ${caseId}; refusing unsafe update`, 428, null);
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
    const { body } = await this.request('/api/cases', {
      method: 'PATCH',
      headers: { 'If-Match': current.etag },
      body: JSON.stringify(payload),
    });
    return { case: body, caseId: payload.id, claimed: true, status: 'review', automationStatus: 'planned' };
  }

  async createRunFromAutotestReport({ reportToken, title }) {
    if (!reportToken?.trim()) {
      throw new DoqaApiError('A DoQA autotest report token is required', 400, null);
    }

    const runTitle = title?.trim() || `Автотесты ${new Date().toISOString()}`;
    const { body } = await this.request('/api/runs/from-autotest-report', {
      method: 'POST',
      body: JSON.stringify({ token: reportToken.trim(), title: runTitle, spaceId: this.config.spaceId }),
    });

    return { ...body, title: runTitle, spaceId: this.config.spaceId };
  }

  async uploadAutotestReport({ reportToken, reportPath, type = 'allure', title }) {
    if (!reportToken?.trim()) throw new DoqaApiError('A DoQA autotest report token is required', 400, null);
    if (!reportPath?.trim()) throw new DoqaApiError('An autotest report path is required', 400, null);

    const report = await fs.readFile(reportPath);
    const form = new FormData();
    form.append('token', reportToken.trim());
    form.append('type', type);
    form.append('spaceId', String(this.config.spaceId));
    if (title?.trim()) form.append('title', title.trim());
    form.append('file', new Blob([report]), reportPath.split('/').pop() ?? 'allure-results.zip');

    const response = await fetch(`${this.config.endpoint}/api/autotests/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.config.token}`, Accept: 'application/json' },
      body: form,
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!response.ok) throw new DoqaApiError(`DoQA API ${response.status} ${response.statusText}`, response.status, body);
    return { ...body, spaceId: this.config.spaceId, type };
  }
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

  const qualityScore = Math.max(0, 100
    - (issues.includes('missing_title') ? 15 : 0)
    - (issues.includes('missing_description') ? 10 : 0)
    - (issues.includes('missing_preconditions') ? 15 : 0)
    - (issues.includes('missing_expected_result') ? 20 : 0)
    - (issues.includes('missing_steps') ? 30 : 0)
    - issues.filter((issue) => issue.includes('missing_action') || issue.includes('missing_result')).length * 8
    - (issues.includes('duplicate_steps') ? 5 : 0));
  const automationBlockers = [];
  if (!normalizedSteps.length) automationBlockers.push('Нет шагов для автоматизации');
  if (normalizedSteps.some((step) => !step.result)) automationBlockers.push('У части шагов нет проверяемого результата');
  if (/captcha|sms|ручн|вручную|телефон|почт/i.test(JSON.stringify(source))) automationBlockers.push('Есть потенциальное ручное или внешнее действие');
  const automationScore = Math.max(0, 100 - automationBlockers.length * 25);
  const recommendation = qualityScore < 60 ? 'needs_preparation' : automationBlockers.length ? 'needs_preparation' : 'ready';
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
    const steps = source.steps.filter((step) => {
      const key = JSON.stringify({ step: htmlToText(step.step), result: htmlToText(step.result), testData: htmlToText(step.testData) });
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((step) => ({
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
  if (typeof value.id === 'number' && (typeof value.title === 'string' || typeof value.name === 'string') && value.isFolder !== true) {
    return [{ ...value, title: value.title ?? value.name }];
  }
  return Object.values(value).flatMap(takeCases);
}

function takeFolders(value) {
  if (Array.isArray(value)) return value.flatMap(takeFolders);
  if (!value || typeof value !== 'object') return [];
  const folders = [];
  if (value.isFolder === true && typeof value.id === 'number') folders.push({ id: value.id, name: value.name, childrenCount: value.childrenCount ?? 0, totalCount: value.totalCount ?? 0 });
  for (const child of Object.values(value)) folders.push(...takeFolders(child));
  return folders.filter((folder, index, all) => all.findIndex((item) => item.id === folder.id) === index);
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3;
}

function dedupeCases(cases) {
  return cases.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}
