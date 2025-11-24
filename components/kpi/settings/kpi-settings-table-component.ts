import { Page, Locator } from '@playwright/test';
import { KpiSettingsActionRowComponent } from './kpi-settings-action-row-component';

export type KpiSettingsTableOptions = {
    hasValueColumn?: boolean;
    hasFooterBar?: boolean;
};

export class KpiSettingsTableComponent {
    readonly page: Page;
    readonly tableName: string;

    readonly root: Locator;
    readonly table: Locator;
    readonly headerRow: Locator;
    readonly actionTypeHeader: Locator;
    readonly pointsHeader: Locator;
    readonly valueHeader?: Locator;
    readonly pointsLabel: Locator;
    readonly tableBody: Locator;
    readonly footerBar?: Locator;

    readonly addValueButton: Locator;
    readonly addModal: Locator;
    readonly addForm: Locator;
    readonly addModalStepActionType: Locator;
    readonly addModalStepValue: Locator;
    readonly addModalStepPoints: Locator;
    readonly addModalPrevButton: Locator;
    readonly addModalNextButton: Locator;
    readonly addModalLoading: Locator;
    readonly addModalError: Locator;

    private readonly options: Required<KpiSettingsTableOptions>;

    constructor(page: Page, tableName: string, options: KpiSettingsTableOptions = {}) {
        this.page = page;
        this.tableName = tableName;
        this.options = {
            hasValueColumn: options.hasValueColumn ?? true,
            hasFooterBar: options.hasFooterBar ?? true,
        };

        this.root = page.locator(`[data-testid="${tableName}"]`);
        this.table = page.locator(`[data-testid="${tableName}__table"]`);
        this.headerRow = page.locator(`[data-testid="${tableName}__table-header-row"]`);
        this.actionTypeHeader = page.locator(`[data-testid="${tableName}__action-type-header"]`);
        this.pointsHeader = page.locator(`[data-testid="${tableName}__points-header"]`);
        this.pointsLabel = page.locator(`[data-testid="${tableName}__points-label"]`);
        this.tableBody = page.locator(`[data-testid="${tableName}__table-body"]`);

        if (this.options.hasValueColumn) {
            this.valueHeader = page.locator(`[data-testid="${tableName}__value-header"]`);
        }

        if (this.options.hasFooterBar) {
            this.footerBar = page.locator(`[data-testid="${tableName}__table-bar"]`);
        }

        this.addValueButton = page.locator(`[data-testid="${tableName}__add-value"]`);
        this.addModal = page.locator(`[data-testid="${tableName}__add-modal"]`);
        this.addForm = page.locator(`[data-testid="${tableName}__add-form"]`);
        this.addModalStepActionType = page.locator(`[data-testid="${tableName}-Action type"]`);
        this.addModalStepValue = page.locator(`[data-testid="${tableName}-Value"]`);
        this.addModalStepPoints = page.locator(`[data-testid="${tableName}-Points"]`);
        this.addModalPrevButton = page.locator(`[data-testid="${tableName}__button-prev"]`);
        this.addModalNextButton = page.locator(`[data-testid="${tableName}__button-next"]`);
        this.addModalLoading = page.locator(`[data-testid="${tableName}__loading"]`);
        this.addModalError = page.locator(`[data-testid="${tableName}__error"]`);
    }

    createActionRow(actionType: string, value: string): KpiSettingsActionRowComponent {
        return new KpiSettingsActionRowComponent(this.page, this.tableName, actionType, value);
    }
}



