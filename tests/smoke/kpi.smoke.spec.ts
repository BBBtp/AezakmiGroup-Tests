import { test } from '@fixtures';
import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Страница KPI', () => {
  test.beforeEach(async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('Кнопка настроек отображается и кликабельна', async ({ kpiPage }) => {
    await allure.allureId('803');
    await expect(kpiPage.settingsButton).toBeVisible();
    const errors: string[] = [];
    kpiPage.page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    await kpiPage.openSettings();
    expect(errors.length).toBe(0);
  });

  test('Основной контент рендерится, error-content скрыт', async ({ kpiPage }) => {
    await allure.allureId('804');
    await expect(kpiPage.mainContent).toBeVisible();
    await expect(kpiPage.errorContent).toBeHidden();
  });

  test('Таблица сотрудников отображается и можно открыть карточку сотрудника', async ({ kpiPage }) => {
    await allure.allureId('810');
    const table = kpiPage.employeesTable;

    await test.step('Таблица отображается', async () => {
      await expect(table.root).toBeVisible();
    });
    await test.step('Есть хотя бы одна строка', async () => {
      const count = await table.getRowCount();
      expect(count).toBeGreaterThan(0);
    });
    await test.step('Кнопка Open открывает страницу сотрудника', async () => {
      const oldUrl = kpiPage.page.url();
      await table.openFirstEmployee();
      await expect(kpiPage.page).toHaveURL(/\/kpi\/.+/);
      expect(kpiPage.page.url()).not.toBe(oldUrl);
    });
  });
});
