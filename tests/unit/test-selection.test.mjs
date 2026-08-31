import assert from 'node:assert/strict';
import test from 'node:test';

import { regressionCategories, resolveTestSelection } from '../../scripts/resolve-test-selection.mjs';

test('individual TC IDs take priority and produce an exact title grep', () => {
  const selection = resolveTestSelection({
    category: 'asa',
    testIds: 'TC-845, 610;610',
    testGrep: '@ignored',
  });

  assert.equal(selection.mode, 'test-ids');
  assert.deepEqual(selection.ids, ['610', '845']);
  assert.equal(selection.grep, '\\[TC-(610|845)\\]');
  assert.deepEqual(selection.files, []);
});

test('advanced grep takes priority over a category when IDs are empty', () => {
  const selection = resolveTestSelection({ category: 'keywords', testGrep: '@critical' });
  assert.deepEqual(selection, {
    mode: 'grep',
    filtered: true,
    files: [],
    grep: '@critical',
    ids: [],
  });
});

test('category selection resolves to concrete regression files', () => {
  const selection = resolveTestSelection({ category: 'task-generator' });
  assert.equal(selection.mode, 'category');
  assert.equal(selection.filtered, true);
  assert.deepEqual(selection.files, regressionCategories['task-generator']);
  assert.equal(selection.grep, '');
});

test('all selection keeps the three-shard full regression', () => {
  assert.deepEqual(resolveTestSelection({}), {
    mode: 'all',
    filtered: false,
    files: [],
    grep: '',
    ids: [],
  });
});

test('invalid TC ID is rejected', () => {
  assert.throws(() => resolveTestSelection({ testIds: 'TC-610,bad' }), /Invalid test ID: bad/);
});
