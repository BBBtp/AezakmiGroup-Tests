import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { loggedAction, loggedClick, loggedFill } from '../../utils/playwright-logger';

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
    this.personalInfoHeading = page.getByRole('heading', { name: 'Personal info', exact: true });
    this.workingInfoHeading = page.getByRole('heading', { name: 'Working info', exact: true });
    this.secondNameInput = page.getByRole('textbox', { name: 'Second name', exact: true });
    this.firstNameInput = page.getByRole('textbox', { name: 'First name', exact: true });
    this.birthDateInput = page.getByRole('textbox', { name: 'Date of birth', exact: true });
    this.countrySelect = page.getByRole('combobox').filter({ hasText: 'Select a country' });
    this.citySelect = page.getByRole('combobox').filter({ hasText: 'Select a city' });
    this.nextButton = page.locator('[data-testid$="__button-next"]');
    this.moduleSelect = page.getByRole('button', { name: 'Select a module', exact: true });
    this.departmentSelect = page.getByRole('button', { name: 'Select a department', exact: true });
    this.directionSelect = page.getByRole('combobox').filter({ hasText: 'Select a direction' });
    this.positionSelect = page.getByRole('combobox').filter({ hasText: 'Select a position' });
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/employees/create');
    await expect(this.personalInfoHeading).toBeVisible();
  }

  async openWorkingInfo(): Promise<void> {
    await loggedFill(this.page, 'employee personal info: second name', this.secondNameInput, 'Autotest');
    await loggedFill(this.page, 'employee personal info: first name', this.firstNameInput, 'Kpi');
    await loggedFill(this.page, 'employee personal info: date of birth', this.birthDateInput, '01.01.1990');
    await loggedAction(
      this.page,
      'press',
      'employee personal info: close date picker',
      this.birthDateInput,
      () => this.birthDateInput.press('Escape'),
    );

    await loggedClick(this.page, 'employee personal info: country selector', this.countrySelect);
    const country = this.page.getByRole('option', { name: 'Andorra', exact: true });
    await loggedClick(this.page, 'employee personal info: country Andorra', country);

    await loggedClick(this.page, 'employee personal info: city selector', this.citySelect);
    const city = this.page.getByRole('option', { name: /Andorra la Vella/ });
    await loggedClick(this.page, 'employee personal info: city Andorra la Vella', city);

    await loggedClick(this.page, 'employee personal info: next', this.nextButton);
    await expect(this.workingInfoHeading).toBeVisible();
  }

  async selectAsoManagerPosition(): Promise<void> {
    await loggedClick(this.page, 'employee working info: module selector', this.moduleSelect);
    await loggedClick(
      this.page,
      'employee working info: module ASO',
      this.page.getByRole('option', { name: 'ASO', exact: true }),
    );

    await loggedClick(this.page, 'employee working info: department selector', this.departmentSelect);
    await loggedClick(
      this.page,
      'employee working info: department ASA',
      this.page.getByRole('option', { name: 'ASA', exact: true }),
    );

    await loggedClick(this.page, 'employee working info: direction selector', this.directionSelect);
    await loggedClick(
      this.page,
      'employee working info: direction Product',
      this.page.getByRole('option', { name: 'Product', exact: true }),
    );

    await expect(this.positionSelect).toBeEnabled();
    await loggedClick(this.page, 'employee working info: position selector', this.positionSelect);
  }

  get asoManagerOption(): Locator {
    return this.page.getByRole('option', { name: 'ASO manager', exact: true });
  }
}
