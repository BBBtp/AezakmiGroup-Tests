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

export const employeeCityGroups = [
  {
    country: 'Russia',
    cities: [
      'Kirov (MSK+0)',
      'Tolyatti (MSK+1)',
      'Orel (MSK+0)',
      'Krasnodar (MSK+0)',
      'Stavropol (MSK+0)',
      'Buzuluk (MSK+2)',
      'Balashikha (MSK+0)',
      'Yaroslavl (MSK+0)',
      'Cheboksary (MSK+0)',
      'Volzhsky (MSK+0)',
    ],
  },
  {
    country: 'Ukraine',
    cities: ['Sevastopol (MSK+0)', 'Kryvyy Rih (MSK+0)'],
  },
  {
    country: 'Montenegro',
    cities: ['Budva (MSK-1)'],
  },
  {
    country: 'Kazakhstan',
    cities: ['Kostanay (MSK+2)'],
  },
] as const;
