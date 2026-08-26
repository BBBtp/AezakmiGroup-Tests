export const topKeywordsApi = {
  groups: /\/master\/api\/v1\/top-keywords\/groups(?:\?|$)/,
  emptyGroups: { top_keywords_list: [], total_count: 0 },
} as const;
