export const reviewsApi = {
  list: /\/master\/api\/v1\/reviews(?:\?|$)/,
  emptyList: { reviews: [], total_count: 0 },
} as const;
