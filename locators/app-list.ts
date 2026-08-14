export const appListLocators = {
  title: 'App list',
  addApp: 'Add app',
  appsTitle: 'Apps',
  emptyTitle: 'No apps added yet',
  emptyDescription: 'You can start by adding the first app',
  search: 'Search',
  periods: ['1 month', '3 months', '6 months'],
  statuses: ['All', 'In line', 'In progress', 'Stopped'],
  teams: ['All', 'Aezakmi', 'AppEmpire'],
  tableHeaders: ['App', 'Status', 'Total convert', 'Convert', 'Subs through trials', 'Period'],
  calendarIconPath: 'button:has(svg path[d^="M21 10H3"])',
  calendarMonths: ['February', 'August'],
  tableRows: 'tbody tr',
  pagination: {
    rows: '10 rows',
    // The frontend currently renders an undefined prefix. Matching the stable semantic suffix
    // keeps pagination usable without coupling the suite to generated CSS-module classes.
    current: '[data-testid$="__cur-page"]',
    next: '[data-testid$="__next-btn"]',
    total: '[data-testid$="__total-pages"]',
  },
  addModal: {
    title: 'Adding app',
    team: 'Team',
    app: 'App',
    addAndStart: 'Add and start',
    add: 'Add',
  },
} as const;

export type AppListPeriod = (typeof appListLocators.periods)[number];
export type AppListCalendarMonth = (typeof appListLocators.calendarMonths)[number];
export type AppListStatus = (typeof appListLocators.statuses)[number];
export type AppListTeam = (typeof appListLocators.teams)[number];
