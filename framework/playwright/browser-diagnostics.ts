import type { ConsoleMessage, Page } from '@playwright/test';

import type { CleanupHandle, CleanupRegistry } from '@framework/lifecycle';

export class ConsoleErrorCapture {
  readonly errors: string[] = [];
  private active = true;
  private cleanupHandle?: CleanupHandle;

  constructor(
    private readonly page: Page,
    private readonly label: string,
  ) {
    this.page.on('console', this.listener);
  }

  attachCleanup(handle: CleanupHandle): void {
    this.cleanupHandle = handle;
  }

  stop(): void {
    if (!this.active) return;
    this.page.off('console', this.listener);
    this.active = false;
    this.cleanupHandle?.dismiss();
  }

  expectNoErrors(): void {
    if (this.errors.length === 0) return;
    throw new Error(
      `${this.label} produced ${this.errors.length} console error(s):\n${this.errors.join('\n')}`,
    );
  }

  private readonly listener = (message: ConsoleMessage): void => {
    if (message.type() === 'error') this.errors.push(message.text());
  };
}

export class BrowserDiagnostics {
  private sequence = 0;

  constructor(
    private readonly page: Page,
    private readonly cleanup: CleanupRegistry,
  ) {}

  captureConsoleErrors(label = 'browser flow'): ConsoleErrorCapture {
    this.sequence += 1;
    const capture = new ConsoleErrorCapture(this.page, label);
    const cleanupHandle = this.cleanup.register(`console error capture #${this.sequence}`, () =>
      capture.stop(),
    );
    capture.attachCleanup(cleanupHandle);
    return capture;
  }
}
