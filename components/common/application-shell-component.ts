import { expect, type Page } from '@playwright/test';
import { UiObject } from '@framework/ui';

export class ApplicationShellComponent extends UiObject {
  constructor(page: Page) {
    super(page);
  }

  sidebarLink(label: string) {
    return this.locate.role('link', { name: label, exact: true });
  }

  async expectSidebarDestination(label: string, href: string): Promise<void> {
    const link = this.sidebarLink(label);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }

  async openSidebarDestination(label: string, href: string): Promise<void> {
    await this.actions.click(`sidebar: open ${label}`, this.sidebarLink(label));
    await expect(this.page).toHaveURL(new RegExp(`${href.replace('/', '\\/')}$`));
  }

  async logout(): Promise<void> {
    // TODO(CRM): remove the CSS fallback after the icon-only button receives a stable accessible name/test id.
    const button = this.locate
      .role('button', { name: /log\s*out/i })
      .or(this.locate.css('button[class*="logout"]'))
      .first();
    await this.actions.click('profile: logout', button);
    await expect(this.page).toHaveURL(/\/login/);
  }
}
