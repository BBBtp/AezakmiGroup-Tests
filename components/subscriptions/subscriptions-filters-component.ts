import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { subscriptionsTestIds } from '@locators/subscriptions';

export class SubscriptionsFiltersComponent extends UiObject {
  readonly filtersButton: Locator;
  readonly filtersRoot: Locator;
  readonly addFilterTrigger: Locator;
  readonly addFilterContent: Locator;
  readonly appFilterOption: Locator;
  readonly addFilterApplyButton: Locator;
  readonly appFilterTrigger: Locator;
  readonly appFilterContent: Locator;
  readonly appAllOption: Locator;
  readonly individualAppOptions: Locator;
  readonly appFilterApplyButton: Locator;
  readonly activeAppFilter: Locator;
  readonly resetAppFilterButton: Locator;

  constructor(page: Page, root: Locator) {
    super(page);
    const section = this.locate.within(root);
    this.filtersButton = section.testId(subscriptionsTestIds.filtersButton);
    this.filtersRoot = section.testId(subscriptionsTestIds.filters.root);
    const filters = this.locate.within(this.filtersRoot);
    this.addFilterTrigger = filters.testId(subscriptionsTestIds.filters.addFilter.trigger);
    this.addFilterContent = this.locate.testId(subscriptionsTestIds.filters.addFilter.content);
    this.appFilterOption = this.locate.testId(subscriptionsTestIds.filters.addFilter.appOption);
    this.addFilterApplyButton = this.locate.testId(subscriptionsTestIds.filters.addFilter.applyButton);
    this.appFilterTrigger = filters.testId(subscriptionsTestIds.filters.app.trigger);
    this.appFilterContent = this.locate.testId(subscriptionsTestIds.filters.app.content);
    this.appAllOption = this.locate.testId(subscriptionsTestIds.filters.app.allOption);
    this.individualAppOptions = this.locate.testId(subscriptionsTestIds.filters.app.individualOptions);
    this.appFilterApplyButton = this.locate.testId(subscriptionsTestIds.filters.app.applyButton);
    this.activeAppFilter = filters.testId(subscriptionsTestIds.filters.app.activeFilter);
    this.resetAppFilterButton = filters.testId(subscriptionsTestIds.filters.app.resetButton);
  }

  async selectApp(label: string): Promise<void> {
    await this.openAppFilter();
    await this.actions.click(
      `Subscriptions: select ${label}`,
      this.locate.within(this.appFilterContent).text(label, { exact: true }),
    );
    await this.actions.click('Subscriptions: apply App selection', this.appFilterApplyButton);
    await this.expectations.containsText('Subscriptions: selected App label', this.activeAppFilter, label);
  }

  async resetAppFilter(): Promise<void> {
    await this.actions.click('Subscriptions: reset App filter', this.resetAppFilterButton);
    await this.expectations.hidden('Subscriptions: active App filter removed', this.activeAppFilter);
  }

  async selectAllAppsAndExpectAllLabel(): Promise<void> {
    await this.openAppFilter();
    await this.selectAllApps();
    await this.expectations.text(
      'Subscriptions: Select All label',
      this.activeAppFilter,
      subscriptionsTestIds.filters.app.expectedAllLabel,
    );
  }

  async selectAllThenDeselectOneAppAndExpectPartialLabel(): Promise<void> {
    await this.openAppFilter();
    await this.selectAllApps();
    await this.actions.click('Subscriptions: reopen App filter', this.appFilterTrigger);
    await this.expectations.visible('Subscriptions: App filter content', this.appFilterContent);

    const option = await this.pickIndividualAppOption();
    await this.actions.click(`Subscriptions: deselect ${option.label}`, this.locate.testId(option.testId));
    await this.actions.click('Subscriptions: apply partial App selection', this.appFilterApplyButton);

    await this.expectations.containsText(
      'Subscriptions: partial App label',
      this.activeAppFilter,
      subscriptionsTestIds.filters.app.partialLabel,
    );
    await this.expectations.notContainsText(
      'Subscriptions: partial App label does not use All',
      this.activeAppFilter,
      subscriptionsTestIds.filters.app.allLabel,
    );
  }

  private async openAppFilter(): Promise<void> {
    await this.actions.click('Subscriptions: show filters', this.filtersButton);
    await this.expectations.visible('Subscriptions: applied filters', this.filtersRoot);
    await this.actions.click('Subscriptions: open Add Filter', this.addFilterTrigger);
    await this.expectations.visible('Subscriptions: available filters', this.addFilterContent);
    await this.actions.click('Subscriptions: select App filter', this.appFilterOption);
    await this.actions.click('Subscriptions: apply App filter', this.addFilterApplyButton);
    await this.expectations.visible('Subscriptions: App filter trigger', this.appFilterTrigger);
    await this.expectations.visible('Subscriptions: App filter content', this.appFilterContent);
  }

  private async selectAllApps(): Promise<void> {
    await this.actions.click('Subscriptions: Select All apps', this.appAllOption);
    await this.actions.click('Subscriptions: apply Select All apps', this.appFilterApplyButton);
    await this.expectations.visible('Subscriptions: active App filter', this.activeAppFilter);
  }

  private async pickIndividualAppOption(): Promise<{ label: string; testId: string }> {
    const options = await this.individualAppOptions.evaluateAll((nodes) =>
      nodes
        .map((node) => ({
          label: node.textContent?.trim() ?? '',
          testId: node.getAttribute('data-testid') ?? '',
        }))
        .filter((option) => option.label && option.testId)
        .sort((left, right) => left.label.localeCompare(right.label)),
    );
    const option = options[0];
    if (!option) throw new Error('Subscriptions App filter has no individual options');
    return option;
  }
}
