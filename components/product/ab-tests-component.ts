import type { Locator, Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { productLocators } from '@locators/product';

type AbTestFilterDefinition = (typeof productLocators.abTests.filter.definitions)[number];

export class AbTestsComponent extends UiObject {
  readonly root: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main');
  }

  async expectLoaded(): Promise<void> {
    const within = this.locate.within(this.root);
    await this.expectations.visible('A/B tests: main', this.root);
    await this.expectations.visible(
      'A/B tests: title',
      within.text(productLocators.abTests.title, { exact: true }),
    );
    await this.expectations.visible(
      'A/B tests: Create test',
      within.role('link', { name: productLocators.abTests.create, exact: true }),
    );
    for (const control of [
      productLocators.abTests.filters,
      productLocators.abTests.team,
      productLocators.abTests.app,
      productLocators.abTests.testType,
    ]) {
      await this.expectations.visible(
        `A/B tests: ${String(control)}`,
        within.role('button', { name: control }),
      );
    }
    await this.expectations.visible(
      'A/B tests: Search',
      within.css(`input[placeholder="${productLocators.abTests.searchPlaceholder}"]`),
    );
    await this.expectations.notContainsText(
      'A/B tests: no technical values',
      this.root,
      productLocators.technicalValue,
    );
  }

  async openFilter(name: 'Team' | 'App' | 'Test type'): Promise<void> {
    const matcher = name === 'Team' ? productLocators.abTests.team : name;
    await this.actions.click(
      `A/B tests: open ${name}`,
      this.locate.within(this.root).role('button', { name: matcher }),
    );
    await this.expectations.visible(
      `A/B tests: ${name} filter actions`,
      this.locate.role('button', { name: 'Apply', exact: true }),
    );
    await this.actions.press(
      `A/B tests: close ${name}`,
      this.locate.within(this.root).role('button', { name: matcher }),
      'Escape',
    );
  }

  async expectFilterAutofocusAndSelectAllOrder(): Promise<void> {
    for (const definition of productLocators.abTests.filter.definitions.filter(
      (filter) => filter.multiSelect,
    )) {
      await this.ensureFilterVisible(definition);
      const trigger = this.locate.css(`[data-testid$="${definition.key}__trigger"]`);
      const content = this.locate.css(`[data-testid$="${definition.key}__content"]:visible`);
      if (!(await content.isVisible())) {
        await this.actions.click(`A/B tests: open ${definition.name} filter`, trigger);
      }
      const selectAll = this.locate.css(`[data-testid$="${definition.key}__option-all"]`);
      const selectAllCheckbox = this.locate.css(
        `[data-testid$="${definition.key}__option-all__checkbox-checkbox"]`,
      );
      await this.expectations.visible(`A/B tests: ${definition.name} popover`, content);
      if (definition.hasSearch) {
        await this.expectations.focused(
          `A/B tests: ${definition.name} Search autofocus`,
          this.locate.css(`[data-testid$="${definition.key}__search-input"]`),
        );
      }
      await this.expectSelectAllFirst(definition);

      if ((await selectAllCheckbox.getAttribute('aria-checked')) !== 'true') {
        await this.actions.click(`A/B tests: select all ${definition.name}`, selectAllCheckbox);
      }
      await this.expectations.attribute(
        `A/B tests: all ${definition.name} values selected`,
        selectAllCheckbox,
        'aria-checked',
        'true',
      );
      await this.expectSelectAllFirst(definition);

      await this.actions.click(`A/B tests: clear all ${definition.name}`, selectAllCheckbox);
      const checkboxes = this.locate.within(content).role('checkbox');
      // Select all is the first checkbox by contract; the next two are stable business samples.
      await this.expectations.countAtLeast(
        `A/B tests: ${definition.name} has partial-selection samples`,
        checkboxes,
        3,
      );
      for (const index of [1, 2]) {
        const checkbox = checkboxes.nth(index);
        await this.actions.click(`A/B tests: partially select ${definition.name} option ${index}`, checkbox);
        await this.expectations.attribute(
          `A/B tests: ${definition.name} option ${index} selected`,
          checkbox,
          'aria-checked',
          'true',
        );
      }
      await this.expectSelectAllFirst(definition);
      await this.actions.click(`A/B tests: close ${definition.name} filter`, trigger);
      await this.expectations.hidden(`A/B tests: ${definition.name} popover closed`, selectAll);
    }
  }

  async goToPage(pageNumber: number): Promise<void> {
    if (pageNumber < 1) throw new Error('A/B tests page number must be positive');
    const currentPage = this.locate.testId(productLocators.abTests.pagination.currentPage);
    const nextPage = this.locate.testId(productLocators.abTests.pagination.nextPage);
    await this.expectations.text('A/B tests: starts on first page', currentPage, '1');
    for (let page = 2; page <= pageNumber; page += 1) {
      await this.actions.click(`A/B tests: open page ${page}`, nextPage);
      await this.expectations.text(`A/B tests: current page ${page}`, currentPage, String(page));
    }
  }

  async applySingleAppFilterAndExpectFirstPage(): Promise<void> {
    const definition = productLocators.abTests.filter.definitions.find((filter) => filter.name === 'App');
    if (!definition) throw new Error('A/B tests App filter contract is missing');
    const trigger = this.locate.testId(productLocators.abTests.filter.trigger(definition.key));
    await this.actions.click('A/B tests: open App filter for pagination reset', trigger);
    const content = this.locate.testId(productLocators.abTests.filter.content(definition.key));
    const checkboxes = this.locate.within(content).role('checkbox');
    await this.expectations.countAtLeast('A/B tests: App filter has a business option', checkboxes, 2);

    const selectAll = checkboxes.first();
    if ((await selectAll.getAttribute('aria-checked')) === 'true') {
      await this.actions.click('A/B tests: clear all Apps before selecting one', selectAll);
    }
    const firstApp = checkboxes.nth(1);
    if ((await firstApp.getAttribute('aria-checked')) !== 'true') {
      await this.actions.click('A/B tests: select first App', firstApp);
    }
    await this.actions.click(
      'A/B tests: apply single App filter',
      this.locate.testId(productLocators.abTests.filter.apply(definition.key)),
    );
    await this.expectations.text(
      'A/B tests: filter resets pagination to page 1',
      this.locate.testId(productLocators.abTests.pagination.currentPage),
      '1',
    );
    await this.expectations.nonEmpty('A/B tests: filtered rows are visible', this.appLinks);
  }

  async expectExpandedRowPreservedWhenShowChanges(rows: 30): Promise<void> {
    const row = this.firstRow;
    const rowButtons = this.locate.within(row).role('button');
    await this.expectations.countAtLeast('A/B tests: row actions', rowButtons, 3);
    await this.actions.click(
      'A/B tests: expand first row',
      rowButtons.nth(productLocators.abTests.row.expandActionIndex),
    );
    await this.expectVariantTable(row);

    const rowsPerPage = this.locate.testId(productLocators.abTests.pagination.rowsPerPage);
    await this.actions.click(`A/B tests: open Show ${rows}`, rowsPerPage);
    await this.actions.click(
      `A/B tests: select Show ${rows}`,
      this.locate.testId(productLocators.abTests.pagination.rowsPerPageOption(rows)),
    );
    await this.expectations.containsText(`A/B tests: Show ${rows} applied`, rowsPerPage, `${rows} tests`);
    await this.expectVariantTable(this.firstRow);
  }

  async expectLongCommentAndTechnicalTaskModals(): Promise<void> {
    const rowButtons = this.locate.within(this.firstRow).role('button');
    await this.expectations.countAtLeast('A/B tests: first row modal actions', rowButtons, 3);
    await this.actions.click(
      'A/B tests: open long Comment',
      rowButtons.nth(productLocators.abTests.row.commentActionIndex),
    );
    await this.expectScrollableTextModal('Comment');
    await this.actions.press('A/B tests: close Comment', this.locate.role('dialog'), 'Escape');

    await this.actions.click(
      'A/B tests: open first row actions',
      rowButtons.nth(productLocators.abTests.row.menuActionIndex),
    );
    await this.actions.click(
      'A/B tests: open Technical task',
      this.locate.role('button', { name: productLocators.abTests.row.viewTask, exact: true }),
    );
    await this.expectScrollableTextModal('Technical task');
    await this.actions.press('A/B tests: close Technical task', this.locate.role('dialog'), 'Escape');
  }

  async expectRowsAndPagination(): Promise<void> {
    await this.expectations.nonEmpty('A/B tests: application links', this.appLinks);
    await this.expectations.visible(
      'A/B tests: rows per page',
      this.locate.within(this.root).role('combobox'),
    );
    await this.expectations.containsText('A/B tests: page counter', this.root, /\d+\s*of\s*\d+/);
  }

  async expectGalleryKeyboardNavigation(): Promise<void> {
    const row = this.firstRow;
    const rowButtons = this.locate.within(row).role('button');
    await this.expectations.countAtLeast('Галерея A/B-теста: действия строки', rowButtons, 3);
    await this.actions.click(
      'A/B-тест: раскрыть строку с вариантами',
      rowButtons.nth(productLocators.abTests.row.expandActionIndex),
    );
    const thumbnails = this.locate.within(row).css(productLocators.abTests.gallery.thumbnail);
    await this.expectations.countAtLeast('Галерея A/B-теста: изображения варианта', thumbnails, 3);
    await this.actions.click('Галерея A/B-теста: открыть первое изображение', thumbnails.first());

    const dialog = this.locate.role('dialog', { name: productLocators.abTests.gallery.title });
    await this.expectations.visible('Галерея A/B-теста: модальное окно', dialog);
    await this.expectations.containsText(
      'Галерея A/B-теста: выбрано первое изображение',
      dialog,
      productLocators.abTests.gallery.firstPosition,
    );
    await this.actions.press('Галерея A/B-теста: перейти вправо клавиатурой', dialog, 'ArrowRight');
    await this.expectations.containsText(
      'Галерея A/B-теста: выбрано второе изображение',
      dialog,
      productLocators.abTests.gallery.secondPosition,
    );
    await this.actions.press('Галерея A/B-теста: вернуться влево клавиатурой', dialog, 'ArrowLeft');
    await this.expectations.containsText(
      'Галерея A/B-теста: снова выбрано первое изображение',
      dialog,
      productLocators.abTests.gallery.firstPosition,
    );
  }

  async expectMissingPValuesRenderedWithoutTechnicalValues(): Promise<void> {
    const row = this.firstRow;
    const rowButtons = this.locate.within(row).role('button');
    await this.expectations.countAtLeast('A/B-тест: действия строки старого теста', rowButtons, 3);
    await this.actions.click(
      'A/B-тест: раскрыть старый внутренний тест',
      rowButtons.nth(productLocators.abTests.row.expandActionIndex),
    );
    await this.expectations.containsText('A/B-тест: отображается колонка P-value', row, 'P-value');
    await this.expectations.notContainsText(
      'A/B-тест: отсутствующие P-value не показывают null',
      row,
      productLocators.technicalValue,
    );
  }

  async searchByApplicationName(query: string): Promise<void> {
    await this.actions.fill(
      'Поиск A/B-тестов: название приложения',
      this.locate.within(this.root).css(`input[placeholder="${productLocators.abTests.searchPlaceholder}"]`),
      query,
    );
  }

  async expectApplicationNameHighlighted(appName: string, query: string): Promise<void> {
    const appNameNode = this.locate
      .within(this.appLinks.first())
      .css(productLocators.abTests.row.appNameFromAppLink);
    await this.expectations.text('Поиск A/B-тестов: найдено нужное приложение', appNameNode, appName);
    await this.expectations.visible(
      'Поиск A/B-тестов: совпавшая часть названия выделена',
      this.locate.within(appNameNode).text(query, { exact: true }),
    );
  }

  async openFirstApplication(): Promise<void> {
    await this.actions.click('A/B tests: open first application', this.appLinks.first());
    await this.expectations.url('A/B tests: linked application URL', productLocators.apps.detailUrl);
  }

  async openCreate(): Promise<void> {
    await this.actions.click(
      'A/B tests: open Create test',
      this.locate.within(this.root).role('link', { name: productLocators.abTests.create, exact: true }),
    );
    await this.expectations.url('A/B tests: create URL', productLocators.abTests.createUrl);
    await this.expectations.visible('A/B tests create: main', this.root);
  }

  async expectTeamFilter(): Promise<void> {
    await this.expectations.visible(
      'A/B tests: Team Our tests',
      this.locate.within(this.root).role('button', { name: /^Team: Our tests/ }),
    );
  }

  async expectStateShell(): Promise<void> {
    await this.expectations.visible('A/B tests state: main', this.root);
    await this.expectations.notContainsText(
      'A/B tests state: no technical values',
      this.root,
      productLocators.technicalValue,
    );
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'A/B tests: loading state',
      this.locate.within(this.root).css(productLocators.loading).first(),
    );
  }

  async expectEmpty(): Promise<void> {
    await this.expectations.count('A/B tests: no application rows', this.appLinks, 0);
    await this.expectStateShell();
  }

  async expectError(): Promise<void> {
    await this.expectations.visible(
      'A/B tests: error message',
      this.locate.within(this.root).text(productLocators.errorMessage),
    );
    await this.expectations.count('A/B tests: stale rows hidden', this.appLinks, 0);
  }

  get appLinks(): Locator {
    return this.locate.within(this.root).css(productLocators.abTests.appLink);
  }

  private get firstRow(): Locator {
    return this.locate.within(this.appLinks.first()).css(productLocators.abTests.row.rootFromAppLink);
  }

  private async ensureFilterVisible(definition: AbTestFilterDefinition): Promise<void> {
    const trigger = this.locate.testId(productLocators.abTests.filter.trigger(definition.key));
    if ((await trigger.count()) > 0) return;
    if (definition.addedByDefault) {
      throw new Error(`A/B tests default filter ${definition.name} is missing`);
    }

    await this.actions.click(
      `A/B tests: open add-filter menu for ${definition.name}`,
      this.locate.testId(productLocators.abTests.filter.addTrigger),
    );
    await this.actions.click(
      `A/B tests: add ${definition.name} filter`,
      this.locate.testId(productLocators.abTests.filter.addOptionCheckbox(definition.key)),
    );
    await this.actions.click(
      `A/B tests: apply ${definition.name} filter visibility`,
      this.locate.testId(productLocators.abTests.filter.addApply),
    );
    await this.expectations.visible(`A/B tests: ${definition.name} filter added`, trigger);
  }

  private async expectSelectAllFirst(definition: AbTestFilterDefinition): Promise<void> {
    const viewport = this.locate.css(`[data-testid$="${definition.key}__scroll__viewport"]`);
    const firstOption = this.locate
      .within(viewport)
      .css(productLocators.abTests.filter.optionChildren)
      .first();
    await this.expectations.attribute(
      `A/B tests: Select all is first in ${definition.name}`,
      firstOption,
      'data-testid',
      new RegExp(`${definition.key}__option-all$`),
    );
  }

  private async expectVariantTable(row: Locator): Promise<void> {
    for (const header of productLocators.abTests.row.variantHeaders) {
      await this.expectations.visible(
        `A/B tests: expanded row header ${header}`,
        this.locate.within(row).text(header, { exact: true }),
      );
    }
  }

  private async expectScrollableTextModal(
    title: (typeof productLocators.abTests.textModal.titles)[number],
  ): Promise<void> {
    const dialog = this.locate.role('dialog');
    await this.expectations.visible(`A/B tests: ${title} modal`, dialog);
    await this.expectations.visible(
      `A/B tests: ${title} title`,
      this.locate.within(dialog).text(title, { exact: true }),
    );
    await this.expectations.visible(
      `A/B tests: ${title} lower action`,
      this.locate.within(dialog).role('button', {
        name: productLocators.abTests.textModal.lowerAction,
        exact: true,
      }),
    );

    const scrollDelta = () =>
      dialog.evaluate((root) => {
        const nodes = Array.from(root.querySelectorAll<HTMLElement>('*'));
        return Math.max(0, ...nodes.map((node) => node.scrollHeight - node.clientHeight));
      });
    await this.expectations.pollNumberAtLeast(
      `A/B tests: ${title} has internal scrolling`,
      dialog,
      scrollDelta,
      1,
    );

    await this.actions.run('evaluate', `A/B tests: scroll ${title} content to bottom`, dialog, () =>
      dialog.evaluate((root) => {
        const nodes = Array.from(root.querySelectorAll<HTMLElement>('*'));
        const scrollable = nodes.reduce<HTMLElement | null>((largest, node) => {
          const overflowY = getComputedStyle(node).overflowY;
          if (!['auto', 'scroll'].includes(overflowY) || node.scrollHeight <= node.clientHeight) {
            return largest;
          }
          if (!largest) return node;
          return node.scrollHeight - node.clientHeight > largest.scrollHeight - largest.clientHeight
            ? node
            : largest;
        }, null);
        if (!scrollable) throw new Error('Scrollable modal content was not found');
        scrollable.scrollTop = scrollable.scrollHeight;
        scrollable.dispatchEvent(new Event('scroll', { bubbles: true }));
      }),
    );

    const bottomGap = () =>
      dialog.evaluate((root) => {
        const lowerAction = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
          (button) => button.textContent?.trim() === 'Edit',
        );
        if (!lowerAction) return -1;
        const lowerTop = lowerAction.getBoundingClientRect().top;
        const upButton = Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
          .filter((button) => {
            const rect = button.getBoundingClientRect();
            const gap = lowerTop - rect.bottom;
            return !button.textContent?.trim() && button.querySelector('svg') && gap >= 0 && gap <= 100;
          })
          .sort(
            (left, right) => right.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom,
          )[0];
        if (!upButton) return -1;
        const buttonRect = upButton.getBoundingClientRect();
        return Math.round(lowerTop - buttonRect.bottom);
      });
    await this.expectations.pollNumber(`A/B tests: ${title} scroll-to-top bottom gap`, dialog, bottomGap, 8);
  }
}
