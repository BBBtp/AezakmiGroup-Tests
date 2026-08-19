import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { pushBotsLocators } from '@locators/push';

function monthLabel(monthOffset: number): string {
  const value = new Date();
  value.setDate(1);
  value.setMonth(value.getMonth() + monthOffset);
  const [month, year] = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })
    .format(value)
    .split(' ');
  return `${month}, ${year}`;
}

export class PushBotsComponent extends UiObject {
  readonly root: Locator;
  readonly archiveButton: Locator;
  readonly createButton: Locator;
  readonly filtersButton: Locator;
  readonly search: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
    const within = this.locate.within(this.root);
    this.archiveButton = within.role('button', { name: pushBotsLocators.archive, exact: true });
    // The current UI renders desktop and responsive copies of the action in the same main tree.
    this.createButton = within.role('button', { name: pushBotsLocators.create, exact: true }).first();
    this.filtersButton = within.role('button', { name: pushBotsLocators.filters, exact: true });
    this.search = within.css(`input[placeholder="${pushBotsLocators.searchPlaceholder}"]`);
  }

  async expectLoaded(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible('Push bots: main', this.root);
    await this.expectations.visible('Push bots: title', within.text(pushBotsLocators.title, { exact: true }));
    await this.expectations.visible(
      'Push bots: description',
      within.text(pushBotsLocators.description, { exact: true }),
    );
    await this.expectations.visible('Push bots: Archive', this.archiveButton);
    await this.expectations.visible('Push bots: Create push', this.createButton);
    await this.expectations.visible('Push bots: Filters', this.filtersButton);
    await this.expectations.visible('Push bots: Search', this.search);
    await this.expectations.notContainsText(
      'Push bots: no technical values',
      this.root,
      pushBotsLocators.technicalValue,
    );
  }

  async expectPeriodControls(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible(
      'Push bots: All period',
      within.role('tab', { name: pushBotsLocators.all, exact: true }),
    );
    for (const offset of [0, -1, -2]) {
      const label = monthLabel(offset);
      await this.expectations.visible(`Push bots: ${label}`, within.role('tab', { name: label }));
    }
  }

  async selectPeriod(offset: 0 | -1 | -2): Promise<void> {
    const label = monthLabel(offset);
    await this.actions.click(
      `Push bots: select ${label}`,
      this.locate.within(this.root).role('tab', { name: label }),
    );
    await this.expectations.attribute(
      `Push bots: active ${label}`,
      this.locate.within(this.root).role('tab', { name: label }),
      'data-state',
      'active',
    );
  }

  async selectAllPeriod(): Promise<void> {
    const all = this.locate.within(this.root).role('tab', { name: pushBotsLocators.all, exact: true });
    await this.actions.click('Push bots: select All', all);
    await this.expectations.attribute('Push bots: All active', all, 'data-state', 'active');
  }

  async openFilters(): Promise<void> {
    await this.actions.click('Push bots: open Filters', this.filtersButton);
    await this.expectations.visible(
      'Push bots: filter builder',
      this.locate.within(this.root).css(pushBotsLocators.filterTrigger),
    );
  }

  async expectBusinessRows(): Promise<void> {
    await this.expectations.nonEmpty(
      'Push bots: campaign details',
      this.locate.within(this.root).text(pushBotsLocators.details, { exact: true }),
    );
  }

  async openFirstDetails(): Promise<void> {
    await this.actions.click(
      'Push bots: open first campaign details',
      this.locate.within(this.root).text(pushBotsLocators.details, { exact: true }).first(),
    );
    await this.expectations.url('Push bots: campaign detail URL', pushBotsLocators.detailUrl);
  }

  async expectDetailLoaded(): Promise<void> {
    await this.expectations.visible('Push bots detail: main', this.root);
    await this.expectations.visible(
      'Push bots detail: Revoke push',
      this.locate.within(this.root).role('button', { name: 'Revoke push', exact: true }),
    );
  }

  async openStopConfirmation(): Promise<void> {
    await this.actions.click(
      'Push bots detail: open Revoke push confirmation',
      this.locate.within(this.root).role('button', { name: 'Revoke push', exact: true }),
    );
    await this.expectations.visible('Push bots detail: Stop push dialog', this.locate.role('dialog'));
  }

  async cancelStop(): Promise<void> {
    const dialog = this.locate.role('dialog');
    await this.actions.click(
      'Push bots detail: cancel Stop push',
      this.locate.within(dialog).role('button', { name: /Cancel|No/i }),
    );
    await this.expectations.hidden('Push bots detail: Stop push dialog closed', dialog);
  }

  async openCreate(): Promise<void> {
    await this.actions.click('Push bots: open Create push', this.createButton);
    await this.expectations.url('Push bots: create URL', pushBotsLocators.createUrl);
  }

  async expectCreateEntryState(): Promise<void> {
    await this.expectations.visible('Push bots create: main', this.root);
    await this.expectations.notContainsText(
      'Push bots create: no technical values',
      this.root,
      pushBotsLocators.technicalValue,
    );
  }

  async expectLoading(): Promise<void> {
    // A campaign card renders several skeleton fragments; one visible fragment proves pending state.
    await this.expectations.visible(
      'Push bots: loading state',
      this.locate.within(this.root).css(pushBotsLocators.loading).first(),
    );
  }

  async expectEmpty(): Promise<void> {
    await this.expectations.hidden(
      'Push bots: no campaign details',
      this.locate.within(this.root).text(pushBotsLocators.details, { exact: true }),
    );
    await this.expectations.notContainsText(
      'Push bots empty: no technical values',
      this.root,
      pushBotsLocators.technicalValue,
    );
  }

  async expectError(): Promise<void> {
    await this.expectations.visible(
      'Push bots: error message',
      this.locate.within(this.root).text(pushBotsLocators.errorMessage),
    );
    await this.expectations.hidden(
      'Push bots: stale campaigns hidden',
      this.locate.within(this.root).text(pushBotsLocators.details, { exact: true }),
    );
  }
}
