export const employeeCreateLocators = {
  personalInfoHeading: 'Personal info',
  workingInfoHeading: 'Working info',
  secondNameInput: 'Second name',
  firstNameInput: 'First name',
  birthDateInput: 'Date of birth',
  countryPlaceholder: 'Select a country',
  cityPlaceholder: 'Select a city',
  nextButtonSelector: '[data-testid$="__button-next"]',
  moduleSelect: 'Select a module',
  departmentSelect: 'Select a department',
  directionPlaceholder: 'Select a direction',
  positionPlaceholder: 'Select a position',
  countryOption: 'Andorra',
  cityOption: /Andorra la Vella/,
  moduleOption: 'ASO',
  departmentOption: 'ASA',
  directionOption: 'Product',
  positionOption: 'ASO manager',
} as const;

export const employeeCreateData = {
  secondName: 'Autotest',
  firstName: 'Kpi',
  birthDate: '01.01.1990',
} as const;
