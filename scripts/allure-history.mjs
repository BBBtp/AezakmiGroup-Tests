import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const allureHistoryFiles = [
  'history.json',
  'history-trend.json',
  'duration-trend.json',
  'retry-trend.json',
  'retries-trend.json',
  'categories-trend.json',
];

export async function restoreAllureHistory({ cacheDir, resultsDir }) {
  const source = path.resolve(cacheDir);
  const destination = path.resolve(resultsDir, 'history');
  if (!(await isDirectory(source))) return { restored: false, files: [] };
  const files = await validateHistoryDirectory(source);
  if (files.length === 0) return { restored: false, files: [] };
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
  return { restored: true, files };
}

export async function stageAllureHistory({ reportDir, cacheDir }) {
  const source = path.resolve(reportDir, 'history');
  if (!(await isDirectory(source))) throw new Error('Generated Allure report has no history directory');
  const files = await validateHistoryDirectory(source);
  if (!files.includes('history.json') || !files.includes('history-trend.json')) {
    throw new Error('Generated Allure history is missing required history files');
  }
  const destination = path.resolve(cacheDir);
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await cp(source, destination, { recursive: true });
  return { staged: true, files };
}

async function validateHistoryDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && allureHistoryFiles.includes(entry.name))
    .map((entry) => entry.name)
    .sort();
  for (const file of files) {
    const content = await readFile(path.join(directory, file), 'utf8');
    JSON.parse(content);
  }
  return files;
}

async function isDirectory(target) {
  try {
    return (await stat(target)).isDirectory();
  } catch {
    return false;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const action = process.argv[2];
  const options = {
    cacheDir: process.env.ALLURE_HISTORY_DIR || '.allure-history',
    resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results',
    reportDir: process.env.ALLURE_REPORT_DIR || 'allure-report',
  };
  const result =
    action === 'restore'
      ? await restoreAllureHistory(options)
      : action === 'stage'
        ? await stageAllureHistory(options)
        : (() => {
            throw new Error('Expected allure-history action: restore or stage');
          })();
  console.log(JSON.stringify(result));
}
