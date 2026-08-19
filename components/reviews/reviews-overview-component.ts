import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { reviewsLocators } from '@locators/reviews';

export class ReviewsOverviewComponent extends UiObject {
  readonly root: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
  }

  async expectLoaded(): Promise<void> {
    const within = this.locate.within(this.root);
    const tabLabels: readonly string[] = [
      reviewsLocators.reviewsTab,
      reviewsLocators.ratingsTab,
      reviewsLocators.viewAll,
      reviewsLocators.today,
      reviewsLocators.yesterday,
    ];
    await this.expectations.visible('Reviews: main', this.root);
    await this.expectations.visible('Reviews: title', within.text(reviewsLocators.title, { exact: true }));
    for (const label of [
      reviewsLocators.reviewsTab,
      reviewsLocators.ratingsTab,
      reviewsLocators.viewAll,
      reviewsLocators.today,
      reviewsLocators.yesterday,
      reviewsLocators.rating,
      reviewsLocators.date,
    ]) {
      const role = tabLabels.includes(label) ? 'tab' : 'button';
      await this.expectations.visible(`Reviews: ${label}`, within.role(role, { name: label }));
    }
    await this.expectations.visible(
      'Reviews: search',
      within.css(`input[placeholder="${reviewsLocators.searchPlaceholder}"]`),
    );
    await this.expectations.notContainsText(
      'Reviews: no technical values',
      this.root,
      reviewsLocators.technicalValue,
    );
  }

  async switchTab(tab: 'Reviews' | 'Ratings'): Promise<void> {
    const control = this.locate.within(this.root).role('tab', { name: tab, exact: true });
    await this.actions.click(`Reviews: switch to ${tab}`, control);
    await this.expectations.attribute(`Reviews: ${tab} active`, control, 'data-state', 'active');
  }

  async selectPeriod(period: 'View all' | 'Today' | 'Yesterday'): Promise<void> {
    const control = this.locate.within(this.root).role('tab', { name: period, exact: true });
    await this.actions.click(`Reviews: select ${period}`, control);
    await this.expectations.attribute(`Reviews: ${period} active`, control, 'data-state', 'active');
  }

  async expectRows(): Promise<void> {
    await this.expectations.nonEmpty('Reviews: application rows', this.locate.within(this.root).role('link'));
  }

  async openFirstApplication(): Promise<void> {
    const application = this.locate.within(this.root).role('link').first();
    await this.actions.click('Reviews: open first application', application);
    await this.expectations.url('Reviews: application detail URL', /\/apps\/[0-9a-f-]+$/i);
  }

  async expandFirstLongReview(): Promise<void> {
    // The case checks expansion on one representative long review; rows expose the same local action.
    const more = this.locate.within(this.root).role('button', { name: 'See more', exact: true }).first();
    if ((await more.count()) > 0) {
      await this.actions.click('Reviews: expand long review', more);
      await this.expectations.visible(
        'Reviews: expanded review collapse action',
        this.locate
          .within(this.root)
          .role('button', { name: /See less|Show less/i })
          .first(),
      );
    }
  }

  async goToNextPage(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.actions.click('Reviews: next page', within.css(reviewsLocators.nextPage));
  }

  async expectPagination(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible('Reviews: rows per page', within.role('combobox'));
    await this.expectations.enabled('Reviews: next page is available', within.css(reviewsLocators.nextPage));
    await this.expectations.disabled(
      'Reviews: previous page is blocked on the first page',
      within.css(reviewsLocators.previousPage),
    );
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible('Reviews loading: page shell', this.root);
    await this.expectations.hidden(
      'Reviews loading: stale application rows hidden',
      this.locate.within(this.root).role('link'),
    );
    await this.expectations.notContainsText(
      'Reviews loading: no technical values',
      this.root,
      reviewsLocators.technicalValue,
    );
  }

  async expectError(): Promise<void> {
    await this.expectations.visible(
      'Reviews: error message',
      this.locate.within(this.root).text(reviewsLocators.errorMessage),
    );
    await this.expectations.hidden('Reviews: stale rows hidden', this.locate.within(this.root).role('link'));
  }
}
