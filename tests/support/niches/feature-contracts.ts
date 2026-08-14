export type NicheListItem = {
  name: string;
  profile: 'ASO' | 'WEB_VIEW';
  id: string;
  keywords_count: number;
  countries_count: number;
  created_at: string;
  updated_at: string;
  archive: boolean;
  need_update: boolean;
};

const id = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;

export const archiveNiches = (count: number): NicheListItem[] =>
  Array.from({ length: count }, (_, index) => ({
    name: `Archived automation ${index + 1}`,
    profile: index % 2 === 0 ? 'ASO' : 'WEB_VIEW',
    id: id(index + 1),
    keywords_count: index + 2,
    countries_count: (index % 4) + 1,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-02T00:00:00Z',
    archive: true,
    need_update: false,
  }));

export const activeNiches = (count: number): NicheListItem[] =>
  archiveNiches(count).map((niche, index) => ({
    ...niche,
    name: `Active automation ${index + 1}`,
    archive: false,
  }));

export const archiveNicheData = (niche: NicheListItem) => ({
  niche_id: niche.id,
  profile: niche.profile,
  data: {
    US: [
      {
        keyword: 'archive automation',
        country: 'US',
        keyword_id: 'archive-automation-keyword',
        id: '00000000-0000-4000-8000-100000000001',
        is_brand: false,
        traffic: 1,
      },
    ],
  },
});

export const translationSuccess = (count: number) => ({
  data: {
    translations: Array.from({ length: count }, (_, index) => ({
      translatedText: `автоматический перевод ${index + 1}`,
      detectedSourceLanguage: 'en',
    })),
  },
});

export const apiError = {
  code: 'AUTOMATION_ERROR',
  message: 'Controlled automation failure',
} as const;
