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

export const employeeListLocators = {
  title: 'Employees',
  description: 'The page contains a list of company employees',
  archive: 'Archive',
  settings: 'Settings',
  create: 'Create employee',
  filters: 'Filters',
  search: 'Search',
  timeZone: 'Time zone',
  more: 'More',
  rows: /^employees-\d+-table-row$/,
  employeeLinks: /^employees-\d+-employee-link$/,
  currentPage: /__cur-page$/,
  nextPage: /__next-btn$/,
  previousPage: /__prev-btn$/,
  loading: '[aria-busy="true"], [data-loading="true"], [class*="skeleton"]',
  emptyTitle: 'Nothing fits the specified filters',
  emptyDescription: 'Try setting up your filters differently',
  resetFilters: 'Reset filters',
  errorTitle: 'Something went wrong',
  errorDescription: 'Please try your request again or check back later',
  retry: 'Repeat the request',
  technicalValue: /\b(?:error-content|undefined|NaN|null)\b|\[object Object\]/i,
} as const;

export const employeeDetailsLocators = {
  detailsButton: 'Details',
  vacationBreadcrumb: 'Vacation',
  vacationHistory: {
    title: 'Vacation history',
    editAction: 'Edit',
    deleteAction: 'Delete',
    row: 'tbody tr',
  },
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
