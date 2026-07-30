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

test('prepareProductBugDraft returns copy-ready fields without writing', async () => {
  const client = clientWith();
  const result = await client.prepareProductBugDraft({
    runId: 321,
    caseId: 568,
    evidence: 'Admin route logs out a valid regular-user session.',
  });

  assert.equal(result.readOnly, true);
  assert.equal(result.confirmedProduct, true);
  assert.equal(result.duplicate.found, false);
  assert.match(result.title, /^\[AUTO\]\[TC-568\]/);
  assert.match(result.content, /Подтверждённый дефект продукта/);
});

test('prepareProductBugDraft reports an active duplicate without creating anything', async () => {
  const result = await clientWith({
    async listRunBugs() {
      return {
        bugs: [{ id: 77, title: '[AUTO][TC-568] Existing defect', status: 'open', priority: 'high' }],
        meta: null,
      };
    },
  }).prepareProductBugDraft({
    runId: 321,
    caseId: 568,
    evidence: 'Confirmed product behavior.',
  });

  assert.equal(result.readOnly, true);
  assert.equal(result.duplicate.found, true);
  assert.equal(result.duplicate.existingBug.id, 77);
});

test('prepareProductBugDraft refuses a passing run element', async () => {
  await assert.rejects(
    clientWith({
      async listRunElements() {
        return [{ id: 9001, viewId: 568, title: 'Regular user access', status: 'passed' }];
      },
    }).prepareProductBugDraft({
      runId: 321,
      caseId: 568,
      evidence: 'No product failure exists.',
    }),
    /refusing to prepare a bug draft/,
  );
});
