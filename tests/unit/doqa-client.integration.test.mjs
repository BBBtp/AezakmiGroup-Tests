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

const baseChecklist = {
  id: 77,
  spaceId: 7,
  folderId: 10,
  title: 'Authentication checklist',
  description: '<p>Authentication coverage</p>',
  preconditions: '<p>A user exists</p>',
  expectedResult: '<p>Authentication behaves as specified</p>',
  priority: 'high',
  status: 'ready',
  children: [{ id: 701, title: 'Valid login succeeds', children: [] }],
  tagIds: [5],
  attributes: [],
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

test('listChecklists reads the selected folder without changing DoQA', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, method: options.method, body: JSON.parse(options.body) });
    if (url.endsWith('/api/checklists/list/part')) return json(200, { data: [] });
    return json(200, {
      data: { id: 10, name: 'Automation', isFolder: true, childrenCount: 0, totalCount: 0 },
    });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  const result = await client.listChecklists({ folderId: 10 });

  assert.equal(result.spaceId, 7);
  assert.deepEqual(result.checklists, []);
  assert.deepEqual(
    requests.map(({ url }) => new URL(url).pathname),
    ['/api/checklists/list', '/api/checklists/list/part'],
  );
  assert.ok(requests.every(({ method }) => method === 'POST'));
});

test('createChecklist normalizes new item IDs and uses a stable idempotency key', async () => {
  const requests = [];
  const fetchImpl = async (_url, options = {}) => {
    requests.push(options);
    if ((options.method ?? 'GET') === 'GET')
      return json(200, { data: baseChecklist }, { ETag: 'checklist-version-1' });
    return json(201, { itemView: { id: 77 } });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );
  const input = {
    folderId: 10,
    title: 'Authentication checklist',
    children: [{ title: 'Valid login succeeds', children: [] }],
  };

  await client.createChecklist(input);
  await client.createChecklist(input);

  const createRequests = requests.filter((request) => request.method === 'POST');
  const firstPayload = JSON.parse(createRequests[0].body);
  assert.equal(firstPayload.children[0].id, null);
  assert.match(createRequests[0].headers['Idempotency-Key'], /^[a-f0-9]{64}$/);
  assert.equal(createRequests[0].headers['Idempotency-Key'], createRequests[1].headers['Idempotency-Key']);
  assert.deepEqual(
    requests.map((request) => request.method ?? 'GET'),
    ['POST', 'GET', 'POST', 'GET'],
  );
});

