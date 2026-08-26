export const employeesApi = {
  list: /\/staff\/api\/v1\/employees(?:\?|$)/,
  emptyList: { total_count: 0, data: [] },
} as const;
