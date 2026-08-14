import { allure } from 'allure-playwright';

import { test } from '@fixtures';

const notImplemented =
  'Export XLSX ещё не реализован во frontend; сценарий активируется после появления действия.';

test.describe('Niches → Export XLSX', () => {
  test('показывает действие Export XLSX в меню', async () => {
    await allure.allureId('980');
    test.skip(true, notImplemented);
  });

  test('скачивает непустой XLSX', async () => {
    await allure.allureId('968');
    test.skip(true, notImplemented);
  });

  test('формирует корректное имя и MIME-тип', async () => {
    await allure.allureId('969');
    test.skip(true, notImplemented);
  });

  test('экспортирует GEO, ключи и показатели', async () => {
    await allure.allureId('970');
    test.skip(true, notImplemented);
  });

  test('показывает управляемую ошибку экспорта', async () => {
    await allure.allureId('971');
    test.skip(true, notImplemented);
  });
});
