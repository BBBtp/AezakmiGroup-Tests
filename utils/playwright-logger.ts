import { test, type Locator, type Page } from '@playwright/test';

type Action =
  | 'click'
  | 'dispatchEvent'
  | 'evaluate'
  | 'fill'
  | 'check'
  | 'hover'
  | 'navigate'
  | 'press'
  | 'selectOption'
  | 'uncheck'
  | 'waitFor';

function safeLocator(locator: Locator): string {
  try {
    return locator.toString();
  } catch {
    return '<locator unavailable>';
  }
}

function write(level: 'ACTION' | 'EXPECT' | 'FAIL', message: string): void {
  console.log(`[PW][${level}] ${message}`);
}

function context(page: Page): string {
  return `url="${page.url()}"`;
}

export async function loggedAction<T>(
  page: Page,
  action: Action,
  target: string,
  locator: Locator,
  operation: () => Promise<T>,
): Promise<T> {
  return test.step(`ДЕЙСТВИЕ · ${actionLabel(action)} · ${target}`, async () => {
    const locatorText = safeLocator(locator);
    write('ACTION', `${context(page)} action="${action}" target="${target}" locator="${locatorText}"`);
    try {
      const result = await operation();
      write('ACTION', `${context(page)} action="${action}" target="${target}" result="ok"`);
      return result;
    } catch (error) {
      const actual = await locator
        .count()
        .then((count) => `count=${count}`)
        .catch(() => 'count=<unavailable>');
      write(
        'FAIL',
        `${context(page)} action="${action}" target="${target}" locator="${locatorText}" ${actual} error="${error instanceof Error ? error.message : String(error)}"`,
      );
      throw error;
    }
  });
}

export async function loggedExpectation(
  page: Page,
  target: string,
  locator: Locator,
  expectation: string,
  operation: () => Promise<void>,
): Promise<void> {
  await test.step(`ПРОВЕРКА · ${target} · ${expectation}`, async () => {
    write(
      'EXPECT',
      `${context(page)} target="${target}" locator="${safeLocator(locator)}" expected="${expectation}"`,
    );
    try {
      await operation();
    } catch (error) {
      const state = await locator
        .count()
        .then(async (count) => {
          const visible =
            count > 0
              ? await locator
                  .first()
                  .isVisible()
                  .catch(() => false)
              : false;
          return `count=${count} visible=${visible}`;
        })
        .catch(() => 'state=<unavailable>');
      write(
        'FAIL',
        `${context(page)} target="${target}" locator="${safeLocator(locator)}" ${state} error="${error instanceof Error ? error.message : String(error)}"`,
      );
      throw error;
    }
  });
}

function actionLabel(action: Action): string {
  const labels: Record<Action, string> = {
    click: 'Нажать',
    dispatchEvent: 'Отправить событие',
    evaluate: 'Выполнить в браузере',
    fill: 'Заполнить',
    check: 'Выбрать',
    hover: 'Навести курсор',
    navigate: 'Открыть страницу',
    press: 'Нажать клавишу',
    selectOption: 'Выбрать значение',
    uncheck: 'Снять выбор',
    waitFor: 'Дождаться состояния',
  };
  return labels[action];
}

export function loggedClick(
  page: Page,
  target: string,
  locator: Locator,
  options?: Parameters<Locator['click']>[0],
): Promise<void> {
  return loggedAction(page, 'click', target, locator, () => locator.click(options));
}

export function loggedFill(page: Page, target: string, locator: Locator, value: string): Promise<void> {
  return loggedAction(page, 'fill', target, locator, () => locator.fill(value));
}

export function loggedSelectOption(
  page: Page,
  target: string,
  locator: Locator,
  options: Parameters<Locator['selectOption']>[0],
): Promise<string[]> {
  return loggedAction(page, 'selectOption', target, locator, () => locator.selectOption(options));
}
