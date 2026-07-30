import type { Browser, BrowserContextOptions, Page } from '@playwright/test';
import type { CleanupRegistry } from '@framework/lifecycle';

export class TestSessionFactory {
  private sequence = 0;

  constructor(
    private readonly browser: Browser,
    private readonly cleanup: CleanupRegistry,
  ) {}

  async newPage(options: BrowserContextOptions = {}): Promise<Page> {
    const context = await this.browser.newContext(options);
    this.sequence += 1;
    this.cleanup.register(`browser context #${this.sequence}`, () => context.close());
    return context.newPage();
  }
}
