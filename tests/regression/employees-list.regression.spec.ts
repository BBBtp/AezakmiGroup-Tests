import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Staff / Employees', () => {
  test('таблица сотрудников показывает строки и основные действия', async ({ administrationPage }) => {
    await allure.allureId('638');
    await administrationPage.openEmployees();
  });

  test('карточка выбранного сотрудника открывается из списка', async ({ administrationPage }) => {
    await allure.allureId('641');
    await administrationPage.openEmployees();
    await administrationPage.content.openFirstEmployee();
  });
});
