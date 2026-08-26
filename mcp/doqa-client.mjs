import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

dotenv.config({ path: process.env.DOQA_ENV_FILE?.trim() || undefined });

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
    sessionToken: process.env.DOQA_SESSION_TOKEN?.trim() || undefined,
    login: process.env.DOQA_LOGIN?.trim() || undefined,
    password: process.env.DOQA_PASSWORD?.trim() || undefined,
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
    this.folderAuthTokenPromise = null;
  }

  async request(path, options = {}) {
    const { authToken, ...requestOptions } = options;
    const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const response = await this.fetch(`${this.config.endpoint}${path}`, {
      ...requestOptions,
      headers: {
        Authorization: `Bearer ${authToken ?? this.config.token}`,
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

  async getFolderAuthToken() {
    if (this.config.sessionToken) return this.config.sessionToken;
    if (!this.config.login || !this.config.password) return this.config.token;
    if (!this.folderAuthTokenPromise) {
      this.folderAuthTokenPromise = this.loginForFolderAccess();
    }
    return this.folderAuthTokenPromise;
  }

  async loginForFolderAccess() {
    const response = await this.fetch(`${this.config.endpoint}/api/auth/user-login`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.config.login, password: this.config.password }),
    });
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!response.ok) {
      throw new DoqaApiError(
        `DoQA user login failed with status ${response.status}; credentials were not logged`,
        response.status,
        null,
      );
    }
    const token = takeAuthToken(body);
    if (!token) {
      throw new DoqaApiError('DoQA user login did not return an access token', 502, null);
    }
    return token;
  }

  async folderRequest(path, options = {}) {
    return this.request(path, { ...options, authToken: await this.getFolderAuthToken() });
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

  async listChecklists({ limit = 20, folderId, search } = {}) {
    const payload = {
      spaceId: this.config.spaceId,
      ...(folderId ? { folderId } : {}),
      ...(search ? { search } : {}),
    };
    const { body: tree } = await this.request('/api/checklists/list', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const folders = await this.discoverItemFolders(tree, 'checklists');
    const targetFolders = folderId
      ? folders.filter((folder) => folder.id === folderId)
      : folders.filter((folder) => folder.childrenCount === 0);
    const folderResults = await Promise.all(
      targetFolders.map(async (folder) => {
        const checklists = [];
        for (let offset = 0; ; offset += 1) {
          const { body } = await this.request('/api/checklists/list/part', {
            method: 'POST',
            body: JSON.stringify({ ...payload, folderId: folder.id, offset }),
          });
          const page = takeItems(body);
          checklists.push(...page);
          if (page.length === 0) break;
        }
        return { folder, checklists };
      }),
    );
    const checklists = folderResults.flatMap(({ folder, checklists: folderChecklists }) =>
      folderChecklists.map((item) => ({ ...item, folderId: item.folderId ?? folder.id })),
    );
    return {
      spaceId: this.config.spaceId,
      limit,
      folders,
      checklists: dedupeItems(checklists).slice(0, limit),
      raw: tree,
    };
  }

  async getChecklist(checklistId) {
    const { body, headers } = await this.request(`/api/checklists/${encodeURIComponent(checklistId)}`);
    const source = checklistSource(body);
    return { checklist: body, etag: headers.get('etag') ?? source?.versionUuid ?? null };
  }

  async getChecklistFolders() {
    const { body, headers } = await this.folderRequest(
      `/api/folders/space/${encodeURIComponent(this.config.spaceId)}/checklist`,
    );
    return {
      spaceId: this.config.spaceId,
      type: 'checklist',
      folders: takeFolderEntries(body),
      etag: headers.get('etag'),
      raw: body,
    };
  }

  async createChecklistFolder({ parentId, name }, { idempotencyKey } = {}) {
    if (!Number.isInteger(Number(parentId)) || Number(parentId) <= 0) {
      throw new DoqaApiError('A positive checklist parentId is required', 400, null);
    }
    const normalizedName = String(name ?? '').trim();
    if (!normalizedName) throw new DoqaApiError('A checklist folder name is required', 400, null);
    if (normalizedName.length > 255) {
      throw new DoqaApiError('A checklist folder name cannot exceed 255 characters', 400, null);
    }

    const before = await this.getChecklistFolders();
    if (!before.etag) {
      throw new DoqaApiError('DoQA did not return a folder-tree ETag; refusing unsafe creation', 409, null);
    }
    const parent = before.folders.find((folder) => folder.id === Number(parentId));
    if (!parent) {
      throw new DoqaApiError(`Checklist parent folder ${parentId} was not found`, 404, null);
    }
    const duplicate = before.folders.find(
      (folder) =>
        folder.parentId === Number(parentId) &&
        folder.name.trim().toLocaleLowerCase('ru') === normalizedName.toLocaleLowerCase('ru'),
    );
    if (duplicate) {
      throw new DoqaApiError(
        `Checklist folder already exists under parent ${parentId}: #${duplicate.id} ${duplicate.name}`,
        409,
        duplicate,
      );
    }

    const payload = {
      spaceId: this.config.spaceId,
      type: 'checklist',
      name: normalizedName,
      parentId: Number(parentId),
    };
    const { body } = await this.folderRequest('/api/folders', {
      method: 'POST',
      headers: {
        'If-Match': before.etag,
        'Idempotency-Key': idempotencyKey ?? stableKey('create-checklist-folder', payload),
      },
      body: JSON.stringify(payload),
    });
    const created = body?.data ?? body;
    const createdId = Number(created?.id ?? created?.data?.id);
    const after = await this.getChecklistFolders();
    const folder =
      (createdId > 0 ? after.folders.find((item) => item.id === createdId) : null) ??
      after.folders.find(
        (item) =>
          item.parentId === Number(parentId) &&
          item.name.trim().toLocaleLowerCase('ru') === normalizedName.toLocaleLowerCase('ru'),
      );
    if (!folder) {
      throw new DoqaApiError(
        'DoQA created a checklist folder but it was not found during verification',
        502,
        body,
      );
    }
    return {
      folder,
      parent,
      spaceId: this.config.spaceId,
      type: 'checklist',
      beforeEtag: before.etag,
      afterEtag: after.etag,
    };
  }

  async createChecklist(
    {
      folderId,
      title,
      description = '',
      preconditions = '',
      expectedResult = '',
      children = [],
      priority = 'medium',
      status = 'ready',
      tagIds = [],
      attributes = [],
      responsibleId,
    },
    { idempotencyKey } = {},
  ) {
    if (!folderId) throw new DoqaApiError('A DoQA folderId is required to create a checklist', 400, null);
    if (!title?.trim()) throw new DoqaApiError('A DoQA checklist title is required', 400, null);
    const normalizedChildren = normalizeChecklistChildren(children);
    validateChecklistTree(normalizedChildren);
    const payload = {
      spaceId: this.config.spaceId,
      folderId,
      title: title.trim(),
      description,
      preconditions,
      expectedResult,
      children: normalizedChildren,
      priority,
      status,
      tagIds,
      attributes,
      ...(responsibleId ? { responsibleId } : {}),
    };
    const { body } = await this.request('/api/checklists', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey ?? stableKey('create-checklist', payload) },
      body: JSON.stringify(payload),
    });
    const created = body?.data ?? body;
    const checklistId = checklistSource(created)?.id;
    if (!checklistId)
      throw new DoqaApiError(
        'DoQA created a checklist but did not return its ID; refusing an unverifiable result',
        502,
        body,
      );
    const after = await this.getChecklist(checklistId);
    return { checklist: created, checklistId, after };
  }

  async updateChecklist(checklistId, changes) {
    const changedFields = pickDefined(changes, [
      'title',
      'description',
      'preconditions',
      'expectedResult',
      'priority',
      'status',
      'tagIds',
      'responsibleId',
    ]);
    if (Object.keys(changedFields).length === 0 && !(changes.appendChildren?.length > 0)) {
      throw new DoqaApiError('At least one checklist change is required', 400, null);
    }
    const current = await this.getChecklist(checklistId);
    if (!current.etag)
      throw new DoqaApiError(
        `DoQA did not return an ETag/versionUuid for checklist ${checklistId}; refusing unsafe update`,
        428,
        null,
      );
    const source = checklistSource(current.checklist);
    if (source?.spaceId !== undefined && Number(source.spaceId) !== Number(this.config.spaceId)) {
      throw new DoqaApiError(
        `Checklist ${checklistId} belongs to space ${source.spaceId}, not ${this.config.spaceId}`,
        409,
        null,
      );
    }
    const appendChildren = normalizeChecklistChildren(changes.appendChildren ?? []);
    validateChecklistTree(appendChildren);
    assertNoDuplicateChecklistPaths(source.children ?? [], appendChildren);
    const children = [
      ...normalizeChecklistChildren(source.children ?? [], { preserveIds: true }),
      ...appendChildren,
    ];
    validateChecklistTree(children);
    const payload = {
      id: source.id ?? Number(checklistId),
      spaceId: source.spaceId ?? this.config.spaceId,
      folderId: source.folderId,
      title: source.title ?? '',
      description: source.description ?? '',
      preconditions: source.preconditions ?? '',
      expectedResult: source.expectedResult ?? '',
      priority: source.priority ?? 'medium',
      status: source.status ?? 'review',
      children,
      tagIds: source.tagIds ?? [],
      attributes: source.attributes ?? [],
      ...(source.responsible?.id ? { responsibleId: source.responsible.id } : {}),
      ...changedFields,
    };
    const { body } = await this.request('/api/checklists', {
      method: 'PATCH',
      headers: { 'If-Match': current.etag },
      body: JSON.stringify(payload),
    });
    const after = await this.getChecklist(checklistId);
    return {
      checklist: body,
      checklistId: payload.id,
      etag: current.etag,
      changes,
      after,
    };
  }

  async restructureChecklist(checklistId, children) {
    const current = await this.getChecklist(checklistId);
    if (!current.etag) {
      throw new DoqaApiError(
        `DoQA did not return an ETag/versionUuid for checklist ${checklistId}; refusing unsafe restructure`,
        428,
        null,
      );
    }
    const source = checklistSource(current.checklist);
    if (source?.spaceId !== undefined && Number(source.spaceId) !== Number(this.config.spaceId)) {
      throw new DoqaApiError(
        `Checklist ${checklistId} belongs to space ${source.spaceId}, not ${this.config.spaceId}`,
        409,
        null,
      );
    }

    const currentChildren = normalizeChecklistChildren(source.children ?? [], { preserveIds: true });
    const desiredChildren = normalizeChecklistChildren(children, { preserveIds: true });
    validateChecklistTree(desiredChildren);
    assertChecklistRestructurePreservesExistingItems(currentChildren, desiredChildren);

    const payload = {
      id: source.id ?? Number(checklistId),
      spaceId: source.spaceId ?? this.config.spaceId,
      folderId: source.folderId,
      title: source.title ?? '',
      description: source.description ?? '',
      preconditions: source.preconditions ?? '',
      expectedResult: source.expectedResult ?? '',
      priority: source.priority ?? 'medium',
      status: source.status ?? 'review',
      children: desiredChildren,
      tagIds: source.tagIds ?? [],
      attributes: source.attributes ?? [],
      ...(source.responsible?.id ? { responsibleId: source.responsible.id } : {}),
    };
    const { body } = await this.request('/api/checklists', {
      method: 'PATCH',
      headers: { 'If-Match': current.etag },
      body: JSON.stringify(payload),
    });
    const after = await this.getChecklist(checklistId);
    const afterSource = checklistSource(after.checklist);
    assertChecklistTreeMatchesDesired(desiredChildren, afterSource.children ?? []);
    return {
      checklist: body,
      checklistId: payload.id,
      beforeEtag: current.etag,
      afterEtag: after.etag,
      preservedItemIds: collectChecklistItems(currentChildren).map((item) => item.id),
      groupNodesCreated: collectChecklistItems(desiredChildren).filter((item) => item.id === null).length,
      after,
    };
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

  async prepareProductBugDraft({
    runId,
    caseId,
    evidence,
    title,
    actualResult,
    expectedResult,
    priority = 'high',
  }) {
    if (!evidence?.trim()) {
      throw new DoqaApiError('Evidence is required for a confirmed product bug draft', 400, null);
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
        `Run element for case ${caseId} is ${element.status}; refusing to prepare a bug draft`,
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
    const sourceCase = caseSnapshot.case?.data ?? caseSnapshot.case;
    const resolvedTitle = truncate(title?.trim() || `${marker} ${sourceCase.title}`, 255);
    const resolvedActual =
      actualResult?.trim() || failureText(element) || `Autotest finished with status ${element.status}`;
    const resolvedExpected =
      expectedResult?.trim() || htmlToText(sourceCase.expectedResult) || 'The scenario passes';
    const content = buildBugDraftContent({
      marker,
      run,
      caseId,
      element,
      evidence: evidence.trim(),
      actualResult: resolvedActual,
      expectedResult: resolvedExpected,
    });
    return {
      runId,
      caseId,
      runElementId: element.id,
      status: element.status,
      classification: 'product',
      confirmedProduct: true,
      marker,
      title: resolvedTitle,
      priority,
      actualResult: resolvedActual,
      expectedResult: resolvedExpected,
      content,
      duplicate: duplicate
        ? {
            found: true,
            existingBug: safeBugSummary(duplicate),
          }
        : { found: false },
      readOnly: true,
    };
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

  async discoverItemFolders(tree, itemType) {
    const folders = takeFolders(tree);
    const expanded = new Set();
    for (let index = 0; index < folders.length; index += 1) {
      const folder = folders[index];
      if (folder.childrenCount === 0 || expanded.has(folder.id)) continue;
      expanded.add(folder.id);
      const { body } = await this.request(`/api/${itemType}/list`, {
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

function checklistSource(value) {
  return value?.data ?? value?.itemView ?? value;
}

function takeAuthToken(value) {
  if (!value || typeof value !== 'object') return null;
  for (const key of ['token', 'accessToken', 'access_token']) {
    if (typeof value[key] === 'string' && value[key].trim()) return value[key].trim();
  }
  for (const nested of Object.values(value)) {
    const token = takeAuthToken(nested);
    if (token) return token;
  }
  return null;
}

function normalizeChecklistChildren(children, { preserveIds = false } = {}) {
  if (!Array.isArray(children)) return [];
  return children.map((child) => ({
    id: preserveIds && Number(child?.id) > 0 ? Number(child.id) : null,
    title: String(child?.title ?? '').trim(),
    children: normalizeChecklistChildren(child?.children, { preserveIds }),
  }));
}

function validateChecklistTree(children) {
  const paths = [];
  const visit = (nodes, parentPath = [], depth = 1) => {
    if (nodes.length > 0 && depth > 8)
      throw new DoqaApiError('A DoQA checklist cannot be deeper than 8 levels', 400, null);
    for (const node of nodes) {
      if (!node.title) throw new DoqaApiError('Every DoQA checklist item requires a title', 400, null);
      const path = [...parentPath, node.title.trim().toLocaleLowerCase('ru')];
      const key = path.join(' > ');
      if (paths.includes(key)) throw new DoqaApiError(`Duplicate checklist item path: ${key}`, 409, null);
      paths.push(key);
      visit(node.children ?? [], path, depth + 1);
    }
  };
  visit(children);
  if (paths.length > 300)
    throw new DoqaApiError('A DoQA checklist cannot contain more than 300 items', 400, null);
}

function assertNoDuplicateChecklistPaths(existing, appended) {
  const collect = (nodes, parentPath = [], result = new Set()) => {
    for (const node of nodes) {
      const path = [
        ...parentPath,
        String(node?.title ?? '')
          .trim()
          .toLocaleLowerCase('ru'),
      ];
      result.add(path.join(' > '));
      collect(node?.children ?? [], path, result);
    }
    return result;
  };
  const existingPaths = collect(existing);
  const appendedPaths = collect(appended);
  for (const path of appendedPaths) {
    if (existingPaths.has(path)) throw new DoqaApiError(`Checklist item already exists: ${path}`, 409, null);
  }
}

function collectChecklistItems(children, result = []) {
  for (const child of children ?? []) {
    result.push(child);
    collectChecklistItems(child.children, result);
  }
  return result;
}

function assertChecklistRestructurePreservesExistingItems(currentChildren, desiredChildren) {
  const currentItems = collectChecklistItems(currentChildren);
  const desiredItems = collectChecklistItems(desiredChildren);
  const currentById = new Map(
    currentItems.filter((item) => item.id > 0).map((item) => [item.id, item.title]),
  );
  const desiredExisting = desiredItems.filter((item) => item.id > 0);
  const desiredIds = desiredExisting.map((item) => item.id);
  if (new Set(desiredIds).size !== desiredIds.length) {
    throw new DoqaApiError('A checklist restructure cannot duplicate an existing check ID', 409, null);
  }
  if (currentById.size !== desiredIds.length || desiredIds.some((id) => !currentById.has(id))) {
    throw new DoqaApiError(
      'A checklist restructure must preserve every existing check ID exactly once',
      409,
      null,
    );
  }
  for (const item of desiredExisting) {
    if (currentById.get(item.id) !== item.title) {
      throw new DoqaApiError(
        `A checklist restructure cannot change the title of existing check ${item.id}`,
        409,
        null,
      );
    }
  }
  const newGroups = desiredItems.filter((item) => item.id === null);
  if (newGroups.some((item) => !item.children?.length)) {
    throw new DoqaApiError('Every new hierarchy group must contain at least one check', 400, null);
  }
}

function assertChecklistTreeMatchesDesired(desiredChildren, actualChildren) {
  const visit = (desired, actual, path = 'root') => {
    if (!Array.isArray(actual) || desired.length !== actual.length) {
      throw new DoqaApiError(`Checklist restructure verification failed at ${path}`, 502, null);
    }
    desired.forEach((expected, index) => {
      const received = actual[index];
      const nodePath = `${path}/${index}`;
      if (expected.title !== received?.title || (expected.id > 0 && expected.id !== received?.id)) {
        throw new DoqaApiError(`Checklist restructure verification failed at ${nodePath}`, 502, null);
      }
      visit(expected.children ?? [], received.children ?? [], nodePath);
    });
  };
  visit(desiredChildren, actualChildren);
}

function pickDefined(source, fields) {
  return Object.fromEntries(
    fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]),
  );
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

function buildBugDraftContent({ marker, run, caseId, element, evidence, actualResult, expectedResult }) {
  return [
    `${marker} Подтверждённый дефект продукта`,
    '',
    `DoQA run: ${run.id} — ${run.title ?? ''}`,
    `Test case: #${caseId} — ${element.title ?? ''}`,
    'Классификация: product',
    `Основание: ${evidence}`,
    '',
    `Ожидаемый результат: ${expectedResult}`,
    '',
    `Фактический результат: ${actualResult}`,
  ].join('\n');
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
  return takeItems(value);
}

function takeItems(value) {
  if (Array.isArray(value)) return value.flatMap(takeItems);
  if (!value || typeof value !== 'object') return [];
  if (
    typeof value.id === 'number' &&
    (typeof value.title === 'string' || typeof value.name === 'string') &&
    value.isFolder !== true
  ) {
    return [{ ...value, title: value.title ?? value.name }];
  }
  return Object.values(value).flatMap(takeItems);
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

function takeFolderEntries(value, parentId = null) {
  if (Array.isArray(value)) return value.flatMap((item) => takeFolderEntries(item, parentId));
  if (!value || typeof value !== 'object') return [];

  const wrappedFolder =
    Array.isArray(value.children) &&
    typeof value.data?.id === 'number' &&
    typeof value.data?.name === 'string'
      ? value.data
      : null;
  const node = value.isFolder === true ? value : value.data?.isFolder === true ? value.data : wrappedFolder;
  if (node && typeof node.id === 'number') {
    const entry = {
      id: node.id,
      name: String(node.name ?? ''),
      parentId,
      childrenCount: node.childrenCount ?? 0,
      totalCount: node.totalCount ?? 0,
    };
    const children = Array.isArray(value.children) ? value.children : [];
    return [entry, ...children.flatMap((child) => takeFolderEntries(child, node.id))];
  }

  return Object.values(value).flatMap((child) => takeFolderEntries(child, parentId));
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3;
}

function dedupeCases(cases) {
  return dedupeItems(cases);
}

function dedupeItems(items) {
  return items.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}
