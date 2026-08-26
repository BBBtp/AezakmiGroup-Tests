export const suggestsApi = {
  list: /\/master\/api\/v1\/suggestions(?:\?|$)/,
  emptyList: { suggestions: [], total_count: 0 },
} as const;
