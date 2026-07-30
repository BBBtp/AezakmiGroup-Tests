import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page';

export class EmployeeCreatePage extends BasePage {
  readonly personalInfoHeading: Locator;
  readonly workingInfoHeading: Locator;
  readonly secondNameInput: Locator;
  readonly firstNameInput: Locator;
  readonly birthDateInput: Locator;
  readonly countrySelect: Locator;
  readonly citySelect: Locator;
  readonly nextButton: Locator;
  readonly moduleSelect: Locator;
  readonly departmentSelect: Locator;
  readonly directionSelect: Locator;
  readonly positionSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.personalInfoHeading = this.locate.role('heading', {
      name: 'Personal info',
      exact: true,
    });
    this.workingInfoHeading = this.locate.role('heading', {
      name: 'Working info',
      exact: true,
    });
    this.secondNameInput = this.locate.role('textbox', { name: 'Second name', exact: true });
    this.firstNameInput = this.locate.role('textbox', { name: 'First name', exact: true });
    this.birthDateInput = this.locate.role('textbox', { name: 'Date of birth', exact: true });
    this.countrySelect = this.locate.role('combobox').filter({ hasText: 'Select a country' });
    this.citySelect = this.locate.role('combobox').filter({ hasText: 'Select a city' });
    this.nextButton = this.locate.css('[data-testid$="__button-next"]');
    this.moduleSelect = this.locate.role('button', { name: 'Select a module', exact: true });
    this.departmentSelect = this.locate.role('button', {
      name: 'Select a department',
      exact: true,
    });
    this.directionSelect = this.locate.role('combobox').filter({ hasText: 'Select a direction' });
    this.positionSelect = this.locate.role('combobox').filter({ hasText: 'Select a position' });
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/employees/create');
    await expect(this.personalInfoHeading).toBeVisible();
  }

  async openWorkingInfo(): Promise<void> {
    await this.actions.fill('employee personal info: second name', this.secondNameInput, 'Autotest');
    await this.actions.fill('employee personal info: first name', this.firstNameInput, 'Kpi');
    await this.actions.fill('employee personal info: date of birth', this.birthDateInput, '01.01.1990');
    await this.actions.run('press', 'employee personal info: close date picker', this.birthDateInput, () =>
      this.birthDateInput.press('Escape'),
    );

    await this.actions.click('employee personal info: country selector', this.countrySelect);
    const country = this.locate.role('option', { name: 'Andorra', exact: true });
    await this.actions.click('employee personal info: country Andorra', country);

    await this.actions.click('employee personal info: city selector', this.citySelect);
    const city = this.locate.role('option', { name: /Andorra la Vella/ });
    await this.actions.click('employee personal info: city Andorra la Vella', city);

    await this.actions.click('employee personal info: next', this.nextButton);
    await expect(this.workingInfoHeading).toBeVisible();
  }

  async selectAsoManagerPosition(): Promise<void> {
    await this.actions.click('employee working info: module selector', this.moduleSelect);
    await this.actions.click(
      'employee working info: module ASO',
      this.locate.role('option', { name: 'ASO', exact: true }),
    );

    await this.actions.click('employee working info: department selector', this.departmentSelect);
    await this.actions.click(
      'employee working info: department ASA',
      this.locate.role('option', { name: 'ASA', exact: true }),
    );

    await this.actions.click('employee working info: direction selector', this.directionSelect);
    await this.actions.click(
      'employee working info: direction Product',
      this.locate.role('option', { name: 'Product', exact: true }),
    );

    await expect(this.positionSelect).toBeEnabled();
    await this.actions.click('employee working info: position selector', this.positionSelect);
  }

  get asoManagerOption(): Locator {
    return this.locate.role('option', { name: 'ASO manager', exact: true });
  }
}
