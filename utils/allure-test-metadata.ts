import type { TestInfo } from '@playwright/test';
import { allure } from 'allure-playwright';
import path from 'node:path';

const testCaseTitle = /^\[TC-(\d+)\]\s+(.+)$/u;

export async function configureAllureTestMetadata(testInfo: TestInfo): Promise<void> {
  const match = testInfo.title.match(testCaseTitle);
  if (!match) return;

  const [, caseId, purpose] = match;
  const titlePath = testInfo.titlePath.filter(Boolean);
  const suite = titlePath.at(-2) ?? 'CRM';
  const relativeFile = path.relative(process.cwd(), testInfo.file);
  const level = testInfo.project.name.includes('smoke') ? 'smoke' : 'regression';

  await allure.description(
    [
      `## Цель`,
      purpose,
      '',
      `## Контекст`,
      `- **Тест-кейс:** TC-${caseId}`,
      `- **Функциональность:** ${suite}`,
      `- **Набор:** ${level}`,
      `- **Проект запуска:** ${testInfo.project.name}`,
      `- **Реализация:** \`${relativeFile}\``,
      '',
      `## Предусловия`,
      `1. CRM доступна по адресу окружения запуска.`,
      `2. Пользовательская сессия и тестовые данные подготовлены в соответствии с проектом \`${testInfo.project.name}\`.`,
      `3. Контролируемые API-ответы и компенсационная очистка настраиваются до пользовательских действий.`,
      '',
      `## Сценарий`,
      `1. **Подготовка** — подготовить сессию, данные и сетевые предусловия.`,
      `2. **Действие** — выполнить пользовательские действия через публичные методы доменного модуля.`,
      `3. **Проверка** — проверить наблюдаемый бизнес-результат без прямого доступа теста к локаторам.`,
      '',
      `## Ожидаемый результат`,
      purpose,
    ].join('\n'),
  );
  await allure.labels(
    { name: 'parentSuite', value: 'CRM' },
    { name: 'suite', value: suite },
    { name: 'subSuite', value: level },
    { name: 'epic', value: 'CRM' },
    { name: 'feature', value: suite },
    { name: 'story', value: purpose },
    { name: 'owner', value: 'QA Automation' },
    { name: 'severity', value: 'normal' },
    { name: 'layer', value: 'e2e' },
    ...['CRM', 'E2E', level, testInfo.project.name, suite].map((value) => ({
      name: 'tag',
      value,
    })),
  );
}
