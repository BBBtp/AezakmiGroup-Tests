import { NetworkController } from '@framework/network';
import { BrowserDiagnostics } from '@framework/playwright';
import { LoginPage } from '@modules/auth';
import { ChecksPage } from '@modules/checks';
import { EmployeeCreatePage } from '@modules/employees';
import { TopKeywordsPage } from '@modules/keywords';
import { KpiPage, KpiSettingsPage } from '@modules/kpi';
import { ApplicationShellComponent, DashboardPage } from '@modules/navigation';
import { NichesPage } from '@modules/niches';
import { StatisticsPage } from '@modules/statistics';
import { SuggestsPage } from '@modules/suggests';
import { coreTest, type CoreFixtures } from './core-fixtures';

export type UiFixtures = {
  loginPage: LoginPage;
  checksPage: ChecksPage;
  employeeCreatePage: EmployeeCreatePage;
  topKeywordsPage: TopKeywordsPage;
  kpiPage: KpiPage;
  kpiSettingsPage: KpiSettingsPage;
  nichesPage: NichesPage;
  statisticsPage: StatisticsPage;
  suggestsPage: SuggestsPage;
  applicationShell: ApplicationShellComponent;
  dashboardPage: DashboardPage;
  network: NetworkController;
  browserDiagnostics: BrowserDiagnostics;
};

export const uiTest = coreTest.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  checksPage: async ({ page }, use) => {
    await use(new ChecksPage(page));
  },

  employeeCreatePage: async ({ page }, use) => {
    await use(new EmployeeCreatePage(page));
  },

  topKeywordsPage: async ({ page }, use) => {
    await use(new TopKeywordsPage(page));
  },

  kpiPage: async ({ page }, use) => {
    await use(new KpiPage(page));
  },

  kpiSettingsPage: async ({ page }, use) => {
    await use(new KpiSettingsPage(page));
  },

  nichesPage: async ({ page }, use) => {
    await use(new NichesPage(page));
  },

  statisticsPage: async ({ page }, use) => {
    await use(new StatisticsPage(page));
  },

  suggestsPage: async ({ page }, use) => {
    await use(new SuggestsPage(page));
  },

  applicationShell: async ({ page }, use) => {
    await use(new ApplicationShellComponent(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  network: async ({ page, cleanup }, use) => {
    await use(new NetworkController(page, cleanup));
  },

  browserDiagnostics: async ({ page, cleanup }, use) => {
    await use(new BrowserDiagnostics(page, cleanup));
  },
});

export type BaseUiFixtures = CoreFixtures & UiFixtures;
