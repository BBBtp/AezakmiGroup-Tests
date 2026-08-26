export const statisticsApi = {
  chart: /\/master\/api\/v1\/chart(?:\?|$)/,
  emptyChart: {
    success_rate: {
      data: {},
      number_of_days: 0,
      summary: { total: 0, absolute: 0, percentage: 0 },
    },
  },
} as const;
