export const statisticsTestIds = {
  page: 'statistics',
  title: 'statistics-title__title',
  chart: 'success-rate-chart',
  periodTabs: {
    week: 'success-rate-chart__header__tabs__7',
    month: 'success-rate-chart__header__tabs__30',
    threeMonths: 'success-rate-chart__header__tabs__84',
  },
  calendarButton: 'success-rate-chart__header__calendar-btn',
  filtersButton: 'success-rate-chart-filters-button',
} as const;

export const topKeywordsTestIds = {
  page: 'keywords-page',
  title: 'keywords-page-title__title',
  table: 'keywords-table',
  countryTabs: {
    all: 'keywords-country-tabs__all',
    usa: 'keywords-country-tabs__usa',
    english: 'keywords-country-tabs__english',
    europe: 'keywords-country-tabs__europe',
    latin: 'keywords-country-tabs__latin',
    asia: 'keywords-country-tabs__asia',
  },
  stateTabs: {
    all: 'keywords-filter-tabs__all',
    new: 'keywords-filter-tabs__new',
    returned: 'keywords-filter-tabs__old',
  },
  datePickerButton: 'keywords-date-picker-btn',
} as const;

export const suggestsTestIds = {
  page: 'suggests-page',
  title: 'suggests-page-title__title',
  table: 'suggests-table',
  dateTabs: {
    all: 'suggests-date-tabs__all',
    today: 'suggests-date-tabs__0',
    yesterday: 'suggests-date-tabs__1',
  },
  datePickerButton: 'suggests-date-picker-btn',
} as const;

export const nichesTestIds = {
  page: 'niches-page',
  actions: 'niches-page__buttons-block',
  refreshNewButton: 'refresh-new-button',
  refreshAllButton: 'refresh-all-button',
  createAsoMobileAppButton: 'create-asomobile-app-button',
  createNicheButton: 'create-new-niche-button',
  tabs: 'niches-tabs',
  nicheListTab: 'niches-tabs__nicheList',
  appListTab: 'niches-tabs__appList',
  nicheList: 'niche-list',
  nicheListTable: 'niche-list-table',
  listTitle: 'niche-list-header-bar__title',
  sortLabel: 'niche-list-header-bar__label__title',
} as const;
