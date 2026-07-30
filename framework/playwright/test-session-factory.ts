import type { Browser, BrowserContextOptions } from '@playwright/test';
import type { CleanupRegistry } from '@framework/lifecycle';
import { ManagedTestSession } from './managed-test-session';

export class TestSessionFactory {
  private sequence = 0;

  constructor(
    private readonly browser: Browser,
    private readonly cleanup: CleanupRegistry,
  ) {}

  async newSession(options: BrowserContextOptions = {}): Promise<ManagedTestSession> {
    const context = await this.browser.newContext(options);
    this.sequence += 1;
    this.cleanup.register(`browser context #${this.sequence}`, () => context.close());
    return new ManagedTestSession(await context.newPage(), this.cleanup);
  }
}
