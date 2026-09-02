export type NicheResearchItem = {
  id: string;
  name: string;
  description: string;
  status: 'New' | 'Waiting' | 'Approved' | 'Revision' | 'Rejected';
  category: string[] | null;
  aso_manager: string | null;
  aso_manager_name: string;
  research_id: string | null;
  created_at: string;
  research_created_at: string | null;
};

export const nicheResearchApi = {
  list: /\/master\/api\/v1\/niche-template\/filter$/,
  create: /\/master\/api\/v1\/niche-template$/,
  item: /\/master\/api\/v1\/niche-template\/[0-9a-f-]+$/,
  checkName: /\/master\/api\/v1\/niche-template\/check_name\//,
  managerFilter: /\/master\/api\/v1\/niche-template\/manager_filter(?:\?.*)?$/,
  asoManagers: /\/staff\/api\/v1\/employees\/get_aso_managers$/,
} as const;

const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;

export const nicheResearchItem = (
  index: number,
  overrides: Partial<NicheResearchItem> = {},
): NicheResearchItem => ({
  id: uuid(index + 1),
  name: `Research automation ${index + 1}`,
  description: `Контролируемое описание ${index + 1}`,
  status: 'New',
  category: null,
  aso_manager: null,
  aso_manager_name: '',
  research_id: null,
  created_at: `2026-08-${String(index + 1).padStart(2, '0')}T10:00:00`,
  research_created_at: null,
  ...overrides,
});

export const nicheResearchList = (items: NicheResearchItem[]) => ({
  items,
  total: items.length,
  limit: 10,
  offset: 0,
});
