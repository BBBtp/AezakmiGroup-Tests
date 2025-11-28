import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base-page';
import { KpiSettingsScoreComponent } from '../../components/kpi/settings/kpi-settings-score-component';
import { KpiSettingsTableComponent } from '../../components/kpi/settings/kpi-settings-table-component';
import { KpiSettingsAddValueModal } from '../../components/kpi/settings/modals/kpi-settings-add-value-modal';
import { KpiSettingsActionRowComponent } from '../../components/kpi/settings/kpi-settings-action-row-component';
import { KpiSettingsDeleteValueModal } from '../../components/kpi/settings/modals/kpi-settings-delete-value-modal';

export class KpiSettingsPage extends BasePage {
    readonly root: Locator;
    readonly loadingState: Locator;
    readonly errorContent: Locator;
    readonly breadcrumbs: Locator;
    readonly scoreTable: KpiSettingsScoreComponent;
    readonly abTestsTable: KpiSettingsTableComponent;
    readonly totalMrrTable: KpiSettingsTableComponent;
    readonly abTestsAddModal: KpiSettingsAddValueModal;
    readonly totalMrrAddModal: KpiSettingsAddValueModal;

    constructor(page: Page) {
        super(page);
        this.root = page.locator('[data-testid="kpi-settings"]');
        this.loadingState = page.locator('[data-testid="kpi-settings-loading"]');
        this.errorContent = page.locator('[data-testid="error-content"]');
        this.breadcrumbs = page.locator('[data-testid="bread-crumbs"]');
        this.scoreTable = new KpiSettingsScoreComponent(page);
        this.abTestsTable = new KpiSettingsTableComponent(page, 'ab-tests');
        this.totalMrrTable = new KpiSettingsTableComponent(page, 'total-mrr');
        this.abTestsAddModal = new KpiSettingsAddValueModal(page, 'ab-tests');
        this.totalMrrAddModal = new KpiSettingsAddValueModal(page, 'total-mrr');
    }

    createAbTestRow(actionType: string, value: string): KpiSettingsActionRowComponent {
        return this.abTestsTable.createActionRow(actionType, value);
    }

    createTotalMrrRow(actionType: string, value: string): KpiSettingsActionRowComponent {
        return this.totalMrrTable.createActionRow(actionType, value);
    }

    createDeleteModal(tableName: 'ab-tests' | 'total-mrr', actionType: string, value: string): KpiSettingsDeleteValueModal {
        return new KpiSettingsDeleteValueModal(this.page, tableName, actionType, value);
    }

    async navigate(): Promise<void> {
        await this.navigateTo('/kpi/settings');
        await this.waitForPageLoad();
    }

    async waitForPageLoad(): Promise<void> {
        await this.waitForLoad();
        await expect(this.root).toBeVisible();
        await expect(this.loadingState).toBeHidden({ timeout: 15000 });
    }
}



