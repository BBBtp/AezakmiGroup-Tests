export const kpiTestIds = {
  page: 'kpi',
  settingsButton: 'settings-button',
  subtitle: 'subtitle',
  pageSubtitle: 'kpi-page-title__desc',
  errorContent: 'error-content',
  mainContent: 'main-content',
  monthEndWarning: 'month-end-warning',
  monthFilters: {
    root: 'kpi-month-filters',
    activeTabSelector: '[role="tab"][aria-selected="true"]',
  },
  cards: {
    mrr: 'card-mrr',
    score: 'card-score',
    applications: 'card-applications',
  },
  chart: {
    root: 'performance-chart',
    title: 'chart-title',
    tabs: 'chart-tabs',
    scoreTab: 'chart-tabs__Score',
    mrrTab: 'chart-tabs__MRR',
  },
  topEmployees: {
    root: 'top-employees',
    title: 'top-employees__title',
    podium: 'top-employees__podium',
    contenders: 'top-employees__contenders',
    contendersSelector:
      '[data-testid^="contender-"]:not([data-testid*="avatar"]):not([data-testid*="name"]):not([data-testid*="currency"])',
    podiumItem: (index: number) => ({
      root: `podium-${index}`,
      name: `podium-${index}__name`,
      currencySelector: `[data-testid="podium-${index}__currency"] p`,
    }),
    contenderItem: (index: number) => ({
      root: `contender-${index}`,
      name: `contender-${index}__name`,
      currencySelector: `[data-testid="contender-${index}__currency"] p`,
      avatarSelector: `[data-testid="contender-${index}-avatar"] p`,
    }),
  },
  employeesTable: {
    root: 'employees-table__main',
    rowsSelector: 'tbody tr',
    headerSelector: 'thead tr',
    openActionSelector: 'button:has-text("Open"), a:has-text("Open"), [role="button"]:has-text("Open")',
    headers: {
      Score: 'employees-table__header-score',
      MRR: 'employees-table__header-mrr',
      Rating: 'employees-table__header-rating',
      Name: 'employees-table__header-name',
      'Number of apps': 'employees-table__header-numberOfApps',
      'Last modified': 'employees-table__header-lastModified',
    },
    row: (index: number) => ({
      rating: `employees-table__rating-${index}`,
      avatarSelector: `[data-testid="employees-table__avatar-${index}"] p`,
      name: `employees-table__avatar-${index}-title`,
      sublink: `employees-table__avatar-${index}-sublink`,
      score: `employees-table__score-${index}`,
      mrr: `employees-table__mrr-${index}`,
      appsNumber: `employees-table__apps-number-${index}`,
      lastModified: `employees-table__last-modified-${index}`,
    }),
  },
} as const;

export const kpiManagerText = {
  settingsLink: 'Settings',
  startingScore: 'Starting score',
  vacationTitle: 'Vacation and KPI score',
  vacationDescription: 'Impact of employee vacation on minimum rating.',
  settingsHeaders: ['Month', 'Starting score', 'Minimal score', 'Sufficient score', 'Vacation'],
} as const;
