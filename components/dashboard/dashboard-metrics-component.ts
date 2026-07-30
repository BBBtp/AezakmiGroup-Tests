import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { dashboardTestIds } from '@locators/navigation';
import { CardComponent } from '../common/card-component';

export class DashboardMetricsComponent extends UiObject {
  readonly root: Locator;
  readonly chart: Locator;
  readonly defaultPeriod: Locator;
  readonly totalMrr: CardComponent;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(dashboardTestIds.page);
    this.chart = this.locate.testId(dashboardTestIds.chart);
    this.defaultPeriod = this.locate.testId(dashboardTestIds.defaultPeriod);
    this.totalMrr = new CardComponent(page, dashboardTestIds.totalMrrCard);
  }

  async expectHealthy(): Promise<void> {
    await this.expectations.visible('MRR chart', this.chart);
    await this.expectations.attribute('default Dashboard period', this.defaultPeriod, 'data-state', 'active');
    await this.expectCardValues(this.totalMrr.root, dashboardTestIds.totalMrrCard);

    for (const cardTestId of dashboardTestIds.changeCards) {
      await this.expectCardValues(this.locate.testId(cardTestId), cardTestId);
    }

    await this.expectations.notContainsText(
      'Dashboard business values',
      this.root,
      /\b(?:NaN|undefined|null)\b/i,
    );
  }

  private async expectCardValues(card: Locator, cardTestId: string): Promise<void> {
    await this.expectations.visible(`${cardTestId} card`, card);
    const cardLocators = this.locate.within(card);
    await this.expectations.nonEmptyText(`${cardTestId} title`, cardLocators.testId(`${cardTestId}__title`));

    const businessValues = cardLocators.css(
      `[data-testid="${cardTestId}__currency"], ` +
        `[data-testid="${cardTestId}__prev-value"], ` +
        `[data-testid="${cardTestId}__current-value"]`,
    );
    await this.expectations.nonEmpty(`${cardTestId} values`, businessValues);
    await this.expectations.nonEmptyText(`${cardTestId} values`, businessValues.first());
  }
}
