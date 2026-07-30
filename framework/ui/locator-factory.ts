import type { Locator, Page } from '@playwright/test';

type LocatorRoot = Page | Locator;
type Role = Parameters<Page['getByRole']>[0];
type RoleOptions = Parameters<Page['getByRole']>[1];
type Text = Parameters<Page['getByText']>[0];
type TextOptions = Parameters<Page['getByText']>[1];

export class LocatorFactory {
  constructor(private readonly root: LocatorRoot) {}

  testId(value: string | RegExp): Locator {
    return this.root.getByTestId(value);
  }

  role(role: Role, options?: RoleOptions): Locator {
    return this.root.getByRole(role, options);
  }

  text(value: Text, options?: TextOptions): Locator {
    return this.root.getByText(value, options);
  }

  label(value: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.root.getByLabel(value, options);
  }

  css(selector: string): Locator {
    return this.root.locator(selector);
  }

  within(locator: Locator): LocatorFactory {
    return new LocatorFactory(locator);
  }
}
