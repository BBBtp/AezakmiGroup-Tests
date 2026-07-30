import { AuthSessionLifecycle } from '@support/auth';
import { KpiSettingsLifecycle } from '@support/kpi';
import { uiTest, type BaseUiFixtures } from './ui-fixtures';

export type DomainFixtures = {
  authSessions: AuthSessionLifecycle;
  kpiSettingsLifecycle: KpiSettingsLifecycle;
};

export const domainTest = uiTest.extend<DomainFixtures>({
  authSessions: async ({ sessions, cleanup }, use) => {
    await use(new AuthSessionLifecycle(sessions, cleanup));
  },

  kpiSettingsLifecycle: async ({ kpiSettingsPage, cleanup, dataFactory, network }, use) => {
    await use(new KpiSettingsLifecycle(kpiSettingsPage, cleanup, dataFactory, network));
  },
});

export type AllTestFixtures = BaseUiFixtures & DomainFixtures;
