import { type Page } from '@playwright/test';

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
}
