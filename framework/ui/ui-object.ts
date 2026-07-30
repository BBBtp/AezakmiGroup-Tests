import type { Page } from '@playwright/test';

import { LocatorFactory } from './locator-factory';
import { UiActions } from './ui-actions';
import { UiExpectations } from './ui-expectations';

export abstract class UiObject {
  readonly actions: UiActions;
  readonly locate: LocatorFactory;
  readonly expectations: UiExpectations;

  protected constructor(readonly page: Page) {
    this.actions = new UiActions(page);
    this.locate = new LocatorFactory(page);
    this.expectations = new UiExpectations(page);
  }
}
