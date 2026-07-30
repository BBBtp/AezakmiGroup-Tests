import type { Page } from '@playwright/test';

import type { CleanupRegistry } from '@framework/lifecycle';
import { NetworkController } from '@framework/network';
import { UiActions, UiExpectations } from '@framework/ui';

export type SessionStorageValues = Readonly<Record<string, string>>;

/**
 * Управляемая дополнительная вкладка без утечки raw Page в бизнес-тесты.
 */
export class ManagedTestSession {
  private readonly actions: UiActions;
  private readonly expectations: UiExpectations;
  private readonly network: NetworkController;

  constructor(
    private readonly page: Page,
    cleanup?: CleanupRegistry,
  ) {
    this.actions = new UiActions(page);
    this.expectations = new UiExpectations(page);
    this.network = new NetworkController(page, cleanup);
  }

  navigate(url: string, options?: Parameters<Page['goto']>[1]) {
    return this.network.navigate(url, options);
  }

  reload(options?: Parameters<Page['reload']>[0]) {
    return this.network.reload(options);
  }

  async setLocalStorage(values: SessionStorageValues): Promise<void> {
    await this.actions.run(
      'evaluate',
      'browser session: update local storage',
      this.page.locator('body'),
      () =>
        this.page.evaluate((entries) => {
          for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
        }, values),
    );
  }

  expectUrl(value: string | RegExp, options?: { timeout?: number }): Promise<void> {
    return this.expectations.url('managed browser session URL', value, options);
  }
}
