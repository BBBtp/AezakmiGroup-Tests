import assert from 'node:assert/strict';
import test from 'node:test';

import { CleanupRegistry } from '../../framework/lifecycle/cleanup-registry.js';

test('CleanupRegistry runs active cleanup tasks once in LIFO order', async () => {
  const registry = new CleanupRegistry();
  const calls = [];
  registry.register('first', () => calls.push('first'));
  registry.register('second', async () => calls.push('second'));

  await registry.runAll();
  await registry.runAll();

  assert.deepEqual(calls, ['second', 'first']);
  assert.equal(registry.pendingCount, 0);
});

test('CleanupRegistry supports eager cleanup and dismissing a task', async () => {
  const registry = new CleanupRegistry();
  const calls = [];
  const eager = registry.register('eager', () => calls.push('eager'));
  const dismissed = registry.register('dismissed', () => calls.push('dismissed'));

  await eager.runNow();
  dismissed.dismiss();
  await registry.runAll();

  assert.deepEqual(calls, ['eager']);
});

test('CleanupRegistry aggregates failures and continues remaining cleanup', async () => {
  const registry = new CleanupRegistry();
  const calls = [];
  registry.register('survives', () => calls.push('survives'));
  registry.register('fails', () => {
    throw new Error('delete failed');
  });

  await assert.rejects(registry.runAll(), {
    name: 'AggregateError',
    message: '1 cleanup task(s) failed',
  });
  assert.deepEqual(calls, ['survives']);
});

test('CleanupRegistry retries an eager cleanup that failed during fixture teardown', async () => {
  const registry = new CleanupRegistry();
  let attempts = 0;
  const cleanup = registry.register('retryable', () => {
    attempts += 1;
    if (attempts === 1) throw new Error('temporary API failure');
  });

  await assert.rejects(cleanup.runNow(), /temporary API failure/);
  assert.equal(registry.pendingCount, 1);

  await registry.runAll();

  assert.equal(attempts, 2);
  assert.equal(registry.pendingCount, 0);
});
