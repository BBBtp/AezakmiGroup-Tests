import { test as baseTest } from '@playwright/test';

import { TestDataFactory } from '@framework/data';
import { CleanupRegistry } from '@framework/lifecycle';
import { TestSessionFactory } from '@framework/playwright';
import { configureAllureTestMetadata } from '@utils/allure-test-metadata';
import { testUsers } from './users';

export type CoreFixtures = {
  adminUser: typeof testUsers.admin;
  regularUser: typeof testUsers.user;
  cleanup: CleanupRegistry;
  dataFactory: TestDataFactory;
  sessions: TestSessionFactory;
  reportMetadata: void;
};

export const coreTest = baseTest.extend<CoreFixtures>({
  reportMetadata: [
    async ({}, use, testInfo) => {
      await configureAllureTestMetadata(testInfo);
      await use();
    },
    { auto: true },
  ],

  adminUser: async ({}, use) => {
    await use(testUsers.admin);
  },

  regularUser: async ({}, use) => {
    await use(testUsers.user);
  },

  cleanup: async ({}, use, testInfo) => {
    const registry = new CleanupRegistry();
    await use(registry);
    try {
      await registry.runAll();
    } catch (error) {
      await testInfo.attach('cleanup-errors', {
        body: Buffer.from(error instanceof Error ? error.stack || error.message : String(error)),
        contentType: 'text/plain',
      });
      throw error;
    }
  },

  dataFactory: async ({}, use) => {
    await use(new TestDataFactory());
  },

  sessions: async ({ browser, cleanup }, use) => {
    await use(new TestSessionFactory(browser, cleanup));
  },
});
