import { expect, type Locator, type Page } from '@playwright/test';
import { kpiManagerText, kpiTestIds } from '@locators/kpi';
import { BasePage } from '../base-page';

export class KpiManagerPage extends BasePage {
  readonly settingsLink: Locator;
  readonly settingsRows: Locator;
  readonly errorContent: Locator;
  readonly vacationTitle: Locator;

  constructor(
    page: Page,
    readonly employeeId: string,
  ) {
    super(page);
    this.settingsLink = this.locate.role('link', { name: 'Settings', exact: true });
    this.settingsRows = this.locate.role('row');
    this.errorContent = this.locate.testId(kpiTestIds.errorContent);
    this.vacationTitle = this.locate.text(kpiManagerText.vacationTitle, { exact: true });
  }

  async navigate(): Promise<void> {
    await this.actions.navigate(`KPI manager ${this.employeeId}`, `/kpi/${this.employeeId}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async navigateSettings(): Promise<void> {
    await this.actions.navigate(`KPI settings for ${this.employeeId}`, `/kpi/${this.employeeId}/settings`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async openSettings(): Promise<void> {
    await this.actions.click('KPI manager: open settings', this.settingsLink);
  }

  async expectSettingsContent(): Promise<void> {
    await expect(this.locate.text(kpiManagerText.startingScore, { exact: true }).first()).toBeVisible();
    await expect(this.vacationTitle).toBeVisible();
    await expect(this.locate.text(kpiManagerText.vacationDescription, { exact: true })).toBeVisible();
    for (const header of kpiManagerText.settingsHeaders) {
      await expect(this.locate.text(header, { exact: true })).toBeVisible();
    }
    expect(await this.settingsRows.count()).toBeGreaterThan(1);
  }

  async readStartingScore(): Promise<number | null> {
    const hasDataRows = await expect
      .poll(() => this.settingsRows.count(), { timeout: 5000, intervals: [250, 500, 1000] })
      .toBeGreaterThan(1)
      .then(() => true)
      .catch(() => false);
    if (!hasDataRows) return null;
    await expect(this.locate.text(kpiManagerText.startingScore, { exact: true }).first()).toBeVisible();
    const row = this.settingsRows.nth(1);
    return Number((await this.locate.within(row).role('cell').nth(1).innerText()).replace(',', '.'));
  }

  async expectVacationError(): Promise<void> {
    await expect(this.errorContent).toBeVisible();
    await expect(this.vacationTitle).toBeHidden();
  }
}
