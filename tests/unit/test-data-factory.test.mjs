import assert from 'node:assert/strict';
import test from 'node:test';

import { TestDataFactory } from '../../framework/data/test-data-factory.js';

test('TestDataFactory creates scoped labels without collisions inside one test', () => {
  const factory = new TestDataFactory();

  const first = factory.uniqueLabel('employee');
  const second = factory.uniqueLabel('employee');

  assert.match(first, /^employee-\d+-1$/);
  assert.match(second, /^employee-\d+-2$/);
  assert.notEqual(first, second);
});

test('TestDataFactory returns the first unoccupied number in the requested range', () => {
  const factory = new TestDataFactory();

  assert.equal(factory.firstAvailableNumber(['31', 32, '34'], { min: 31, max: 35 }), 33);
  assert.throws(
    () => factory.firstAvailableNumber([1, 2], { min: 1, max: 2 }),
    /No available number in range 1\.\.2/,
  );
});
