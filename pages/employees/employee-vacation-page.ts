import type { Locator, Page } from '@playwright/test';

import { employeeDetailsLocators } from '@locators/employees';
import { vacationLocators } from '@locators/vacation';
import { BasePage } from '../base-page';

export class EmployeeVacationPage extends BasePage {
  readonly vacationBreadcrumb: Locator;
  readonly vacationHistoryTitle: Locator;
  readonly vacationRows: Locator;
  readonly vacationEditAction: Locator;
  readonly vacationDeleteAction: Locator;
  readonly editDialog: Locator;
  readonly editStartDateInput: Locator;

  constructor(
    page: Page,
    readonly employeeId: string,
  ) {
    super(page);
    const main = this.locate.role('main');
    const within = this.locate.within(main);
    this.vacationBreadcrumb = within.text(employeeDetailsLocators.vacationBreadcrumb, { exact: true });
    this.vacationHistoryTitle = within.text(employeeDetailsLocators.vacationHistory.title, {
      exact: true,
    });
    this.vacationRows = within.css(employeeDetailsLocators.vacationHistory.row);
    this.vacationEditAction = within.role('button', {
      name: employeeDetailsLocators.vacationHistory.editAction,
      exact: true,
    });
    this.vacationDeleteAction = within.role('button', {
      name: employeeDetailsLocators.vacationHistory.deleteAction,
      exact: true,
    });
    this.editDialog = this.locate.role('dialog');
    this.editStartDateInput = this.locate
      .within(this.editDialog)
      .css(vacationLocators.dateInputSelector)
      .first();
  }

  async expectLoaded(): Promise<void> {
    await this.expectations.url(
      'URL отпуска сотрудника',
      new RegExp(`/employees/${this.employeeId}/vacation$`),
    );
    await this.expectations.visible('раздел Vacation сотрудника', this.vacationBreadcrumb);
  }

  async expectVacationHistoryEditable(): Promise<void> {
    await this.expectations.visible('история отпусков сотрудника', this.vacationHistoryTitle);
    await this.expectations.countAtLeast('строки истории отпусков сотрудника', this.vacationRows, 1);

    const rowsCount = await this.vacationRows.count();
    for (let index = 0; index < rowsCount; index += 1) {
      const row = this.vacationRows.nth(index);
      await this.expectations.visible(`строка истории отпусков ${index + 1}`, row);
      await this.expectations.visible(
        `редактирование строки истории отпусков ${index + 1}`,
        this.locate.within(row).role('button', {
          name: employeeDetailsLocators.vacationHistory.editAction,
          exact: true,
        }),
      );
      await this.expectations.visible(
        `удаление строки истории отпусков ${index + 1}`,
        this.locate.within(row).role('button', {
          name: employeeDetailsLocators.vacationHistory.deleteAction,
          exact: true,
        }),
      );
    }
  }

  async openEditVacation(): Promise<void> {
    await this.actions.click('история отпусков: открыть редактирование', this.vacationEditAction);
    await this.expectations.visible('форма редактирования отпуска', this.editDialog);
  }

  async fillEditStartDate(value: string): Promise<void> {
    await this.actions.fill('дата начала при редактировании отпуска', this.editStartDateInput, value);
  }

  async expectEditStartDate(value: string): Promise<void> {
    await this.expectations.value('дата начала при редактировании отпуска', this.editStartDateInput, value);
  }
}
