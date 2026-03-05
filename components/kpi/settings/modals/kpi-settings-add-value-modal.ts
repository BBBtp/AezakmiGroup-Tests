import { Locator, Page } from '@playwright/test';
import { KpiSettingsAddValueForm } from '../forms/kpi-settings-add-value-form';
import { requireTestId } from '../../../../utils/test-id';

export class KpiSettingsAddValueModal {
    readonly page: Page;
    readonly tableName: string;

    readonly trigger: Locator;
    readonly modal: Locator;
    readonly progressStepActionType: Locator;
    readonly progressStepValue: Locator;
    readonly progressStepPoints: Locator;
    readonly backButton: Locator;
    readonly nextButton: Locator;
    readonly loadingIndicator: Locator;
    readonly errorBlock: Locator;
    readonly form: KpiSettingsAddValueForm;

    constructor(page: Page, tableName: string) {
        this.page = page;
        this.tableName = requireTestId(tableName, 'KpiSettingsAddValueModal');

        this.trigger = page.locator(`[data-testid="${this.tableName}__add-value"]`);
        this.modal = page.locator(`[data-testid="${this.tableName}__add-modal"]`);
        this.progressStepActionType = page.locator(`[data-testid="${this.tableName}-Action type"]`);
        this.progressStepValue = page.locator(`[data-testid="${this.tableName}-Value"]`);
        this.progressStepPoints = page.locator(`[data-testid="${this.tableName}-Points"]`);
        this.backButton = page.locator(`[data-testid="${this.tableName}__button-prev"]`);
        this.nextButton = page.locator(`[data-testid="${this.tableName}__button-next"]`);
        this.loadingIndicator = page.locator(`[data-testid="${this.tableName}__loading"]`);
        this.errorBlock = page.locator(`[data-testid="${this.tableName}__error"]`);

        this.form = new KpiSettingsAddValueForm(page, this.tableName);
    }
}


