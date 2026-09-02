import { pathToFileURL } from 'node:url';

export const regressionCategories = {
  authorization: [
    'tests/regression/access-control.regression.spec.ts',
    'tests/regression/auth-ui.regression.spec.ts',
    'tests/regression/functionality.regression.spec.ts',
    'tests/regression/session.regression.spec.ts',
    'tests/regression/validation.regression.spec.ts',
  ],
  keywords: [
    'tests/regression/checks-keywords.regression.spec.ts',
    'tests/regression/checks.regression.spec.ts',
    'tests/regression/niches-actions.regression.spec.ts',
    'tests/regression/niches-archive.regression.spec.ts',
    'tests/regression/niches-export.regression.spec.ts',
    'tests/regression/niches-management.regression.spec.ts',
    'tests/regression/niches-translation.regression.spec.ts',
    'tests/regression/out-keywords.regression.spec.ts',
    'tests/regression/suggests.regression.spec.ts',
    'tests/regression/top-keywords.regression.spec.ts',
  ],
  product: [
    'tests/regression/ab-tests.regression.spec.ts',
    'tests/regression/apps.regression.spec.ts',
    'tests/regression/aso-mobile.regression.spec.ts',
    'tests/regression/net-profit-predict.regression.spec.ts',
    'tests/regression/parameters.regression.spec.ts',
  ],
  asa: [
    'tests/regression/app-list.regression.spec.ts',
    'tests/regression/performance-calendar.regression.spec.ts',
    'tests/regression/performance.regression.spec.ts',
  ],
  statistics: [
    'tests/regression/statistics.regression.spec.ts',
    'tests/regression/subscriptions-design.regression.spec.ts',
    'tests/regression/subscriptions.regression.spec.ts',
  ],
  kpi: [
    'tests/regression/kpi-settings-ui.regression.spec.ts',
    'tests/regression/kpi-settings.regression.spec.ts',
    'tests/regression/kpi-staff-api.regression.spec.ts',
    'tests/regression/kpi-ui.regression.spec.ts',
    'tests/regression/kpi.regression.spec.ts',
  ],
  employees: [
    'tests/regression/employee-cities.regression.spec.ts',
    'tests/regression/employees-list.regression.spec.ts',
  ],
  'push-reviews': [
    'tests/regression/push-bots.regression.spec.ts',
    'tests/regression/reviews.regression.spec.ts',
  ],
  'task-generator': ['tests/regression/task-generator.regression.spec.ts'],
  'niche-research': [
    'tests/regression/niche-research-access.regression.spec.ts',
    'tests/regression/niche-research-controls.regression.spec.ts',
    'tests/regression/niche-research-crud.regression.spec.ts',
    'tests/regression/niche-research-integration.regression.spec.ts',
    'tests/regression/niche-research-researched.regression.spec.ts',
    'tests/regression/niche-research-states.regression.spec.ts',
    'tests/regression/niche-research-table.regression.spec.ts',
    'tests/regression/niche-research-visual.regression.spec.ts',
  ],
};

export function resolveTestSelection({ category = 'all', testIds = '', testGrep = '' }) {
  const ids = parseTestIds(testIds);
  if (ids.length > 0) {
    return {
      mode: 'test-ids',
      filtered: true,
      files: [],
      grep: `\\[TC-(${ids.join('|')})\\]`,
      ids,
    };
  }
  if (testGrep.trim()) {
    return { mode: 'grep', filtered: true, files: [], grep: testGrep.trim(), ids: [] };
  }
  if (category === 'all' || !category) {
    return { mode: 'all', filtered: false, files: [], grep: '', ids: [] };
  }
  const files = regressionCategories[category];
  if (!files) throw new Error(`Unknown regression category: ${category}`);
  return { mode: 'category', filtered: true, files, grep: '', ids: [] };
}

function parseTestIds(value) {
  const tokens = value
    .split(/[\s,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const ids = tokens.map((token) => {
    const match = token.match(/^(?:TC-)?(\d+)$/i);
    if (!match) throw new Error(`Invalid test ID: ${token}`);
    return match[1];
  });
  return [...new Set(ids)].sort((left, right) => Number(left) - Number(right));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const selection = resolveTestSelection({
    category: process.env.TEST_CATEGORY,
    testIds: process.env.TEST_IDS,
    testGrep: process.env.TEST_GREP,
  });
  const output = process.env.GITHUB_OUTPUT;
  if (output) {
    const { appendFile } = await import('node:fs/promises');
    await appendFile(
      output,
      [
        `mode=${selection.mode}`,
        `filtered=${selection.filtered}`,
        `grep=${selection.grep}`,
        `files=${selection.files.join(' ')}`,
      ].join('\n') + '\n',
    );
  } else {
    console.log(JSON.stringify(selection));
  }
}
