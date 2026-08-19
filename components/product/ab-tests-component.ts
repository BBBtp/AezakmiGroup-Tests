import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { productLocators } from '@locators/product';

export class AbTestsComponent extends UiObject {
  readonly root: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
  }

  async expectLoaded(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible('A/B tests: main', this.root);
    await this.expectations.visible(
      'A/B tests: title',
      within.text(productLocators.abTests.title, { exact: true }),
    );
    await this.expectations.visible(
      'A/B tests: Create test',
      within.role('link', { name: productLocators.abTests.create, exact: true }),
    );
    for (const control of [
      productLocators.abTests.filters,
      productLocators.abTests.team,
      productLocators.abTests.app,
      productLocators.abTests.testType,
    ]) {
      await this.expectations.visible(
        `A/B tests: ${String(control)}`,
        within.role('button', { name: control }),
      );
    }
    await this.expectations.visible(
      'A/B tests: Search',
      within.css(`input[placeholder="${productLocators.abTests.searchPlaceholder}"]`),
    );
    await this.expectations.notContainsText(
      'A/B tests: no technical values',
      this.root,
      productLocators.technicalValue,
    );
  }

  async openFilter(name: 'Team' | 'App' | 'Test type'): Promise<void> {
    const matcher = name === 'Team' ? productLocators.abTests.team : name;
    await this.actions.click(
      `A/B tests: open ${name}`,
      this.locate.within(this.root).role('button', { name: matcher }),
    );
    await this.expectations.visible(
      `A/B tests: ${name} filter actions`,
      this.locate.role('button', { name: 'Apply', exact: true }),
    );
    await this.actions.press(
      `A/B tests: close ${name}`,
      this.locate.within(this.root).role('button', { name: matcher }),
      'Escape',
    );
  }

  async expectRowsAndPagination(): Promise<void> {
    await this.expectations.nonEmpty('A/B tests: application links', this.appLinks);
    await this.expectations.visible(
      'A/B tests: rows per page',
      this.locate.within(this.root).role('combobox'),
    );
    await this.expectations.containsText('A/B tests: page counter', this.root, /\d+\s*of\s*\d+/);
  }

  async openFirstApplication(): Promise<void> {
    await this.actions.click('A/B tests: open first application', this.appLinks.first());
    await this.expectations.url('A/B tests: linked application URL', productLocators.apps.detailUrl);
  }

  async openCreate(): Promise<void> {
    await this.actions.click(
      'A/B tests: open Create test',
      this.locate.within(this.root).role('link', { name: productLocators.abTests.create, exact: true }),
    );
    await this.expectations.url('A/B tests: create URL', productLocators.abTests.createUrl);
    await this.expectations.visible('A/B tests create: main', this.root);
  }

  async expectTeamFilter(): Promise<void> {
    await this.expectations.visible(
      'A/B tests: Team Our tests',
      this.locate.within(this.root).role('button', { name: /^Team: Our tests/ }),
    );
  }

  async expectStateShell(): Promise<void> {
    await this.expectations.visible('A/B tests state: main', this.root);
    await this.expectations.notContainsText(
      'A/B tests state: no technical values',
      this.root,
      productLocators.technicalValue,
    );
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'A/B tests: loading state',
      this.locate.within(this.root).css(productLocators.loading).first(),
    );
  }

  async expectEmpty(): Promise<void> {
    await this.expectations.count('A/B tests: no application rows', this.appLinks, 0);
    await this.expectStateShell();
  }

  async expectError(): Promise<void> {
    await this.expectations.visible(
      'A/B tests: error message',
      this.locate.within(this.root).text(productLocators.errorMessage),
    );
    await this.expectations.count('A/B tests: stale rows hidden', this.appLinks, 0);
  }

  get appLinks(): Locator {
    return this.locate.within(this.root).css(productLocators.abTests.appLink);
  }
}
