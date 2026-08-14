export const asoMobileFixture = {
  nicheId: 'front-136-niche',
  nicheName: 'FRONT-136 automation niche',
  geo: 'US',
  appStoreUrl: 'https://apps.apple.com/us/app/front-136/id1234567890',
  createdApp: {
    name: 'FRONT-136 SSE App',
    apple_id: '1234567890',
    aso_mobile_id: 'front-136-aso-mobile',
    icon_url: 'https://example.test/front-136.png',
    id: 'front-136-app',
    keywords_count: { US: 1 },
  },
} as const;

export const asoMobileNichesResponse = [
  {
    id: asoMobileFixture.nicheId,
    name: asoMobileFixture.nicheName,
    keywords_count: 1,
    countries_count: 1,
    created_at: '2026-08-12T00:00:00Z',
    updated_at: '2026-08-12T00:00:00Z',
    profile: 'ASO',
    archive: false,
    need_update: false,
  },
] as const;

export const asoMobileNicheDataResponse = {
  niche_id: asoMobileFixture.nicheId,
  profile: 'ASO',
  data: {
    US: [
      {
        keyword_id: null,
        keyword: 'front 136 automation',
        country: 'US',
        id: 'front-136-keyword',
        is_brand: false,
        traffic: 1,
      },
    ],
  },
} as const;

export const asoMobileSseError = {
  correlation_id: 'front-136-error',
  code: 'ASO_MOBILE_CREATE_FAILED',
  message: 'Unable to create app',
  details: { reason: 'Synthetic E2E failure' },
} as const;
