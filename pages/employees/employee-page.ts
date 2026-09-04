import type { Locator, Page } from '@playwright/test';

import { employeeDetailsLocators } from '@locators/employees';
import { BasePage } from '../base-page';
import { EmployeeVacationPage } from './employee-vacation-page';

export class EmployeePage extends BasePage {
  readonly detailsButton: Locator;

  constructor(
    page: Page,
    readonly employeeId: string,
  ) {
    super(page);
    this.detailsButton = this.locate
      .within(this.locate.role('main'))
      .role('button', { name: employeeDetailsLocators.detailsButton, exact: true });
  }

  async navigate(): Promise<void> {
    await this.navigateTo(`/employees/${this.employeeId}`);
    await this.expectations.url('URL карточки сотрудника', new RegExp(`/employees/${this.employeeId}$`));
    await this.expectations.visible('карточка сотрудника', this.detailsButton);
  }

  async openVacation(): Promise<EmployeeVacationPage> {
    await this.actions.click('карточка сотрудника: открыть Vacation', this.detailsButton);
    await this.expectations.url(
      'URL отпуска сотрудника',
      new RegExp(`/employees/${this.employeeId}/vacation$`),
    );

    const vacationPage = new EmployeeVacationPage(this.page, this.employeeId);
    await vacationPage.expectLoaded();
    return vacationPage;
  }
}
