import assert from 'node:assert/strict';
import test from 'node:test';

import { DoqaClient } from '../../mcp/doqa-client.mjs';

const baseCase = {
  id: 42,
  spaceId: 7,
  title: 'Login succeeds',
  description: ' Authentication flow ',
  preconditions: '<p>A user exists</p>',
  expectedResult: '<p>Dashboard opens</p>',
  priority: 'high',
  status: 'ready',
  automationStatus: 'manual',
  steps: [{ step: '<p>Log in</p>', result: '<p>Dashboard opens</p>' }],
};

test('improveCase is a read-only preview by default', async () => {
  const requests = [];
  const fetchImpl = async (_url, options = {}) => {
    requests.push(options.method ?? 'GET');
    return json(200, { data: baseCase }, { ETag: 'version-1' });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );
  const result = await client.improveCase(42);

  assert.equal(result.applied, false);
  assert.deepEqual(requests, ['GET']);
  assert.deepEqual(result.changes, { description: '<p>Authentication flow</p>' });
});

test('improveCase patches the exact analyzed ETag without a second pre-update read', async () => {
  const requests = [];
  const fetchImpl = async (_url, options = {}) => {
    const method = options.method ?? 'GET';
    requests.push({ method, ifMatch: options.headers?.['If-Match'] });
    if (method === 'PATCH') {
      return json(200, { data: { ...baseCase, description: '<p>Authentication flow</p>' } });
    }
    const version = requests.filter((item) => item.method === 'GET').length;
    return json(
      200,
      {
        data: {
          ...baseCase,
          description: version === 1 ? baseCase.description : '<p>Authentication flow</p>',
        },
      },
      { ETag: `version-${version}` },
    );
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );
  const result = await client.improveCase(42, { apply: true });

  assert.equal(result.applied, true);
  assert.deepEqual(
    requests.map((item) => item.method),
    ['GET', 'PATCH', 'GET'],
  );
  assert.equal(requests[1].ifMatch, 'version-1');
});

test('improveCase re-analyzes a 412 conflict and does not overwrite the newer case', async () => {
  let getCount = 0;
  let patchCount = 0;
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'PATCH') {
      patchCount += 1;
      return json(412, { message: 'version conflict' });
    }
    getCount += 1;
    return json(
      200,
      {
        data: {
          ...baseCase,
          description: getCount === 1 ? ' Authentication flow ' : '<p>Changed by another user</p>',
        },
      },
      { ETag: `version-${getCount}` },
    );
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );
  const result = await client.improveCase(42, { apply: true });

  assert.equal(result.applied, false);
  assert.equal(result.conflict, true);
  assert.equal(result.reason, 'case_changed_after_analysis');
  assert.equal(result.etag, 'version-2');
  assert.equal(patchCount, 1);
  assert.equal(getCount, 2);
});

test('createCase uses a stable idempotency key for an identical payload', async () => {
  const keys = [];
  const fetchImpl = async (_url, options = {}) => {
    keys.push(options.headers?.['Idempotency-Key']);
    return json(201, { data: { id: 43 } });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );
  const input = { folderId: 10, title: 'Stable create request' };

  await client.createCase(input);
  await client.createCase(input);

  assert.match(keys[0], /^[a-f0-9]{64}$/);
  assert.equal(keys[0], keys[1]);
});

test('createRunBug posts a multipart autotest defect without exposing tracker credentials', async () => {
  let request;
  const fetchImpl = async (url, options = {}) => {
    request = { url, options };
    return json(201, { data: { id: 88, title: '[AUTO][TC-568] Access control' } }, { ETag: 'bug-1' });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  const result = await client.createRunBug({
    runElementId: 9001,
    title: '[AUTO][TC-568] Access control',
    actualResult: 'The session is cleared',
    expectedResult: 'The session remains active',
    content: '<p>Evidence</p>',
  });

  assert.equal(request.url, 'http://doqa.test/api/run-bugs');
  assert.equal(request.options.method, 'POST');
  assert.ok(request.options.body instanceof FormData);
  assert.equal(request.options.body.get('type'), 'autotest');
  assert.equal(request.options.body.get('itemId'), '9001');
  assert.equal(request.options.body.get('useRelationTracker'), 'true');
  assert.equal(request.options.headers['Content-Type'], undefined);
  assert.equal(result.bug.id, 88);
  assert.equal(result.etag, 'bug-1');
});

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 412 ? 'Precondition Failed' : 'OK',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
