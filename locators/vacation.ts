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
  dateInputSelector: 'input[placeholder="DD.MM.YYYY"]',
  // Wizard arrows have no accessible names or stable test IDs; the final dialog button is Next.
  wizardButtonsSelector: 'button',
} as const;
