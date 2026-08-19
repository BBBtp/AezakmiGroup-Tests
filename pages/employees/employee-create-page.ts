import { type Locator, type Page } from '@playwright/test';
import { employeeCityGroups, employeeCreateData, employeeCreateLocators } from '@locators/employees';
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
      name: employeeCreateLocators.personalInfoHeading,
      exact: true,
    });
    this.workingInfoHeading = this.locate.role('heading', {
      name: employeeCreateLocators.workingInfoHeading,
      exact: true,
    });
    this.secondNameInput = this.locate.role('textbox', {
      name: employeeCreateLocators.secondNameInput,
      exact: true,
    });
    this.firstNameInput = this.locate.role('textbox', {
      name: employeeCreateLocators.firstNameInput,
      exact: true,
    });
    this.birthDateInput = this.locate.role('textbox', {
      name: employeeCreateLocators.birthDateInput,
      exact: true,
    });
    this.countrySelect = this.locate
      .role('combobox')
      .filter({ hasText: employeeCreateLocators.countryPlaceholder });
    this.citySelect = this.locate
      .role('combobox')
      .filter({ hasText: employeeCreateLocators.cityPlaceholder });
    this.nextButton = this.locate.css(employeeCreateLocators.nextButtonSelector);
    this.moduleSelect = this.locate.role('button', {
      name: employeeCreateLocators.moduleSelect,
      exact: true,
    });
    this.departmentSelect = this.locate.role('button', {
      name: employeeCreateLocators.departmentSelect,
      exact: true,
    });
    this.directionSelect = this.locate
      .role('combobox')
      .filter({ hasText: employeeCreateLocators.directionPlaceholder });
    this.positionSelect = this.locate
      .role('combobox')
      .filter({ hasText: employeeCreateLocators.positionPlaceholder });
  }

  async navigate(): Promise<void> {
    await this.navigateTo('/employees/create');
    await this.expectations.visible('employee personal info', this.personalInfoHeading);
  }

  async openWorkingInfo(): Promise<void> {
    await this.actions.fill(
      'employee personal info: second name',
      this.secondNameInput,
      employeeCreateData.secondName,
    );
    await this.actions.fill(
      'employee personal info: first name',
      this.firstNameInput,
      employeeCreateData.firstName,
    );
    await this.actions.fill(
      'employee personal info: date of birth',
      this.birthDateInput,
      employeeCreateData.birthDate,
    );
    await this.actions.run('press', 'employee personal info: close date picker', this.birthDateInput, () =>
      this.birthDateInput.press('Escape'),
    );

    await this.actions.click('employee personal info: country selector', this.countrySelect);
    const country = this.locate.role('option', {
      name: employeeCreateLocators.countryOption,
      exact: true,
    });
    await this.actions.click('employee personal info: country Andorra', country);

    await this.actions.click('employee personal info: city selector', this.citySelect);
    const city = this.locate.role('option', { name: employeeCreateLocators.cityOption });
    await this.actions.click('employee personal info: city Andorra la Vella', city);

    await this.actions.click('employee personal info: next', this.nextButton);
    await this.expectations.visible('employee working info', this.workingInfoHeading);
  }

  async selectAsoManagerPosition(): Promise<void> {
    await this.actions.click('employee working info: module selector', this.moduleSelect);
    await this.actions.click(
      'employee working info: module ASO',
      this.locate.role('option', { name: employeeCreateLocators.moduleOption, exact: true }),
    );

    await this.actions.click('employee working info: department selector', this.departmentSelect);
    await this.actions.click(
      'employee working info: department ASA',
      this.locate.role('option', { name: employeeCreateLocators.departmentOption, exact: true }),
    );

    await this.actions.click('employee working info: direction selector', this.directionSelect);
    await this.actions.click(
      'employee working info: direction Product',
      this.locate.role('option', { name: employeeCreateLocators.directionOption, exact: true }),
    );

    await this.expectations.enabled('employee position selector', this.positionSelect);
    await this.actions.click('employee working info: position selector', this.positionSelect);
  }

  get asoManagerOption(): Locator {
    return this.locate.role('option', {
      name: employeeCreateLocators.positionOption,
      exact: true,
    });
  }

  async expectAsoManagerOptionVisible(): Promise<void> {
    await this.expectations.visible('employee position option ASO manager', this.asoManagerOption);
  }

  async expectExpandedCityList(): Promise<void> {
    await this.navigate();
    let selectedCountry: string = employeeCreateLocators.countryPlaceholder;

    for (const [groupIndex, group] of employeeCityGroups.entries()) {
      const countrySelect = this.locate.role('combobox').filter({ hasText: selectedCountry });
      await this.actions.click(`employee personal info: country selector ${group.country}`, countrySelect);
      await this.actions.click(
        `employee personal info: country ${group.country}`,
        this.locate.role('option', { name: group.country, exact: true }),
      );
      selectedCountry = group.country;

      const citySelect = this.locate
        .role('combobox')
        .filter({ hasText: employeeCreateLocators.cityPlaceholder });
      await this.expectations.enabled(
        `employee personal info: city selector for ${group.country}`,
        citySelect,
      );
      await this.actions.click(`employee personal info: open cities for ${group.country}`, citySelect);

      for (const city of group.cities) {
        await this.expectations.visible(
          `employee personal info: city ${city}`,
          this.locate.role('option', { name: city, exact: true }),
        );
      }

      const isLastGroup = groupIndex === employeeCityGroups.length - 1;
      if (isLastGroup) {
        const city = group.cities[0];
        await this.actions.click(
          `employee personal info: select city ${city}`,
          this.locate.role('option', { name: city, exact: true }),
        );
        await this.expectations.visible(
          `employee personal info: selected city ${city}`,
          this.locate.role('combobox').filter({ hasText: city }),
        );
      } else {
        await this.actions.press(
          `employee personal info: close cities for ${group.country}`,
          this.locate.role('option', { name: group.cities[0], exact: true }),
          'Escape',
        );
      }
    }
  }
}
