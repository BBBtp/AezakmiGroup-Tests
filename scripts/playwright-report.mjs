export function analyzePlaywrightReport(reportData) {
  const testCases = collectTestCases(reportData);
  const counts = { passed: 0, failed: 0, skipped: 0, interrupted: 0, other: 0 };
  const flaky = [];

  for (const testCase of testCases) {
    const statuses = testCase.results.map((result) => result.status).filter(Boolean);
    const lastStatus = statuses.at(-1) ?? 'other';
    const isFlaky =
      statuses.length > 1 &&
      lastStatus === 'passed' &&
      statuses.slice(0, -1).some((status) => !['passed', 'skipped'].includes(status));
    if (isFlaky) flaky.push({ title: testCase.title, statuses });
    if (lastStatus === 'passed') counts.passed += 1;
    else if (['failed', 'timedOut'].includes(lastStatus)) counts.failed += 1;
    else if (lastStatus === 'skipped') counts.skipped += 1;
    else if (lastStatus === 'interrupted') counts.interrupted += 1;
    else counts.other += 1;
  }

  return { tests: testCases.length, counts, flaky };
}

function collectTestCases(value, titlePath = []) {
  if (Array.isArray(value)) return value.flatMap((item) => collectTestCases(item, titlePath));
  if (!value || typeof value !== 'object') return [];
  const nextPath =
    typeof value.title === 'string' && value.title.trim() ? [...titlePath, value.title.trim()] : titlePath;
  if (Array.isArray(value.results)) {
    return [{ title: nextPath.join(' › ') || 'Unnamed test', results: value.results }];
  }
  return Object.entries(value)
    .filter(([key]) => key !== 'results')
    .flatMap(([, child]) => collectTestCases(child, nextPath));
}