test('createChecklistFolder uses the latest tree ETag and verifies the created child', async () => {
  const requests = [];
  let getCount = 0;
  const tree = (includeChild) => ({
    data: {
      id: 10,
      name: 'Automation',
      childrenCount: includeChild ? 1 : 0,
      totalCount: includeChild ? 1 : 0,
    },
    children: includeChild
      ? [
          {
            data: {
              id: 11,
              name: 'AI Image Generator',
              childrenCount: 0,
              totalCount: 0,
            },
            children: [],
          },
        ]
      : [],
  });
  const fetchImpl = async (url, options = {}) => {
    const method = options.method ?? 'GET';
    requests.push({ url, method, headers: options.headers, body: options.body });
    if (method === 'POST') return json(201, { data: { id: 11, name: 'AI Image Generator' } });
    getCount += 1;
    return json(200, tree(getCount > 1), { ETag: `folder-version-${getCount}` });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  const result = await client.createChecklistFolder({ parentId: 10, name: 'AI Image Generator' });

  assert.deepEqual(
    requests.map(({ method }) => method),
    ['GET', 'POST', 'GET'],
  );
  assert.equal(new URL(requests[0].url).pathname, '/api/folders/space/7/checklist');
  assert.equal(new URL(requests[1].url).pathname, '/api/folders');
  assert.equal(requests[1].headers['If-Match'], 'folder-version-1');
  assert.match(requests[1].headers['Idempotency-Key'], /^[a-f0-9]{64}$/);
  assert.deepEqual(JSON.parse(requests[1].body), {
    spaceId: 7,
    type: 'checklist',
    name: 'AI Image Generator',
    parentId: 10,
  });
  assert.equal(result.folder.id, 11);
  assert.equal(result.folder.parentId, 10);
  assert.equal(result.beforeEtag, 'folder-version-1');
  assert.equal(result.afterEtag, 'folder-version-2');
});

test('createChecklistFolder can obtain a user session token without browser automation', async () => {
  const requests = [];
  let treeReadCount = 0;
  const fetchImpl = async (url, options = {}) => {
    const method = options.method ?? 'GET';
    requests.push({ url, method, headers: options.headers, body: options.body });
    if (url.endsWith('/api/auth/user-login')) {
      return json(200, { data: { accessToken: 'short-lived-user-session' } });
    }
    if (method === 'POST') return json(201, { data: { id: 11, name: 'AI Image Generator' } });
    treeReadCount += 1;
    return json(
      200,
      {
        data: { id: 10, name: 'Automation', isFolder: true },
        children:
          treeReadCount > 1
            ? [
                {
                  data: { id: 11, name: 'AI Image Generator', isFolder: true },
                  children: [],
                },
              ]
            : [],
      },
      { ETag: `folder-version-${treeReadCount}` },
    );
  };
  const client = new DoqaClient(
    {
      endpoint: 'http://doqa.test',
      spaceId: 7,
      token: 'personal-public-api-token',
      login: 'user@example.test',
      password: 'not-a-real-password',
    },
    { fetchImpl },
  );

  const result = await client.createChecklistFolder({ parentId: 10, name: 'AI Image Generator' });

  assert.equal(result.folder.id, 11);
  assert.deepEqual(JSON.parse(requests[0].body), {
    email: 'user@example.test',
    password: 'not-a-real-password',
  });
  assert.equal(requests[0].headers.Authorization, undefined);
  assert.ok(
    requests.slice(1).every((request) => request.headers.Authorization === 'Bearer short-lived-user-session'),
  );
  assert.equal(requests.filter((request) => request.url.endsWith('/api/auth/user-login')).length, 1);
});

test('folder login failure does not expose credentials in error details', async () => {
  const fetchImpl = async () => json(401, { message: 'invalid password' });
  const client = new DoqaClient(
    {
      endpoint: 'http://doqa.test',
      spaceId: 7,
      token: 'personal-public-api-token',
      login: 'user@example.test',
      password: 'super-secret-password',
    },
    { fetchImpl },
  );

  await assert.rejects(
    client.getChecklistFolders(),
    (error) =>
      error.status === 401 &&
      error.details === null &&
      !error.message.includes('user@example.test') &&
      !error.message.includes('super-secret-password'),
  );
});

test('createChecklistFolder rejects an exact sibling duplicate without posting', async () => {
  let postCount = 0;
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'POST') postCount += 1;
    return json(
      200,
      {
        data: { id: 10, name: 'Automation', isFolder: true },
        children: [
          {
            data: { id: 11, name: 'AI Image Generator', isFolder: true },
            children: [],
          },
        ],
      },
      { ETag: 'folder-version-1' },
    );
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  await assert.rejects(
    client.createChecklistFolder({ parentId: 10, name: 'AI Image Generator' }),
    /already exists/,
  );
  assert.equal(postCount, 0);
});

test('createChecklistFolder refuses creation without a folder-tree ETag', async () => {
  let postCount = 0;
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'POST') postCount += 1;
    return json(200, { data: { id: 10, name: 'Automation', isFolder: true } });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  await assert.rejects(
    client.createChecklistFolder({ parentId: 10, name: 'AI Image Generator' }),
    /refusing unsafe creation/,
  );
  assert.equal(postCount, 0);
});

