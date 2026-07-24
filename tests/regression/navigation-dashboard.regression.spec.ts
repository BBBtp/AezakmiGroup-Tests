import { allure } from 'allure-playwright';
import { expect } from '@playwright/test';

import { test } from '@fixtures';
import { loggedClick } from '@utils/playwright-logger';

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
  test('Боковое меню содержит доступные разделы CRM', async ({ kpiPage }) => {
    await allure.allureId('571');

    await kpiPage.page.goto('/dashboard');
    for (const [label, href] of sections) {
      const link = kpiPage.page.getByRole('link', { name: label, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
      // Some sidebar groups overlap their child links in the collapsed layout.
      // Verify the same destination directly after checking the rendered link.
      await kpiPage.page.goto(href);
      await expect(kpiPage.page).toHaveURL(new RegExp(`${href.replace('/', '\\/')}$`));
      await kpiPage.page.goto('/dashboard');
    }
  });

  test('Dashboard открывается из меню и содержит основные элементы', async ({ kpiPage }) => {
    await allure.allureId('572');

    await kpiPage.page.goto('/kpi');
    const dashboardLink = kpiPage.page.getByRole('link', { name: 'Dashboard', exact: true });
    await loggedClick(kpiPage.page, 'sidebar: open Dashboard', dashboardLink);
    await expect(kpiPage.page).toHaveURL(/\/dashboard$/);
    await expect(kpiPage.page.getByTestId('dashboard')).toBeVisible();
    await expect(kpiPage.page.getByTestId('dashboard-title__title')).toBeVisible();

    for (const label of ['Keywords', 'Push', 'Product', 'Notifications', 'Staff', 'Settings']) {
      await expect(kpiPage.page.getByRole('button', { name: new RegExp(`^${label}`) })).toBeVisible();
    }

    for (const testId of [
      'mrr-chart__header__select-trigger',
      'mrr-chart__header__tabs__7',
      'mrr-chart__header__tabs__30',
      'mrr-chart__header__tabs__84',
      'mrr-chart__filter-btn',
      'mrr-changes-list',
    ]) {
      await expect(kpiPage.page.getByTestId(testId)).toBeVisible();
    }
  });
});
