import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { subscriptionsTestIds } from '@locators/subscriptions';

export class SubscriptionsMetricsComponent extends UiObject {
  readonly cardsList: Locator;
  readonly cards: Locator;
  readonly table: Locator;

  constructor(page: Page, root: Locator) {
    super(page);
    const section = this.locate.within(root);
    this.cardsList = section.testId(subscriptionsTestIds.cardsList);
    this.cards = section.testId(subscriptionsTestIds.cards);
    this.table = section.testId(subscriptionsTestIds.table);
  }

  async expectMetrics(values: readonly string[], appName: string, productId: string): Promise<void> {
    await this.expectations.visible('Subscriptions: metrics cards', this.cardsList);
    await this.expectations.count('Subscriptions: metrics card count', this.cards, 7);
    for (const value of values) {
      await this.expectations.containsText(`Subscriptions: metric ${value}`, this.cardsList, value);
    }
    await this.expectations.containsText('Subscriptions: app row', this.table, appName);
    await this.expectations.containsText('Subscriptions: product row', this.table, productId);
    await this.expectNoTechnicalValues();
  }

  async expectFilteredApp(appName: string, staleAppName: string): Promise<void> {
    await this.expectations.containsText('Subscriptions: filtered app row', this.table, appName);
    await this.expectations.notContainsText('Subscriptions: stale app row removed', this.table, staleAppName);
  }

  async expectNoTechnicalValues(): Promise<void> {
    await this.expectations.notContainsText(
      'Subscriptions: no technical placeholders',
      this.cardsList,
      /NaN|undefined|null|\[object Object\]/i,
    );
    await this.expectations.notContainsText(
      'Subscriptions: no technical table values',
      this.table,
      /NaN|undefined|null|\[object Object\]/i,
    );
  }
}