test('updateChecklist appends checks with If-Match and verifies the result', async () => {
  const requests = [];
  let getCount = 0;
  const fetchImpl = async (_url, options = {}) => {
    const method = options.method ?? 'GET';
    requests.push({ method, ifMatch: options.headers?.['If-Match'], body: options.body });
    if (method === 'PATCH') return json(200, { itemView: { ...baseChecklist } });
    getCount += 1;
    return json(
      200,
      {
        data: {
          ...baseChecklist,
          children:
            getCount === 1
              ? baseChecklist.children
              : [...baseChecklist.children, { id: 702, title: 'Invalid login is rejected', children: [] }],
        },
      },
      { ETag: `checklist-version-${getCount}` },
    );
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  const result = await client.updateChecklist(77, {
    appendChildren: [{ title: 'Invalid login is rejected', children: [] }],
  });

  assert.deepEqual(
    requests.map(({ method }) => method),
    ['GET', 'PATCH', 'GET'],
  );
  assert.equal(requests[1].ifMatch, 'checklist-version-1');
  const patchPayload = JSON.parse(requests[1].body);
  assert.equal(patchPayload.children[0].id, 701);
  assert.equal(patchPayload.children[1].id, null);
  assert.equal(result.after.etag, 'checklist-version-2');
});

test('updateChecklist refuses to replace a duplicate existing check', async () => {
  let patchCount = 0;
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'PATCH') patchCount += 1;
    return json(200, { data: baseChecklist }, { ETag: 'checklist-version-1' });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  await assert.rejects(
    client.updateChecklist(77, {
      appendChildren: [{ title: 'Valid login succeeds', children: [] }],
    }),
    /Checklist item already exists/,
  );
  assert.equal(patchCount, 0);
});

test('updateChecklist refuses to patch when DoQA does not return a version', async () => {
  let patchCount = 0;
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'PATCH') patchCount += 1;
    return json(200, { data: { ...baseChecklist, versionUuid: null } });
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  await assert.rejects(client.updateChecklist(77, { title: 'Updated title' }), /refusing unsafe update/);
  assert.equal(patchCount, 0);
});

test('restructureChecklist reparents every existing check and verifies the hierarchy', async () => {
  const requests = [];
  let getCount = 0;
  const desired = [
    {
      id: null,
      title: 'Authentication',
      children: [
        { id: 701, title: 'Valid login succeeds', children: [] },
        { id: 702, title: 'Invalid login is rejected', children: [] },
      ],
    },
  ];
  const fetchImpl = async (_url, options = {}) => {
    const method = options.method ?? 'GET';
    requests.push({ method, ifMatch: options.headers?.['If-Match'], body: options.body });
    if (method === 'PATCH') return json(200, { itemView: { ...baseChecklist } });
    getCount += 1;
    return json(
      200,
      {
        data: {
          ...baseChecklist,
          children:
            getCount === 1
              ? [
                  { id: 701, title: 'Valid login succeeds', children: [] },
                  { id: 702, title: 'Invalid login is rejected', children: [] },
                ]
              : [{ ...desired[0], id: 900 }],
        },
      },
      { ETag: `checklist-version-${getCount}` },
    );
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  const result = await client.restructureChecklist(77, desired);

  assert.deepEqual(
    requests.map(({ method }) => method),
    ['GET', 'PATCH', 'GET'],
  );
  assert.equal(requests[1].ifMatch, 'checklist-version-1');
  assert.deepEqual(JSON.parse(requests[1].body).children, desired);
  assert.deepEqual(result.preservedItemIds, [701, 702]);
  assert.equal(result.groupNodesCreated, 1);
  assert.equal(result.afterEtag, 'checklist-version-2');
});

test('restructureChecklist rejects a missing existing check without patching', async () => {
  let patchCount = 0;
  const fetchImpl = async (_url, options = {}) => {
    if (options.method === 'PATCH') patchCount += 1;
    return json(
      200,
      {
        data: {
          ...baseChecklist,
          children: [
            { id: 701, title: 'Valid login succeeds', children: [] },
            { id: 702, title: 'Invalid login is rejected', children: [] },
          ],
        },
      },
      { ETag: 'checklist-version-1' },
    );
  };
  const client = new DoqaClient(
    { endpoint: 'http://doqa.test', spaceId: 7, token: 'not-a-real-token' },
    { fetchImpl },
  );

  await assert.rejects(
    client.restructureChecklist(77, [
      {
        id: null,
        title: 'Authentication',
        children: [{ id: 701, title: 'Valid login succeeds', children: [] }],
      },
    ]),
    /preserve every existing check ID exactly once/,
  );
  assert.equal(patchCount, 0);
});

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 412 ? 'Precondition Failed' : 'OK',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
