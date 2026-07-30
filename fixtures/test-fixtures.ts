import { test as baseTest } from '@playwright/test';
import { LoginPage } from '@modules/auth';
import { KpiPage, KpiSettingsPage } from '@modules/kpi';
import { CleanupRegistry } from '@framework/lifecycle';
import { TestSessionFactory } from '@framework/playwright';
import { ApplicationShellComponent, DashboardPage } from '@modules/navigation';
import { testUsers } from './users';

/**
 * Типы кастомных фикстур для тестов
 */
export type TestFixtures = {
  /** Страница логина */
  loginPage: LoginPage;

  /** Админ-пользователь */
  adminUser: typeof testUsers.admin;

  /** Обычный пользователь */
  regularUser: typeof testUsers.user;

  /** KPI страница */
  kpiPage: KpiPage;

  /** KPI Settings страница */
  kpiSettingsPage: KpiSettingsPage;

  /** LIFO-реестр гарантированной очистки созданных тестовых данных. */
  cleanup: CleanupRegistry;

  applicationShell: ApplicationShellComponent;

  dashboardPage: DashboardPage;

  sessions: TestSessionFactory;
};

/**
 * Кастомный test с фикстурами:
 * - loginPage
 * - adminUser
 * - regularUser
 * - kpiPage
 * - kpiSettingsPage
 */
export const test = baseTest.extend<TestFixtures>({
  /**
   * Фикстура страницы логина
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Фикстура админ-пользователя
   */
  adminUser: async ({}, use) => {
    await use(testUsers.admin);
  },

  /**
   * Фикстура обычного пользователя
   */
  regularUser: async ({}, use) => {
    await use(testUsers.user);
  },

  /** KPI page использует page и storageState текущего Playwright project. */
  kpiPage: async ({ page }, use) => {
    await use(new KpiPage(page));
  },

  /** KPI Settings page использует page и storageState текущего Playwright project. */
  kpiSettingsPage: async ({ page }, use) => {
    await use(new KpiSettingsPage(page));
  },

  cleanup: async ({ page: _page }, use, testInfo) => {
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

  applicationShell: async ({ page }, use) => {
    await use(new ApplicationShellComponent(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  sessions: async ({ browser, cleanup }, use) => {
    await use(new TestSessionFactory(browser, cleanup));
  },
});
