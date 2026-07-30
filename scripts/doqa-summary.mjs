import fs from 'node:fs/promises';
import path from 'node:path';
import { DoqaClient } from '../mcp/doqa-client.mjs';

function arg(name, fallback) {
  const value = process.argv.find((item) => item.startsWith(`--${name}=`));
  return value ? value.slice(name.length + 3) : fallback;
}

function duration(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  if (seconds < 60) return `${seconds} с`;
  return `${Math.floor(seconds / 60)} мин ${seconds % 60} с`;
}

function statusLabel(status) {
  return (
    {
      passed: 'Пройден',
      failed: 'Упал',
      broken: 'Сломан',
      blocked: 'Заблокирован',
      skipped: 'Пропущен',
      initial: 'Не запускался',
    }[status] ?? status
  );
}

function errorText(element) {
  const info = element.progressInfo;
  if (!info) return '';
  if (typeof info === 'string') return info;
  return info.error ?? info.message ?? info.details ?? '';
}

function classify(element) {
  const text = errorText(element).toLowerCase();
  if (!text) return 'Требует разбора';
  if (/timeout|locator|expect|selector|navigation|element|playwright/.test(text))
    return 'Вероятно тест/стабильность';
  if (/5\d\d|4\d\d|api|server|internal|backend|database|network/.test(text))
    return 'Вероятно продукт/инфраструктура';
  return 'Требует разбора';
}

function row(element) {
  const title = String(element.title ?? `ТК ${element.viewId}`)
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');
  const error = errorText(element).replaceAll('|', '\\|').replaceAll('\n', ' ').slice(0, 240);
  return `| ${element.viewId ?? '—'} | ${title} | ${statusLabel(element.status)} | ${duration(element.timer?.timeSpent ?? element.averageExecutionTime)} | ${classify(element)}${error ? ` — ${error}` : ''} |`;
}

const runId = Number(arg('run', '312'));
if (!Number.isInteger(runId)) throw new Error('--run must be an integer');
const output = arg('output', path.join('reports', `doqa-run-${runId}.md`));
const client = new DoqaClient();
const [run, elements] = await Promise.all([client.getRun(runId), client.listRunElements(runId)]);
const progress = run.progress ?? {};
const failures = elements.filter((element) => !['passed', 'skipped'].includes(element.status));
const generatedAt = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

const lines = [
  `# Утренняя сводка DoQA — прогон ${run.id}`,
  '',
  `- Название: ${run.title}`,
  `- Статус прогона: **${statusLabel(run.status)}**`,
  `- Сформировано: ${generatedAt} (МСК)`,
  `- Всего тестов: **${run.counts?.tests ?? elements.length}**`,
  `- Результат: ✅ ${progress.passed ?? 0} / ❌ ${progress.failed ?? 0} / 💥 ${progress.broken ?? 0} / ⛔ ${progress.blocked ?? 0} / ⏭️ ${progress.skipped ?? 0}`,
  '',
  failures.length ? `## Требуют разбора (${failures.length})` : '## Ошибки',
  '',
  failures.length
    ? '| ТК | Название | Статус | Время | Предварительная классификация |\n|---:|---|---|---:|---|'
    : 'Ошибок в этом прогоне нет.',
  ...(failures.length ? failures.map(row) : []),
  '',
  '## Рекомендации',
  '',
  failures.length
    ? '- Проверить тестовые логи и вложения; после подтверждения подготовить bug draft только для дефектов продукта.'
    : '- Прогон зелёный; можно брать следующую пачку ТК со статусом «запланировано на автоматизацию».',
  '- Связи DoQA и статусы ТК этим отчётом не изменяются.',
  '',
];

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, lines.join('\n'), 'utf8');
console.log(
  JSON.stringify(
    { runId, status: run.status, tests: elements.length, failures: failures.length, output },
    null,
    2,
  ),
);
