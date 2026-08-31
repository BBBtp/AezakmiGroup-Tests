import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { taskGeneratorLocators } from '@locators/task-generator';

export class TaskGeneratorComponent extends UiObject {
  readonly root: Locator;
  readonly form: Locator;
  readonly countInput: Locator;
  readonly commentInput: Locator;
  readonly generateButton: Locator;
  readonly search: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main').first();
    this.form = this.locate.testId(taskGeneratorLocators.form);
    this.countInput = this.locate.testId(taskGeneratorLocators.countInput);
    this.commentInput = this.locate.testId(taskGeneratorLocators.commentInput);
    this.generateButton = this.locate.testId(taskGeneratorLocators.generateButton);
    this.search = this.locate.testId(taskGeneratorLocators.search);
    this.table = this.locate.testId(taskGeneratorLocators.table);
    this.rows = this.locate.css(taskGeneratorLocators.rows);
  }

  async expectLoaded(): Promise<void> {
    await this.expectations.visible('страница Task generator', this.root);
    await this.expectations.visible('форма генерации технического задания', this.form);
    await this.expectations.visible('поле количества задач', this.countInput);
    await this.expectations.visible('поле комментария', this.commentInput);
    await this.expectations.visible('кнопка Generate', this.generateButton);
    await this.expectations.visible(
      'история генераций',
      this.locate.within(this.root).text(taskGeneratorLocators.historyTitle, { exact: true }),
    );
    await this.expectations.notContainsText(
      'страница без технических значений',
      this.root,
      taskGeneratorLocators.technicalValue,
    );
  }

  async expectSearchFiltersRows(): Promise<void> {
    await this.expectations.nonEmpty('строки истории генераций', this.rows);
    const firstName = (await this.locate.testId(taskGeneratorLocators.firstName).innerText()).trim();
    const query = firstName.slice(0, Math.min(firstName.length, 5));
    await this.actions.fill('поиск по части названия задачи', this.search, query);
    await this.expectations.containsText('отфильтрованная история генераций', this.table, query);
    await this.actions.fill('очистка поиска задач', this.search, '');
    await this.expectations.nonEmpty('восстановленная история генераций', this.rows);
  }

  async fillGenerateForm(count: string, comment = ''): Promise<void> {
    await this.actions.fill('количество технических заданий', this.countInput, count);
    await this.actions.fill('комментарий к генерации', this.commentInput, comment);
  }

  async submitGenerate(): Promise<void> {
    await this.actions.click('кнопка Generate', this.generateButton);
  }

  async expectInvalidCounts(): Promise<void> {
    for (const value of ['', '0', '-1', '100000']) {
      await this.actions.fill('невалидное количество задач', this.countInput, value);
      await this.expectations.disabled(
        `Generate недоступен для значения ${value || 'пусто'}`,
        this.generateButton,
      );
    }
    await this.actions.fill('валидное количество задач', this.countInput, '1');
    await this.expectations.enabled('Generate доступен для одной задачи', this.generateButton);
  }

  async expectDraftResetAfterReload(): Promise<void> {
    await this.fillGenerateForm('1', 'Несохранённый тестовый черновик');
    await this.expectations.value(
      'введённый комментарий',
      this.commentInput,
      'Несохранённый тестовый черновик',
    );
    await this.actions.run('navigate', 'обновление страницы без сохранения', this.root, () =>
      this.page.reload(),
    );
    await this.expectLoaded();
    await this.expectations.value('пустой комментарий после обновления', this.commentInput, '');
  }

  async expectSelection(): Promise<void> {
    const first = this.locate.testId(taskGeneratorLocators.firstCheckbox);
    const selectAll = this.locate.testId(taskGeneratorLocators.selectAll);
    await this.actions.click('checkbox первой строки', first);
    await this.expectations.attribute('выбранная первая строка', first, 'data-state', 'checked');
    await this.actions.click('checkbox выбора всех строк', selectAll);
    await this.expectations.attribute('выбраны все видимые строки', selectAll, 'data-state', 'checked');
  }

  async expectDocumentActions(): Promise<void> {
    const actions = this.locate.css(taskGeneratorLocators.docxActions);
    await this.expectations.countAtLeast('docx-действия в строках', actions, 2);
    await this.expectations.visible('docx-действие первой строки', actions.first());
    await this.expectations.visible('docx-действие второй строки', actions.nth(2));
  }

  async sortByDate(): Promise<void> {
    const sort = this.locate.testId(taskGeneratorLocators.dateSort);
    await this.actions.click('сортировка истории по Date', sort);
    await this.expectations.visible('таблица после сортировки Date', this.table);
    await this.expectations.nonEmpty('строки после сортировки Date', this.rows);
  }

  async expectEmpty(): Promise<void> {
    await this.expectations.count('строки истории отсутствуют', this.rows, 0);
    await this.expectations.notContainsText(
      'пустая страница без технических значений',
      this.root,
      taskGeneratorLocators.technicalValue,
    );
  }

  async expectErrorState(): Promise<void> {
    await this.expectations.visible('страница остаётся доступной при ошибке API', this.root);
    await this.expectations.count('частичные строки при ошибке скрыты', this.rows, 0);
    await this.expectations.notContainsText(
      'ошибка без технических значений',
      this.root,
      taskGeneratorLocators.technicalValue,
    );
  }
}
