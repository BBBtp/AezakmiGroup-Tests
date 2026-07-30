import { allure } from 'allure-playwright';

import { test } from '@fixtures';

const sections = [
  ['Dashboard', '/dashboard'],
  ['Statistics', '/statistics'],
  ['Top-3000', '/keywords'],
  ['Suggests', '/suggests'],
  ['Checks', '/checks'],
  ['Niches', '/niches'],
  ['Push bots', '/push-bots'],
  ['Out keywords', '/out-keywords'],
  ['Task generator', '/task-generator'],
  ['Apps', '/apps'],
  ['A/B tests', '/ab-tests'],
  ['KPI', '/kpi'],
  ['Reviews and ratings', '/reviews'],
  ['Employees', '/employees'],
  ['Vacation schedule', '/schedule'],
  ['Users', '/users'],
  ['Parameters', '/parameters'],
] as const;

test.describe('Навигация и Dashboard', () => {
  test('Боковое меню содержит доступные разделы CRM', async ({ applicationShell, dashboardPage }) => {
    await allure.allureId('571');

    await dashboardPage.navigate();
    for (const [label, href] of sections) {
      await applicationShell.expectSidebarDestination(label, href);
      // Some sidebar groups overlap their child links in the collapsed layout.
      // Verify the same destination directly after checking the rendered link.
      await dashboardPage.navigateTo(href);
      await dashboardPage.waitForUrl(new RegExp(`${href.replace('/', '\\/')}$`));
      await dashboardPage.navigate();
    }
  });

  test('Dashboard открывается из меню и содержит основные элементы', async ({ kpiPage, dashboardPage }) => {
    await allure.allureId('572');

    await kpiPage.navigate();
    await dashboardPage.openFromSidebar();
    await dashboardPage.expectBusinessControls();
  });
});
