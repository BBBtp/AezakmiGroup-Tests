import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { vacationLocators, vacationText } from '@locators/vacation';

export class VacationFormComponent extends UiObject {
  readonly planVacationButton: Locator;
  readonly dialog: Locator;
  readonly actionTypeSelect: Locator;
  readonly testEmployee: Locator;
  readonly nextButton: Locator;
  readonly startDateInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.planVacationButton = this.locate.role('button', {
      name: vacationText.planVacation,
      exact: true,
    });
    this.dialog = this.locate.role('dialog', { name: vacationText.planningDialog });
    const dialog = this.locate.within(this.dialog);
    this.actionTypeSelect = dialog.role('combobox');
    this.testEmployee = this.locate.role('option', {
      name: vacationText.testEmployee,
      exact: true,
    });
    this.nextButton = dialog.css(vacationLocators.wizardButtonsSelector).last();
    this.startDateInput = dialog.css(vacationLocators.dateInputSelector).first();
    this.submitButton = dialog.role('button', { name: vacationText.submit, exact: true });
  }

  async open(): Promise<void> {
    await this.actions.click('планирование отпуска', this.planVacationButton);
    await this.expectations.visible('модальное окно добавления отпуска', this.dialog);
  }

  async selectEmployee(): Promise<void> {
    await this.actions.click('выбор сотрудника для отпуска', this.actionTypeSelect);
    await this.actions.click('тестовый сотрудник', this.testEmployee);
    await this.actions.click('переход к датам отпуска', this.nextButton);
  }

  async fillStartDate(value: string): Promise<void> {
    await this.actions.fill('дата начала отпуска', this.startDateInput, value);
  }

  async openStartDateCalendar(): Promise<void> {
    await this.actions.click('календарь даты начала отпуска', this.startDateInput);
  }

  async expectStartDate(value: string): Promise<void> {
    await this.expectations.value('дата начала отпуска', this.startDateInput, value);
  }

  async expectOneYearCalendarBoundary(currentYear: number): Promise<void> {
    const currentYearButton = this.locate.role('button', { name: String(currentYear), exact: true });
    await this.actions.click('выбор года начала отпуска', currentYearButton);
    const allowedYear = this.locate.role('button', {
      name: String(currentYear - 1),
      exact: true,
    });
    const olderYear = this.locate.role('button', {
      name: String(currentYear - 2),
      exact: true,
    });
    await this.expectations.enabled('год в пределах допустимого периода', allowedYear);
    await this.actions.click('год старше допустимого периода', olderYear);
    await this.expectations.visible('выбор года остаётся открыт после недоступного года', allowedYear);
    await this.actions.click('год в пределах допустимого периода', allowedYear);
  }
}
