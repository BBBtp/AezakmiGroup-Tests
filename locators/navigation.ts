export const dashboardTestIds = {
  page: 'dashboard',
  title: 'dashboard-title__title',
  chart: 'mrr-chart',
  defaultPeriod: 'mrr-chart__header__tabs__7',
  totalMrrCard: 'mrr-cards-0',
  changeCards: [
    'card__top-mrr-day-gain',
    'card__top-mrr-day-loss',
    'card__top-mrr-week-gain',
    'card__top-mrr-week-loss',
    'card__top-mrr-month-gain',
    'card__top-mrr-month-loss',
  ],
  controls: [
    'mrr-chart__header__select-trigger',
    'mrr-chart__header__tabs__7',
    'mrr-chart__header__tabs__30',
    'mrr-chart__header__tabs__84',
    'mrr-chart__filter-btn',
    'mrr-changes-list',
  ],
} as const;

export const dashboardSections = [
  'Keywords',
  'Push',
  'Product',
  'Notifications',
  'Staff',
  'Settings',
] as const;

export const applicationShellLocators = {
  logoutAccessibleName: /log\s*out/i,
  logoutFallbackSelector: 'button[class*="logout"]',
} as const;
