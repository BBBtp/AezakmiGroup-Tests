import { NetworkController } from '@framework/network';
import { BrowserDiagnostics } from '@framework/playwright';
import { LoginPage } from '@modules/auth';
import { AdministrationPage } from '@modules/administration';
import { AppListPage } from '@modules/asa';
import { ChecksPage } from '@modules/checks';
import { EmployeeCreatePage } from '@modules/employees';
import { TopKeywordsPage } from '@modules/keywords';
import { KpiPage, KpiSettingsPage } from '@modules/kpi';
import { ApplicationShellComponent, DashboardPage, ReadOnlySectionsPage } from '@modules/navigation';
import { NichesPage } from '@modules/niches';
import { PerformancePage } from '@modules/performance';
import { ProductPage } from '@modules/product';
import { PushPage } from '@modules/push';
import { ReviewsPage } from '@modules/reviews';
import { StatisticsPage } from '@modules/statistics';
import { SubscriptionsPage } from '@modules/subscriptions';
import { SuggestsPage } from '@modules/suggests';
import { coreTest, type CoreFixtures } from './core-fixtures';

export type UiFixtures = {
  administrationPage: AdministrationPage;
  appListPage: AppListPage;
  loginPage: LoginPage;
  checksPage: ChecksPage;
  employeeCreatePage: EmployeeCreatePage;
  topKeywordsPage: TopKeywordsPage;
  kpiPage: KpiPage;
  kpiSettingsPage: KpiSettingsPage;
  nichesPage: NichesPage;
  performancePage: PerformancePage;
  productPage: ProductPage;
  pushPage: PushPage;
  reviewsPage: ReviewsPage;
  statisticsPage: StatisticsPage;
  subscriptionsPage: SubscriptionsPage;
  suggestsPage: SuggestsPage;
  applicationShell: ApplicationShellComponent;
  dashboardPage: DashboardPage;
  readOnlySectionsPage: ReadOnlySectionsPage;
  network: NetworkController;
  browserDiagnostics: BrowserDiagnostics;
};

export const uiTest = coreTest.extend<UiFixtures>({
  administrationPage: async ({ page }, use) => {
    await use(new AdministrationPage(page));
  },
  appListPage: async ({ page }, use) => {
    await use(new AppListPage(page));
  },

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

  performancePage: async ({ page }, use) => {
    await use(new PerformancePage(page));
  },

  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },

  pushPage: async ({ page }, use) => {
    await use(new PushPage(page));
  },

  reviewsPage: async ({ page }, use) => {
    await use(new ReviewsPage(page));
  },

  statisticsPage: async ({ page }, use) => {
    await use(new StatisticsPage(page));
  },

  subscriptionsPage: async ({ page }, use) => {
    await use(new SubscriptionsPage(page));
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

  readOnlySectionsPage: async ({ page }, use) => {
    await use(new ReadOnlySectionsPage(page));
  },

  network: async ({ page, cleanup }, use) => {
    await use(new NetworkController(page, cleanup));
  },

  browserDiagnostics: async ({ page, cleanup }, use) => {
    await use(new BrowserDiagnostics(page, cleanup));
  },
});

export type BaseUiFixtures = CoreFixtures & UiFixtures;
