import { type Locator, type Page } from '@playwright/test';
import { kpiManagerText, kpiTestIds } from '@locators/kpi';
import { BasePage } from '../base-page';
import { KpiScoreHistoryComponent } from '../../components/kpi/kpi-score-history-component';

export class KpiManagerPage extends BasePage {
  readonly settingsLink: Locator;
  readonly settingsRows: Locator;
  readonly errorContent: Locator;
  readonly vacationTitle: Locator;
  readonly scoreHistory: KpiScoreHistoryComponent;

  constructor(
    page: Page,
    readonly employeeId: string,
  ) {
    super(page);
    this.settingsLink = this.locate.role('link', {
      name: kpiManagerText.settingsLink,
      exact: true,
    });
    this.settingsRows = this.locate.role('row');
    this.errorContent = this.locate.testId(kpiTestIds.errorContent);
    this.vacationTitle = this.locate.text(kpiManagerText.vacationTitle, { exact: true });
    this.scoreHistory = new KpiScoreHistoryComponent(page);
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
    await this.expectations.visible(
      'KPI manager starting score',
      this.locate.text(kpiManagerText.startingScore, { exact: true }).first(),
    );
    await this.expectations.visible('KPI manager vacation title', this.vacationTitle);
    await this.expectations.visible(
      'KPI manager vacation description',
      this.locate.text(kpiManagerText.vacationDescription, { exact: true }),
    );
    for (const header of kpiManagerText.settingsHeaders) {
      await this.expectations.visible(
        `KPI manager settings header ${header}`,
        this.locate.text(header, { exact: true }),
      );
    }
    await this.expectations.countAtLeast('KPI manager settings rows', this.settingsRows, 2);
  }

  async readStartingScore(): Promise<number | null> {
    const hasDataRows = await this.settingsRows
      .nth(1)
      .waitFor({ state: 'attached', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!hasDataRows) return null;
    await this.expectations.visible(
      'KPI manager starting score',
      this.locate.text(kpiManagerText.startingScore, { exact: true }).first(),
    );
    const row = this.settingsRows.nth(1);
    return Number((await this.locate.within(row).role('cell').nth(1).innerText()).replace(',', '.'));
  }

  async expectVacationError(): Promise<void> {
    await this.expectations.visible('KPI manager error state', this.errorContent);
    await this.expectations.hidden('KPI manager vacation title', this.vacationTitle);
  }
}
