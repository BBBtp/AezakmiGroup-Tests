import { allure } from 'allure-playwright';

import { test } from '@fixtures';

test.describe('Staff / Employees / Create employee', () => {
  test('[TC-990] список City содержит расширенный набор городов', async ({ employeeCreatePage }) => {
    await allure.allureId('990');

    await employeeCreatePage.expectExpandedCityList();
  });
});
