import { type Page } from '@playwright/test';

import { vacationLocators } from '@locators/vacation';
import { VacationFormComponent } from '../../components/vacation/vacation-form-component';
import { BasePage } from '../base-page';

export class VacationSchedulePage extends BasePage {
  readonly form: VacationFormComponent;

  constructor(page: Page) {
    super(page);
    this.form = new VacationFormComponent(page);
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/schedule');
    await this.expectations.url('URL графика отпусков', /\/schedule(?:\?.*)?$/);
    await this.expectations.visible('кнопка планирования отпуска', this.form.planVacationButton);
  }

  async openPreviousYear(): Promise<void> {
    const previousYear = this.locate.css(vacationLocators.yearNavigator.previousButton);
    await this.actions.click('предыдущий год графика отпусков', previousYear);
  }

  async expectYear(year: number): Promise<void> {
    await this.expectations.text(
      `выбранный год графика отпусков ${year}`,
      this.locate.within(this.locate.role('main')).text(String(year), { exact: true }),
      String(year),
    );
  }
}
