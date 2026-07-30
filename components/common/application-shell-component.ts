import { type Page } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { applicationShellLocators } from '@locators/navigation';

export class ApplicationShellComponent extends UiObject {
  constructor(page: Page) {
    super(page);
  }

  sidebarLink(label: string) {
    return this.locate.role('link', { name: label, exact: true });
  }

  async expectSidebarDestination(label: string, href: string): Promise<void> {
    const link = this.sidebarLink(label);
    await this.expectations.visible(`sidebar destination ${label}`, link);
    await this.expectations.attribute(`sidebar destination ${label}`, link, 'href', href);
  }

  async openSidebarDestination(label: string, href: string): Promise<void> {
    await this.actions.click(`sidebar: open ${label}`, this.sidebarLink(label));
    await this.expectations.url(`sidebar destination ${label}`, new RegExp(`${href.replace('/', '\\/')}$`));
  }

  async logout(): Promise<void> {
    // TODO(CRM): remove the CSS fallback after the icon-only button receives a stable accessible name/test id.
    const button = this.locate
      .role('button', { name: applicationShellLocators.logoutAccessibleName })
      .or(this.locate.css(applicationShellLocators.logoutFallbackSelector))
      .first();
    await this.actions.click('profile: logout', button);
    await this.expectations.url('login after logout', /\/login/);
  }
}
