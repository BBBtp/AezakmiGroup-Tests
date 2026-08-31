export const appsApi = {
  data: /\/master\/api\/v1\/apps-data(?:\?|$)/,
  emptyData: [],
} as const;

export const abTestsApi = {
  list: /\/master\/api\/v1\/ab-tests(?:\?|$)/,
  prepareTask: /\/master\/api\/v1\/ab-tests\/prepare-task(?:\?|$)/,
  emptyList: { ab_tests: [], total_count: 0 },
} as const;

const imageUrl = (name: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="240"><title>${name}</title><rect width="120" height="240" fill="%234f7cff"/></svg>`)}`;

export function abTestListResponse(options: {
  name: string;
  appName?: string;
  nicheId?: string | null;
  screenshotCount?: number;
  pValues?: number | null;
}) {
  const screenshotCount = options.screenshotCount ?? 3;
  const statistics = {
    arpu: 0.1,
    view_to_action: 0.1,
    view_to_trial: 0.1,
    view_to_purchase: 0.1,
    proceeds: 0.1,
    unique_views: 0.1,
    p_arpu: options.pValues ?? null,
    p_view_to_action: options.pValues ?? null,
    p_view_to_trial: options.pValues ?? null,
    p_view_to_purchase: options.pValues ?? null,
  };
  const abTestId = '00000000-0000-4000-8000-000000001048';

  return {
    ab_tests: [
      {
        apphud_app_id: '00000000-0000-4000-8000-000000001049',
        niche_id: options.nicheId ?? null,
        name: options.name,
        test_type: 'onboardings',
        sentiment: 'negative',
        apphud_url: null,
        figma_url: null,
        units: ['Current', 'Var #1'].map((name, index) => ({
          name,
          is_current: index === 0,
          index,
          image_urls: {
            icon_url: null,
            screenshot_urls: Array.from({ length: screenshotCount }, (_, imageIndex) =>
              imageUrl(`variant-${index + 1}-image-${imageIndex + 1}`),
            ),
          },
          statistics,
          id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
          ab_test_id: abTestId,
        })),
        tech_spec: '',
        comment: 'Контролируемый комментарий теста',
        id: abTestId,
        winner_id: null,
        created_at: '2025-06-30T17:29:55.976372',
        updated_at: '2025-06-30T17:29:55.976372',
        apphud_app_data: {
          id: '00000000-0000-4000-8000-000000001049',
          name: options.appName ?? 'ID 153 Test application',
          icon_url: imageUrl('app-logo'),
          apple_id: '6444708950',
          from_our_dash: true,
        },
      },
    ],
    total_count: 1,
  };
}
