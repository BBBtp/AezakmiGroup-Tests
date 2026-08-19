import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { productLocators } from '@locators/product';

export class AppsComponent extends UiObject {
  readonly root: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
  }

  async expectLoaded(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible('Apps: main', this.root);
    await this.expectations.visible('Apps: title', within.text(productLocators.apps.title, { exact: true }));
    await this.expectations.visible(
      'Apps: Archive',
      within.role('link', { name: productLocators.apps.archive, exact: true }),
    );
    await this.expectations.visible(
      'Apps: Refresh',
      within.role('button', { name: productLocators.apps.refresh, exact: true }),
    );
    for (const tab of [...productLocators.apps.periods, ...productLocators.apps.views]) {
      await this.expectations.visible(`Apps: ${tab}`, within.role('tab', { name: tab, exact: true }));
    }
    await this.expectations.visible(
      'Apps: Search',
      within.css(`input[placeholder="${productLocators.apps.searchPlaceholder}"]`),
    );
    await this.expectations.notContainsText(
      'Apps: no technical values',
      this.root,
      productLocators.technicalValue,
    );
  }

  async selectTab(
    name: (typeof productLocators.apps.periods)[number] | (typeof productLocators.apps.views)[number],
  ): Promise<void> {
    const tab = this.locate.within(this.root).role('tab', { name, exact: true });
    await this.actions.click(`Apps: select ${name}`, tab);
    await this.expectations.attribute(`Apps: ${name} active`, tab, 'data-state', 'active');
  }

  async expectRows(): Promise<void> {
    await this.expectations.nonEmpty('Apps: application rows', this.appLinks);
  }

  async openFirstApp(): Promise<string> {
    const first = this.appLinks.first();
    const label = (await first.textContent())?.trim() ?? '';
    await this.actions.click('Apps: open first application', first);
    await this.expectations.url('Apps: detail URL', productLocators.apps.detailUrl);
    return label;
  }

  async expectDetail(): Promise<void> {
    await this.expectations.visible('Apps detail: main', this.root);
    await this.expectations.notContainsText(
      'Apps detail: no technical values',
      this.root,
      productLocators.technicalValue,
    );
  }

  async openArchive(): Promise<void> {
    await this.actions.click(
      'Apps: open Archive',
      this.locate.within(this.root).role('link', { name: productLocators.apps.archive, exact: true }),
    );
    await this.expectations.url('Apps: Archive URL', /\/apps\/archive$/);
  }

  async expectPaginationContext(): Promise<void> {
    const next = this.locate.within(this.root).css(productLocators.nextPage);
    if ((await next.count()) > 0) await this.expectations.visible('Apps: pagination', next);
    await this.expectations.visible(
      'Apps: period context',
      this.locate.within(this.root).role('tab', { name: 'Day', exact: true }),
    );
  }

  async expectStateShell(): Promise<void> {
    await this.expectations.visible('Apps state: main', this.root);
    await this.expectations.notContainsText(
      'Apps state: no technical values',
      this.root,
      productLocators.technicalValue,
    );
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'Apps: loading state',
      this.locate.within(this.root).css(productLocators.loading).first(),
    );
  }

  async expectEmpty(): Promise<void> {
    await this.expectations.count('Apps: no application rows', this.appLinks, 0);
    await this.expectStateShell();
  }

  async expectError(): Promise<void> {
    await this.expectations.visible(
      'Apps: error message',
      this.locate.within(this.root).text(productLocators.errorMessage),
    );
    await this.expectations.count('Apps: stale application rows hidden', this.appLinks, 0);
  }

  get appLinks(): Locator {
    return this.locate.within(this.root).css(productLocators.apps.appLink);
  }
}
