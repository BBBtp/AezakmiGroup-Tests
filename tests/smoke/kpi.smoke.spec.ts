import { test } from '@fixtures';
import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test.describe('Страница KPI', () => {
  test.beforeEach(async ({ kpiPage }) => {
    await kpiPage.navigate();
  });

  test('Кнопка настроек отображается и кликабельна', async ({ kpiPage }) => {
    await allure.allureId('803');
    await kpiPage.expectSettingsActionVisible();
    const errors: string[] = [];
    kpiPage.page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    await kpiPage.openSettings();
    expect(errors.length).toBe(0);
  });

  test('Основной контент рендерится, error-content скрыт', async ({ kpiPage }) => {
    await allure.allureId('804');
    await kpiPage.expectMainContentVisible();
  });

  test('Таблица сотрудников отображается и можно открыть карточку сотрудника', async ({ kpiPage }) => {
    await allure.allureId('810');
    const table = kpiPage.employeesTable;

    await test.step('Таблица отображается', async () => {
      await table.expectPopulated();
    });
    await test.step('Кнопка Open открывает страницу сотрудника', async () => {
      const oldUrl = kpiPage.page.url();
      await table.openFirstEmployee();
      await kpiPage.expectEmployeeDetailsUrl();
      expect(kpiPage.page.url()).not.toBe(oldUrl);
    });
  });
});
