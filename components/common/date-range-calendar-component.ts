import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { dateRangeCalendarLocators } from '@locators/master-sections';

export class DateRangeCalendarComponent extends UiObject {
  readonly startInput: Locator;
  readonly endInput: Locator;
  readonly resetButton: Locator;
  readonly applyButton: Locator;

  constructor(page: Page) {
    super(page);
    this.startInput = this.locate.css(dateRangeCalendarLocators.startInput);
    this.endInput = this.locate.css(dateRangeCalendarLocators.endInput);
    this.resetButton = this.locate.role('button', {
      name: dateRangeCalendarLocators.resetButton,
      exact: true,
    });
    this.applyButton = this.locate.role('button', {
      name: dateRangeCalendarLocators.applyButton,
      exact: true,
    });
  }

  async expectOpen(): Promise<void> {
    await this.expectations.visible('Date range: Start', this.startInput);
    await this.expectations.visible('Date range: End', this.endInput);
    await this.expectations.visible('Date range: Reset', this.resetButton);
    await this.expectations.visible('Date range: Apply', this.applyButton);
  }

  async fill(start: string, end: string): Promise<void> {
    await this.actions.fill('Date range: Start', this.startInput, start);
    await this.actions.press('Date range: commit Start', this.startInput, 'Tab');
    await this.actions.fill('Date range: End', this.endInput, end);
    await this.actions.press('Date range: commit End', this.endInput, 'Tab');
  }

  async apply(): Promise<void> {
    await this.expectations.enabled('Date range: Apply enabled', this.applyButton);
    await this.actions.click('Date range: Apply', this.applyButton);
  }

  async reset(): Promise<void> {
    await this.expectations.enabled('Date range: Reset enabled', this.resetButton);
    await this.actions.click('Date range: Reset', this.resetButton);
  }

  async expectApplyDisabled(): Promise<void> {
    await this.expectations.disabled('Date range: Apply disabled', this.applyButton);
  }

  async expectLatestAvailableDay(options: {
    latestAvailableLabel: string;
    todayUnavailableLabel: string;
    futureUnavailableLabel: string;
  }): Promise<void> {
    await this.expectations.enabled(
      'Календарь периода: вчерашний день доступен',
      this.locate.role('option', { name: options.latestAvailableLabel, exact: true }),
    );
    for (const [target, label] of [
      ['сегодняшний день недоступен', options.todayUnavailableLabel],
      ['будущий день недоступен', options.futureUnavailableLabel],
    ] as const) {
      await this.expectations.disabled(
        `Календарь периода: ${target}`,
        this.locate.role('option', { name: label, exact: true }),
      );
    }
  }

  async close(): Promise<void> {
    await this.actions.press('Date range: close', this.startInput, 'Escape');
    await this.expectations.hidden('Date range: closed', this.startInput);
  }
}
