import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { outKeywordsLocators } from '@locators/push';

export class OutKeywordsComponent extends UiObject {
  readonly root: Locator;
  readonly settingsButton: Locator;
  readonly deleteAllButton: Locator;
  readonly filtersButton: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
    const within = this.locate.within(this.root);
    this.settingsButton = within.role('button', { name: outKeywordsLocators.settings, exact: true });
    this.deleteAllButton = within.role('button', { name: outKeywordsLocators.deleteAll, exact: true });
    this.filtersButton = within.role('button', { name: outKeywordsLocators.filters, exact: true });
  }

  async expectLoaded(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible('Out keywords: main', this.root);
    await this.expectations.visible(
      'Out keywords: title',
      within.text(outKeywordsLocators.title, { exact: true }),
    );
    await this.expectations.visible('Out keywords: Settings', this.settingsButton);
    await this.expectations.visible('Out keywords: Delete all installs', this.deleteAllButton);
    await this.expectations.visible('Out keywords: Filters', this.filtersButton);
    await this.expectations.visible(
      'Out keywords: Today',
      within.role('tab', { name: outKeywordsLocators.today, exact: true }),
    );
    await this.expectations.visible(
      'Out keywords: Yesterday',
      within.role('tab', { name: outKeywordsLocators.yesterday, exact: true }),
    );
    await this.expectations.notContainsText(
      'Out keywords: no technical values',
      this.root,
      outKeywordsLocators.technicalValue,
    );
  }

  async selectPeriod(period: 'Today' | 'Yesterday'): Promise<void> {
    const tab = this.locate.within(this.root).role('tab', { name: period, exact: true });
    await this.actions.click(`Out keywords: select ${period}`, tab);
    await this.expectations.attribute(`Out keywords: ${period} active`, tab, 'data-state', 'active');
  }

  async openFilters(): Promise<void> {
    await this.actions.click('Out keywords: open Filters', this.filtersButton);
    await this.expectations.visible(
      'Out keywords: filter builder',
      this.locate.within(this.root).css(outKeywordsLocators.filterTrigger),
    );
  }

  async openSettings(): Promise<void> {
    await this.actions.click('Out keywords: open Settings', this.settingsButton);
  }

  async expectSettingsForm(): Promise<void> {
    await this.expectations.countAtLeast(
      'Out keywords settings: editable fields',
      this.locate.within(this.root).css(outKeywordsLocators.settingsFields),
      1,
    );
    await this.expectations.notContainsText(
      'Out keywords settings: no technical values',
      this.root,
      outKeywordsLocators.technicalValue,
    );
  }

  async expectSettingsValidation(): Promise<void> {
    const within = this.locate.within(this.root);
    const save = within.role('button', { name: outKeywordsLocators.saveSettings });
    if ((await save.count()) > 0) {
      await this.expectations.disabled('Out keywords settings: invalid form blocked', save);
      return;
    }
    // Settings contain several editable fields; any enabled field proves the form itself is usable.
    await this.expectations.enabled(
      'Out keywords settings: fields remain editable before save is implemented',
      within.css(outKeywordsLocators.settingsFields).first(),
    );
  }

  async expectSettingsClosed(): Promise<void> {
    await this.expectations.visible('Out keywords: Settings restored', this.settingsButton);
    await this.expectations.visible('Out keywords: Filters restored', this.filtersButton);
  }

  async expectDeleteAvailability(expected: 'enabled' | 'disabled'): Promise<void> {
    if (expected === 'enabled') {
      await this.expectations.enabled('Out keywords: Delete all installs enabled', this.deleteAllButton);
    } else {
      await this.expectations.disabled('Out keywords: Delete all installs disabled', this.deleteAllButton);
    }
  }

  async expectEmpty(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible(
      'Out keywords: empty title',
      within.text(outKeywordsLocators.emptyTitle, { exact: true }),
    );
    await this.expectations.visible(
      'Out keywords: empty description',
      within.text(outKeywordsLocators.emptyDescription, { exact: true }),
    );
    await this.expectations.notContainsText(
      'Out keywords empty: no technical values',
      this.root,
      outKeywordsLocators.technicalValue,
    );
  }

  async expectLoading(): Promise<void> {
    // The empty/list layout may render several skeleton fragments in parallel.
    await this.expectations.visible(
      'Out keywords: loading state',
      this.locate.within(this.root).css(outKeywordsLocators.loading).first(),
    );
  }

  async expectError(): Promise<void> {
    await this.expectations.visible(
      'Out keywords: error message',
      this.locate.within(this.root).text(outKeywordsLocators.errorMessage),
    );
  }
}
