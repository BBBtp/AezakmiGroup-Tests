import { expect } from '@playwright/test';
import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Settings / Parameters', () => {
  test('раздел открывается из бокового меню и показывает группы параметров', async ({
    administrationPage,
    dashboardPage,
  }) => {
    await allure.allureId('652');
    await dashboardPage.navigate();
    await administrationPage.openParametersFromSidebar();
  });

  test('список значений показывает бизнес-данные и действия', async ({ administrationPage }) => {
    await allure.allureId('653');
    await administrationPage.openParameters();
    await administrationPage.content.expectParameters();
  });

  test('редактирование можно отменить без мутации', async ({ administrationPage, network }) => {
    await allure.allureId('654');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/parameters'),
    );
    await administrationPage.openParameters();
    await administrationPage.content.openFirstEdit();
    await administrationPage.content.cancelDialog();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('удаление требует подтверждения и допускает отмену', async ({ administrationPage, network }) => {
    await allure.allureId('655');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/parameters'),
    );
    await administrationPage.openParameters();
    await administrationPage.content.openFirstDelete();
    await administrationPage.content.cancelDialog();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });

  test('Add value не сохраняет пустое значение', async ({ administrationPage, network }) => {
    await allure.allureId('656');
    const mutations = network.captureRequests(
      (request) => request.method() !== 'GET' && request.url().includes('/parameters'),
    );
    await administrationPage.openParameters();
    await administrationPage.content.openAddValue();
    await administrationPage.content.cancelDialog();
    expect(mutations.count).toBe(0);
    mutations.stop();
  });
});
