import { test } from '@fixtures';
import { KpiSettingsAddValueModal } from '@modules/kpi';
import { allure } from 'allure-playwright';

test.describe('Страница KPI Settings', () => {
  // Сценарии изменяют общую конфигурацию CRM; сериализация предотвращает гонки данных.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ kpiSettingsLifecycle }) => {
    await kpiSettingsLifecycle.navigate();
  });

  test.describe('add-modal для ab-tests', () => {
    let modal: KpiSettingsAddValueModal;

    test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ kpiSettingsLifecycle }) => {
      modal = await kpiSettingsLifecycle.openAbTestsModal();
    });

    test('[TC-823] содержит все шаги и базовые контролы', async ({ kpiSettingsLifecycle }) => {
      await allure.allureId('823');
      const value = await kpiSettingsLifecycle.nextAbTestPercent('Internal test');

      await modal.assertAbTestsActionTypeStep();
      await modal.selectActionType('Internal test');
      await modal.goToValueStep();
      await modal.selectValueType('Completed with a success over N%');
      await modal.fillValue(value);
      await modal.goToPointsStep();
    });

    test('[TC-824] переключает шаги Next и Back', async ({ kpiSettingsLifecycle }) => {
      await allure.allureId('824');
      const value = await kpiSettingsLifecycle.nextAbTestPercent('External test');

      await modal.assertAbTestsActionTypeStep();
      await modal.selectActionType('External test');
      await modal.goToValueStep();
      await modal.selectValueType('Completed with a success over N%');
      await modal.fillValue(value);
      await modal.goToPointsStep();
      await modal.goBackToValueStep();
    });
  });

  test.describe('add-modal для total-mrr', () => {
    let modal: KpiSettingsAddValueModal;

    test.beforeEach('ПОДГОТОВКА · Подготовить предусловия сценария', async ({ kpiSettingsLifecycle }) => {
      modal = await kpiSettingsLifecycle.openTotalMrrModal();
    });

    test('[TC-825] содержит все шаги и базовые контролы', async ({ kpiSettingsLifecycle }) => {
      await allure.allureId('825');
      const value = await kpiSettingsLifecycle.nextTotalMrrReachedValue();

      await modal.assertTotalMrrActionTypeStep();
      await modal.selectActionType('Change of SUM MRR');
      await modal.goToValueStep();
      await modal.assertTotalMrrValueStep();
      await modal.selectValueType('Reached $N');
      await modal.fillValue(value);
      await modal.goToPointsStep();
    });

    test('[TC-826] переключает шаги Next и Back', async ({ kpiSettingsLifecycle }) => {
      await allure.allureId('826');
      const value = await kpiSettingsLifecycle.nextTotalMrrReachedValue();

      await modal.assertTotalMrrActionTypeStep();
      await modal.selectActionType('Change of SUM MRR');
      await modal.goToValueStep();
      await modal.assertTotalMrrValueStep();
      await modal.selectValueType('Reached $N');
      await modal.fillValue(value);
      await modal.goToPointsStep();
      await modal.goBackToValueStep();
    });
  });

  test('[TC-827] Score-таблица отображается и edit-кнопки недоступны', async ({ kpiSettingsLifecycle }) => {
    await allure.allureId('827');
    await kpiSettingsLifecycle.expectScoreReadOnly();
  });

  test('[TC-828] A/B tests: создаёт, редактирует и удаляет тестовое значение', async ({
    kpiSettingsLifecycle,
  }) => {
    await allure.allureId('828');
    await test.step('ДЕЙСТВИЕ · Создать, изменить и удалить уникальное значение', async () => {
      const action = await kpiSettingsLifecycle.createAbTest({ points: '11' });
      await action.edit('12');
      await action.remove();
    });
  });

  test('[TC-829] Total MRR: создаёт, редактирует и удаляет тестовое значение', async ({
    kpiSettingsLifecycle,
  }) => {
    await allure.allureId('829');
    await test.step('ДЕЙСТВИЕ · Создать, изменить и удалить уникальное значение', async () => {
      const action = await kpiSettingsLifecycle.createTotalMrr({ points: '13' });
      await action.edit('14');
      await action.remove();
    });
  });

  test('[TC-830] A/B tests: отмена удаления не удаляет тестовое значение', async ({
    kpiSettingsLifecycle,
  }) => {
    await allure.allureId('830');
    const action = await kpiSettingsLifecycle.createAbTest({ points: '15' });
    await action.cancelDeletion();
    await action.remove();
  });

  test('[TC-831] A/B tests: ошибка сервера при создании показывает error и не создаёт строку', async ({
    kpiSettingsLifecycle,
  }) => {
    await allure.allureId('831');
    await kpiSettingsLifecycle.expectAbTestCreateFailure('16');
  });

  test('[TC-832] A/B tests: ошибка сервера при редактировании показывает error и сохраняет строку', async ({
    kpiSettingsLifecycle,
  }) => {
    await allure.allureId('832');
    const action = await kpiSettingsLifecycle.createAbTest({ points: '17' });
    await action.expectEditFailure('18');
    await action.remove();
  });

  test('[TC-833] Total MRR: ошибка сервера при создании показывает error и не создаёт строку', async ({
    kpiSettingsLifecycle,
  }) => {
    await allure.allureId('833');
    await kpiSettingsLifecycle.expectTotalMrrCreateFailure('19');
  });

  test('[TC-834] Total MRR: ошибка сервера при редактировании показывает error и сохраняет строку', async ({
    kpiSettingsLifecycle,
  }) => {
    await allure.allureId('834');
    const action = await kpiSettingsLifecycle.createTotalMrr({ points: '20' });
    await action.expectEditFailure('21');
    await action.remove();
  });
});
