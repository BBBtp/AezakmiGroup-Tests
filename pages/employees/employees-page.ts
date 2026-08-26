import type { Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { EmployeesListComponent } from '../../components/employees/employees-list-component';
import { BasePage } from '../base-page';

export class EmployeesPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly list: EmployeesListComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.list = new EmployeesListComponent(page);
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/employees');
    await this.list.expectLoaded();
  }

  async openRoute(): Promise<void> {
    await this.navigateTo('/employees');
    await this.list.expectShellLoaded();
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Employees', '/employees', 'Staff');
    await this.list.expectLoaded();
  }
}
