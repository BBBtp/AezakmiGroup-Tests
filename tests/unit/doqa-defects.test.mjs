import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyRunFailure, defectMarker, DoqaClient } from '../../mcp/doqa-client.mjs';

function clientWith(overrides = {}) {
  const client = new DoqaClient({
    endpoint: 'http://doqa.test',
    spaceId: 7,
    token: 'not-a-real-token',
  });
  Object.assign(client, {
    async getRun() {
      return { id: 321, title: 'Regression', progress: { failed: 1 }, counts: { tests: 1 } };
    },
    async listRunElements() {
      return [
        {
          id: 9001,
          viewId: 568,
          title: 'Regular user access',
          status: 'failed',
          progressInfo: { error: 'Expected Dashboard to remain visible, current URL is /login' },
        },
      ];
    },
    async getRunBugs() {
      return [];
    },
    async getCase() {
      return {
        case: {
          data: {
            id: 568,
            title: 'Regular user does not receive admin actions',
            expectedResult: '<p>User remains authorized</p>',
          },
        },
        etag: 'case-version',
      };
    },
    async listRunBugs() {
      return { bugs: [], meta: null };
    },
    async getRunElementBugInfo() {
      return { relationTracker: true, relationType: 'yandexTracker' };
    },
    ...overrides,
  });
  return client;
}

test('classifyRunFailure separates infrastructure signals from review candidates', () => {
  const infrastructure = classifyRunFailure({
    id: 1,
    viewId: 568,
    status: 'broken',
    progressInfo: { error: 'net::ERR_NAME_NOT_RESOLVED' },
  });
  const observableFailure = classifyRunFailure({
    id: 2,
    viewId: 574,
    status: 'failed',
    progressInfo: { error: 'element(s) not found' },
  });

  assert.equal(infrastructure.classification, 'infrastructure');
  assert.equal(infrastructure.confidence, 'high');
  assert.equal(observableFailure.classification, 'test_or_product');
  assert.equal(observableFailure.confidence, 'medium');
  assert.equal(defectMarker(568), '[AUTO][TC-568]');
});

test('prepareRunDefect is a read-only preview by default', async () => {
  const client = clientWith();
  const result = await client.prepareRunDefect({
    runId: 321,
    caseId: 568,
    classification: 'product',
    evidence: 'Admin route logs out a valid regular-user session.',
  });

  assert.equal(result.dryRun, true);
  assert.equal(result.applied, false);
  assert.equal(result.relationType, 'yandexTracker');
  assert.match(result.title, /^\[AUTO\]\[TC-568\]/);
});

test('prepareRunDefect blocks non-product classifications and active duplicates', async () => {
  const blocked = await clientWith().prepareRunDefect({
    runId: 321,
    caseId: 568,
    classification: 'test',
    evidence: 'The locator changed.',
    apply: true,
  });
  assert.equal(blocked.blocked, true);

  const duplicate = await clientWith({
    async listRunBugs() {
      return {
        bugs: [{ id: 77, title: '[AUTO][TC-568] Existing defect', status: 'open', priority: 'high' }],
        meta: null,
      };
    },
  }).prepareRunDefect({
    runId: 321,
    caseId: 568,
    classification: 'product',
    evidence: 'Confirmed product behavior.',
    apply: true,
  });

  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.existingBug.id, 77);
});

test('prepareRunDefect creates and verifies a tracker-linked product defect', async () => {
  let createdInput;
  const client = clientWith({
    async createRunBug(input) {
      createdInput = input;
      return { bug: { id: 88 }, etag: 'bug-version' };
    },
    async waitForRunBugVerification(input) {
      return {
        id: input.bugId,
        title: '[AUTO][TC-568] Regular user access',
        status: 'open',
        trackerLinked: true,
      };
    },
  });

  const result = await client.prepareRunDefect({
    runId: 321,
    caseId: 568,
    classification: 'product',
    evidence: 'Admin route logs out a valid regular-user session.',
    apply: true,
  });

  assert.equal(result.applied, true);
  assert.equal(result.bug.id, 88);
  assert.equal(result.bug.trackerLinked, true);
  assert.equal(createdInput.useRelationTracker, true);
  assert.match(createdInput.content, /Подтверждённый дефект продукта/);
});
