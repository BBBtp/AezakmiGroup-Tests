export const performanceApi = {
  datedRequests: /\/master\/api\/v1\/asa\/(?:filters|performance\/(?:data|chart))(?:\?|$)/,
  expectedDatedRequestPaths: [
    '/master/api/v1/asa/filters',
    '/master/api/v1/asa/performance/data',
    '/master/api/v1/asa/performance/chart',
  ],
} as const;
