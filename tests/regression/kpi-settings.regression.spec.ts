import { expect } from '@playwright/test';
import { test } from '../../fixtures/test-fixtures';
import { KpiSettingsPage } from '../../pages/kpi/kpi-settings-page';
import { KpiSettingsAddValueModal } from '../../components/kpi/settings/modals/kpi-settings-add-value-modal';
import {
    createEditDeleteKpiSettingsAction,
    createKpiSettingsAction,
    deleteKpiSettingsActionIfPresent,
    failNextSettingsAction,
    pickAvailableAbTestPercent,
    pickAvailableTotalMrrReachedValue,
    waitForFailedSettingsAction,
} from '../helpers/kpi-settings-test-helpers';

test.describe('Страница KPI Settings', () => {
    test.beforeEach(async ({ kpiPage }) => {
        await kpiPage.navigate();
    });

    test.describe('add-modal для ab-tests',() => {
        let settingsPage: KpiSettingsPage
        let modal: KpiSettingsAddValueModal

        test.beforeEach(async ({kpiPage})=> {
            settingsPage = await kpiPage.openSettings();
            modal = await settingsPage.openAbTestsAddModal();
        })

        test('содержит все шаги и базовые контролы', async () => {
            await modal.assertAbTestsActionTypeStep();
            await modal.selectActionType('Internal test');
            await modal.goToValueStep();
            await modal.selectValueType('Completed with a success over N%');
            await modal.fillValue('10');
            await modal.goToPointsStep();
        });

        test('переключает шаги Next и Back', async () => {
            await modal.assertAbTestsActionTypeStep();
            await modal.selectActionType('External test');
            await modal.goToValueStep();
            await modal.selectValueType('Completed with a success over N%');
            await modal.fillValue('10');
            await modal.goToPointsStep();
            await modal.goBackToValueStep();
        });
    })

    test.describe("add-modal для total-mrr", () => {
        let settingsPage: KpiSettingsPage;
        let modal: KpiSettingsAddValueModal;

        test.beforeEach(async ({kpiPage}) => {
             settingsPage = await kpiPage.openSettings();
             modal = await settingsPage.openTotalMrrAddModal();
        })

        test('содержит все шаги и базовые контролы', async () => {
            await modal.assertTotalMrrActionTypeStep();
            await modal.selectActionType('Change of SUM MRR');
            await modal.goToValueStep();
            await modal.assertTotalMrrValueStep();
            await modal.selectValueType('Reached $N');
            await modal.fillValue('2500');
            await modal.goToPointsStep();
        });

        test('переключает шаги Next и Back', async () => {
            await modal.assertTotalMrrActionTypeStep();
            await modal.selectActionType('Change of SUM MRR');
            await modal.goToValueStep();
            await modal.assertTotalMrrValueStep();
            await modal.selectValueType('Reached $N');
            await modal.fillValue('2500');
            await modal.goToPointsStep();
            await modal.goBackToValueStep();
        });
    })


    test('Score-таблица отображается и edit-кнопки недоступны', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        await settingsPage.scoreTable.expectReadOnlyShellVisible();
    });

    test('A/B tests: создаёт, редактирует и удаляет тестовое значение', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        const value = await pickAvailableAbTestPercent(settingsPage);
        const row = settingsPage.createAbTestRow('Internal test', `Completed with ${value}% +`);

        await test.step('Создаём, редактируем и удаляем уникальное значение', async () => {
            await createEditDeleteKpiSettingsAction({
                settingsPage,
                row,
                openModal: () => settingsPage.openAbTestsAddModal(),
                fillModal: modal => modal.runAbTestsAddModalFlow(
                    'Internal test',
                    'Completed with a success over N%',
                    value
                ),
                createPoints: '11',
                editPoints: '12',
            });
        });
    });

    test('Total MRR: создаёт, редактирует и удаляет тестовое значение', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        const value = await pickAvailableTotalMrrReachedValue(settingsPage);
        const row = settingsPage.createTotalMrrRow('MRR milestones', `Reached $${value}`);

        await test.step('Создаём, редактируем и удаляем уникальное значение', async () => {
            await createEditDeleteKpiSettingsAction({
                settingsPage,
                row,
                openModal: () => settingsPage.openTotalMrrAddModal(),
                fillModal: modal => modal.runTotalMrrAddModalFlow('Change of SUM MRR', 'Reached $N', value),
                createPoints: '13',
                editPoints: '14',
            });
        });
    });

    test('A/B tests: отмена удаления не удаляет тестовое значение', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        const value = await pickAvailableAbTestPercent(settingsPage);
        const row = settingsPage.createAbTestRow('Internal test', `Completed with ${value}% +`);
        let created = false;

        try {
            await test.step('Создаём уникальное значение', async () => {
                await createKpiSettingsAction({
                    settingsPage,
                    row,
                    openModal: () => settingsPage.openAbTestsAddModal(),
                    fillModal: modal => modal.runAbTestsAddModalFlow(
                        'Internal test',
                        'Completed with a success over N%',
                        value
                    ),
                    createPoints: '15',
                });
                created = true;
            });

            await test.step('Отменяем удаление и проверяем, что строка осталась', async () => {
                await row.openDeleteModal();
                await row.cancelDelete();
                await row.expectEditable();
            });
        } finally {
            if (created) {
                await deleteKpiSettingsActionIfPresent(settingsPage, row);
            }
        }

        await row.expectDeleted();
    });

    test('A/B tests: ошибка сервера при создании показывает error и не создаёт строку', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        const value = await pickAvailableAbTestPercent(settingsPage);
        const row = settingsPage.createAbTestRow('Internal test', `Completed with ${value}% +`);

        const modal = await settingsPage.openAbTestsAddModal();
        await modal.runAbTestsAddModalFlow('Internal test', 'Completed with a success over N%', value);
        await modal.selectPointsType('plus');
        await modal.fillPoints('16');

        await failNextSettingsAction(settingsPage, 'POST');
        const failedCreate = waitForFailedSettingsAction(settingsPage, 'POST');

        await modal.submitCreate();
        await failedCreate;

        await expect(modal.modal).toBeVisible();
        await expect(modal.errorBlock).toBeVisible();
        await row.expectDeleted();
    });

    test('A/B tests: ошибка сервера при редактировании показывает error и сохраняет строку', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        const value = await pickAvailableAbTestPercent(settingsPage);
        const row = settingsPage.createAbTestRow('Internal test', `Completed with ${value}% +`);
        let created = false;

        try {
            await createKpiSettingsAction({
                settingsPage,
                row,
                openModal: () => settingsPage.openAbTestsAddModal(),
                fillModal: modal => modal.runAbTestsAddModalFlow(
                    'Internal test',
                    'Completed with a success over N%',
                    value
                ),
                createPoints: '17',
            });
            created = true;

            await row.openEditModal();
            await row.selectEditPointsType('minus');
            await row.fillEditPoints('18');

            await failNextSettingsAction(settingsPage, 'PATCH');
            const failedEdit = waitForFailedSettingsAction(settingsPage, 'PATCH');

            await row.saveEdit();
            await failedEdit;

            await row.expectEditModalVisible();
            await expect(row.errorBlock).toBeVisible();
            await row.expectEditable();
        } finally {
            if (created) {
                await deleteKpiSettingsActionIfPresent(settingsPage, row);
            }
        }

        await row.expectDeleted();
    });

    test('Total MRR: ошибка сервера при создании показывает error и не создаёт строку', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        const value = await pickAvailableTotalMrrReachedValue(settingsPage);
        const row = settingsPage.createTotalMrrRow('MRR milestones', `Reached $${value}`);

        const modal = await settingsPage.openTotalMrrAddModal();
        await modal.runTotalMrrAddModalFlow('Change of SUM MRR', 'Reached $N', value);
        await modal.selectPointsType('plus');
        await modal.fillPoints('19');

        await failNextSettingsAction(settingsPage, 'POST');
        const failedCreate = waitForFailedSettingsAction(settingsPage, 'POST');

        await modal.submitCreate();
        await failedCreate;

        await expect(modal.modal).toBeVisible();
        await expect(modal.errorBlock).toBeVisible();
        await row.expectDeleted();
    });

    test('Total MRR: ошибка сервера при редактировании показывает error и сохраняет строку', async ({ kpiPage }) => {
        const settingsPage = await kpiPage.openSettings();
        const value = await pickAvailableTotalMrrReachedValue(settingsPage);
        const row = settingsPage.createTotalMrrRow('MRR milestones', `Reached $${value}`);
        let created = false;

        try {
            await createKpiSettingsAction({
                settingsPage,
                row,
                openModal: () => settingsPage.openTotalMrrAddModal(),
                fillModal: modal => modal.runTotalMrrAddModalFlow('Change of SUM MRR', 'Reached $N', value),
                createPoints: '20',
            });
            created = true;

            await row.openEditModal();
            await row.selectEditPointsType('minus');
            await row.fillEditPoints('21');

            await failNextSettingsAction(settingsPage, 'PATCH');
            const failedEdit = waitForFailedSettingsAction(settingsPage, 'PATCH');

            await row.saveEdit();
            await failedEdit;

            await row.expectEditModalVisible();
            await expect(row.errorBlock).toBeVisible();
            await row.expectEditable();
        } finally {
            if (created) {
                await deleteKpiSettingsActionIfPresent(settingsPage, row);
            }
        }

        await row.expectDeleted();
    });
});
