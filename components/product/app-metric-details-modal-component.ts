import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { productLocators } from '@locators/product';

type GeoOptionToken = 'select_all' | 'divider' | string;

export class AppMetricDetailsModalComponent extends UiObject {
  readonly root: Locator;
  readonly filtersButton: Locator;
  readonly geoFilterButton: Locator;
  readonly selectAllOption: Locator;
  readonly totalOption: Locator;
  readonly applyButton: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('dialog');
    const modal = this.locate.within(this.root);
    this.filtersButton = modal.role('button', {
      name: productLocators.apps.metricDetails.filtersButton,
    });
    this.geoFilterButton = modal.role('button', {
      name: productLocators.apps.metricDetails.geoFilterButton,
    });
    this.selectAllOption = this.locate.testId(productLocators.apps.metricDetails.selectAllOption);
    this.totalOption = this.locate.testId(productLocators.apps.metricDetails.totalOption);
    this.applyButton = this.locate.testId(productLocators.apps.metricDetails.applyButton);
  }

  async expectSuccessRateOpen(): Promise<void> {
    await this.expectations.visible('Apps metric details: modal', this.root);
    await this.expectations.visible(
      'Apps metric details: Success rate chart',
      this.locate.within(this.root).text('Success rate', { exact: true }),
    );
  }

  async openGeoFilter(): Promise<void> {
    await this.actions.click('Apps metric details: show filters', this.filtersButton);
    await this.expectations.visible('Apps metric details: GEO filter', this.geoFilterButton);
    await this.actions.click('Apps metric details: open GEO filter', this.geoFilterButton);
    await this.expectations.visible('Apps metric details: Select all option', this.selectAllOption);
    await this.expectations.visible('Apps metric details: Total option', this.totalOption);
  }

  async selectAllGeos(): Promise<void> {
    const checkbox = this.optionCheckbox('select_all');
    if ((await checkbox.getAttribute('aria-checked')) !== 'true') {
      await this.actions.click('Apps metric details: select all GEOs', checkbox);
    }
    await this.expectations.attribute(
      'Apps metric details: all GEOs selected',
      checkbox,
      'aria-checked',
      'true',
    );
  }

  async selectOnlyGeos(values: readonly string[]): Promise<void> {
    await this.selectAllGeos();
    const selectAll = this.optionCheckbox('select_all');
    await this.actions.click('Apps metric details: clear all GEOs', selectAll);
    await this.expectations.attribute(
      'Apps metric details: Select all cleared',
      selectAll,
      'aria-checked',
      'false',
    );

    for (const value of values) {
      const checkbox = this.optionCheckbox(value);
      await this.actions.click(`Apps metric details: select GEO ${value}`, checkbox);
      await this.expectations.attribute(
        `Apps metric details: GEO ${value} selected`,
        checkbox,
        'aria-checked',
        'true',
      );
    }
  }

  async optionOrder(): Promise<GeoOptionToken[]> {
    return this.actions.run('evaluate', 'Apps metric details: GEO option order', this.totalOption, () =>
      this.totalOption.evaluate((total) => {
        const container = total.parentElement;
        if (!container) throw new Error('GEO FilterPopover options container was not found');

        return Array.from(container.children)
          .map((child) => {
            const testId = child.getAttribute('data-testid');
            const option = testId?.match(/__option-(.+)$/)?.[1];
            if (option) return option;
            return child.getBoundingClientRect().height <= 2 ? 'divider' : '';
          })
          .filter(Boolean);
      }),
    );
  }

  async applyGeoFilter(): Promise<void> {
    await this.actions.click('Apps metric details: apply GEO filter', this.applyButton);
    await this.expectations.hidden('Apps metric details: GEO options closed', this.selectAllOption);
  }

  private optionCheckbox(value: string): Locator {
    return this.locate.testId(productLocators.apps.metricDetails.optionCheckbox(value));
  }
}
