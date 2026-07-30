export const kpiTestIds = {
  page: 'kpi',
  settingsButton: 'settings-button',
  subtitle: 'subtitle',
  pageSubtitle: 'kpi-page-title__desc',
  errorContent: 'error-content',
  mainContent: 'main-content',
  monthEndWarning: 'month-end-warning',
  settings: {
    page: 'kpi-settings',
    loading: 'kpi-settings-loading',
    breadcrumbs: 'bread-crumbs',
    deleteConfirm: 'delete-item__del-btn',
    deleteCancel: 'delete-item__cancel-btn',
  },
} as const;

export const kpiManagerText = {
  startingScore: 'Starting score',
  vacationTitle: 'Vacation and KPI score',
  vacationDescription: 'Impact of employee vacation on minimum rating.',
  settingsHeaders: ['Month', 'Starting score', 'Minimal score', 'Sufficient score', 'Vacation'],
} as const;
