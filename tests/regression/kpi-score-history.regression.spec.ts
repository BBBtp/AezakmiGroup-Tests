import { allure } from 'allure-playwright';

import { scenarioCheck } from '@framework/assertions';
import { test } from '@fixtures';
import {
  assessKpiDataset,
  hasKpiData,
  kpiDataUnavailableMessage,
  openKpiAndGetStatistics,
} from '@support/kpi';

async function openManagerScoreHistory(
  kpiPage: Parameters<typeof openKpiAndGetStatistics>[0],
  network: Parameters<typeof openKpiAndGetStatistics>[1],
) {
  const statistics = await openKpiAndGetStatistics(kpiPage, network);
  const dataset = assessKpiDataset(statistics);
  test.skip(!hasKpiData(dataset, 'manager'), kpiDataUnavailableMessage(dataset, 'manager'));
  const manager = await scenarioCheck.requireDefined(
    'Для проверки доступен KPI manager',
    statistics.full_stats.find((item) => item.employee_id),
  );
  const managerPage = kpiPage.manager(manager.employee_id);
  await managerPage.navigate();
  await managerPage.scoreHistory.expand();
  return managerPage.scoreHistory;
}

test.describe('KPI · History of score changes', () => {
  test('[TC-1118] переключение типа баллов не изменяет состояние истории', async ({ kpiPage, network }) => {
    await allure.allureId('1118');
    await allure.description(`
**Цель:** проверить исправление FRONT-111.

**Контекст:** модальное окно Adding points в карточке KPI сотрудника.

**Предусловия:** администратор авторизован; доступен ASO manager; история изменения баллов раскрыта.

**Сценарий:** открыть Adding points и переключить Added → Subtracted → Added.

**Ожидаемый результат:** модалка остаётся открытой, а History of score changes — раскрытой.
`);
    const history = await openManagerScoreHistory(kpiPage, network);

    await test.step('ДЕЙСТВИЕ · Открыть модальное окно добавления баллов', () => history.openAddPoints());
    await test.step('ДЕЙСТВИЕ · Переключить тип баллов на вычитание и обратно', async () => {
      await history.selectSubtracted();
      await history.selectAdded();
    });
    await test.step('ПРОВЕРКА · Модалка открыта, история остаётся раскрытой', async () => {
      await history.expectDialogOpen();
      await history.expectExpanded();
    });
  });

  test('[TC-1117] поле количества принимает дробные баллы', async ({ kpiPage, network }) => {
    await allure.allureId('1117');
    await allure.description(`
**Цель:** проверить поддержку дробных баллов по FRONT-157.

**Контекст:** поле Number of points в модальном окне Adding points.

**Предусловия:** администратор авторизован; доступен ASO manager; история изменения баллов раскрыта.

**Сценарий:** выбрать Other и Added, затем ввести 0.5.

**Ожидаемый результат:** значение принимается без ошибки нулевого значения, кнопка Add доступна.
`);
    const history = await openManagerScoreHistory(kpiPage, network);

    await test.step('ДЕЙСТВИЕ · Открыть модальное окно добавления баллов', () => history.openAddPoints());
    await test.step('ДЕЙСТВИЕ · Выбрать действие Other и ввести дробные баллы', async () => {
      await history.selectOtherAction();
      await history.selectAdded();
      await history.fillPoints('0.5');
      await history.fillComment('Проверка дробного значения баллов');
    });
    await test.step('ПРОВЕРКА · Дробное значение принято без ошибки валидации', () =>
      history.expectValidPoints('0.5'));
  });
});
