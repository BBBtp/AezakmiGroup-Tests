import { AuthSessionLifecycle } from '@support/auth';
import { ChecksKeywordsLifecycle } from '@support/checks';
import { KpiSettingsLifecycle } from '@support/kpi';
import { uiTest, type BaseUiFixtures } from './ui-fixtures';

export type DomainFixtures = {
  authSessions: AuthSessionLifecycle;
  checksKeywords: ChecksKeywordsLifecycle;
  kpiSettingsLifecycle: KpiSettingsLifecycle;
};

export const domainTest = uiTest.extend<DomainFixtures>({
  authSessions: async ({ sessions, cleanup }, use) => {
    await use(new AuthSessionLifecycle(sessions, cleanup));
  },

  checksKeywords: async ({ checksPage, cleanup, dataFactory }, use) => {
    await use(new ChecksKeywordsLifecycle(checksPage, cleanup, dataFactory));
  },

  kpiSettingsLifecycle: async ({ kpiSettingsPage, cleanup, dataFactory, network }, use) => {
    await use(new KpiSettingsLifecycle(kpiSettingsPage, cleanup, dataFactory, network));
  },
});

export type AllTestFixtures = BaseUiFixtures & DomainFixtures;
