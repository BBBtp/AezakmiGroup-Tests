export const pushBotsApi = {
  campaigns: /\/master\/api\/v1\/push\/campaigns(?:\?|$)/,
  mutation: /\/master\/api\/v1\/push\//,
  emptyCampaigns: { total_count: 0, data: [] },
} as const;

export const outKeywordsApi = {
  apps: /\/master\/api\/v1\/push\/out-keywords\/apps(?:\?|$)/,
  mutation: /\/push\/out-keywords/,
  emptyApps: { total_count: 0, data: [] },
} as const;
