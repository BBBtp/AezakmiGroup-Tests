export const vacationText = {
  planVacation: 'Plan a vacation',
  planningDialog: 'Planning a vacation',
  testEmployee: 'Test Testov',
  startDate: 'Start date',
  endDate: 'End date',
  datePlaceholder: 'DD.MM.YYYY',
  submit: 'Add',
} as const;

export const vacationLocators = {
  dateInputSelector: '[data-testid$="__input-date"]',
  datePicker: {
    monthButton: '[data-testid$="__date-picker__header__month-btn"]',
    yearButton: '[data-testid$="__date-picker__header__year-btn"]',
    previousButton: '[data-testid$="__date-picker__header__prev-btn"]',
    nextButton: '[data-testid$="__date-picker__header__next-btn"]',
    monthOption: (index: number) => `[data-testid$="__date-picker__header__month-${index}"]`,
  },
  yearNavigator: {
    label: 'p',
    previousButton: 'button:has(svg path[d="m15 18-6-6 6-6"])',
    nextButton: 'button:has(svg path[d="m9 18 6-6-6-6"])',
  },
  // Wizard arrows have no accessible names or stable test IDs; the final dialog button is Next.
  wizardButtonsSelector: 'button',
} as const;
