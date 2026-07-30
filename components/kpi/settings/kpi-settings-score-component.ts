import { Locator, Page } from '@playwright/test';
import { kpiSettingsTestIds } from '@locators/kpi-settings';
import { KpiSettingsTableComponent } from './kpi-settings-table-component';

export class KpiSettingsScoreComponent extends KpiSettingsTableComponent {
  readonly sufficientScoreEditButton: Locator;
  readonly minimalScoreEditButton: Locator;
  constructor(page: Page) {
    super(page, 'score', { hasValueColumn: false, hasFooterBar: false });
    this.sufficientScoreEditButton = this.locate.testId(kpiSettingsTestIds.score.sufficientEditButton);
    this.minimalScoreEditButton = this.locate.testId(kpiSettingsTestIds.score.minimalEditButton);
  }

  async expectReadOnlyShellVisible(): Promise<void> {
    await this.expectations.visible('score: root', this.root);
    await this.expectations.visible('score: table', this.table);
    await this.expectations.visible('score: header row', this.headerRow);
    await this.expectations.visible('score: action type header', this.actionTypeHeader);
    await this.expectations.visible('score: points header', this.pointsHeader);
    await this.expectations.visible('score: points label', this.pointsLabel);
    await this.expectations.visible('score: body', this.tableBody);
    await this.expectations.visible('score: sufficient edit', this.sufficientScoreEditButton);
    await this.expectations.visible('score: minimal edit', this.minimalScoreEditButton);
    await this.expectations.disabled('score: sufficient edit', this.sufficientScoreEditButton);
    await this.expectations.disabled('score: minimal edit', this.minimalScoreEditButton);
  }
}
