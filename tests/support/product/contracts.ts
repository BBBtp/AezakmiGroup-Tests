export const appsApi = {
  data: /\/master\/api\/v1\/apps-data(?:\?|$)/,
  emptyData: [],
} as const;

export const abTestsApi = {
  list: /\/master\/api\/v1\/ab-tests(?:\?|$)/,
  emptyList: { ab_tests: [], total_count: 0 },
} as const;
