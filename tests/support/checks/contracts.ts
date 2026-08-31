export const checksApi = {
  data: /\/master\/api\/v1\/checks-data(?:\?|$)/,
  empty: { checks: [], total_count: 0 },
} as const;
