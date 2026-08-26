const emptyMetric = {
  data: {},
  number_of_days: 0,
  summary: { total: 0, absolute: 0, percentage: 0 },
} as const;

export const dashboardApi = {
  chart: /\/master\/api\/v1\/chart(?:\?|$)/,
  emptyChart: {
    mrr: emptyMetric,
    asa_mrr: emptyMetric,
    aso_mrr: emptyMetric,
  },
} as const;
