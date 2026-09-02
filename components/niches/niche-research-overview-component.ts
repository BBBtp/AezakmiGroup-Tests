import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { nicheResearchTestIds } from '@locators/niche-research';
import { NicheResearchCreateComponent } from './niche-research-create-component';
import { NicheResearchDeleteComponent } from './niche-research-delete-component';
import { NicheResearchEditComponent } from './niche-research-edit-component';

export class NicheResearchOverviewComponent extends UiObject {
  readonly root: Locator;
  readonly createButton: Locator;
  readonly forResearchTab: Locator;
  readonly researchedTab: Locator;
  readonly searchInput: Locator;
  readonly filtersButton: Locator;
  readonly table: Locator;
  readonly tableTitle: Locator;
  readonly create: NicheResearchCreateComponent;
  readonly edit: NicheResearchEditComponent;
  readonly deleteDialog: NicheResearchDeleteComponent;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(nicheResearchTestIds.page);
    this.createButton = this.locate.testId(nicheResearchTestIds.createButton);
    this.forResearchTab = this.locate.testId(nicheResearchTestIds.tabs.forResearch);
    this.researchedTab = this.locate.testId(nicheResearchTestIds.tabs.researched);
    this.searchInput = this.locate.role('searchbox', { name: 'Search', exact: true });
    this.filtersButton = this.locate.role('button', { name: /^Filters(?:\s*:\s*\d+)?$/ });
    this.table = this.locate.testId(nicheResearchTestIds.table);
    this.tableTitle = this.locate.testId(nicheResearchTestIds.tableTitle);
    this.create = new NicheResearchCreateComponent(page);
    this.edit = new NicheResearchEditComponent(page);
    this.deleteDialog = new NicheResearchDeleteComponent(page);
  }

  async expectLoaded(): Promise<void> {
    await this.expectations.visible('Страница исследования ниш', this.root);
    await this.expectations.visible('Вкладка Niches for research', this.forResearchTab);
    await this.expectations.visible('Вкладка Researched niches', this.researchedTab);
    await this.expectations.visible('Поиск по исследуемым нишам', this.searchInput);
    await this.expectations.visible('Фильтры исследуемых ниш', this.filtersButton);
    await this.expectations.visible('Таблица исследуемых ниш', this.table);
  }

  async expectRows(minimum = 1): Promise<void> {
    await this.expectations.countAtLeast(
      'Строки таблицы исследуемых ниш',
      this.locate.testId(/^niche-research-\d+-row$/),
      minimum,
    );
  }

  async expectRowCount(count: number): Promise<void> {
    await this.expectations.count(
      'Количество строк таблицы исследуемых ниш',
      this.locate.testId(/^niche-research-\d+-row$/),
      count,
    );
  }

  async expectRow(
    index: number,
    expected: { name: string; description: string; manager: string; createdAt: string },
  ): Promise<void> {
    const row = nicheResearchTestIds.row(index);
    await this.expectations.containsText(
      'Название исследуемой ниши',
      this.locate.testId(row.name),
      expected.name,
    );
    await this.expectations.containsText(
      'Описание исследуемой ниши',
      this.locate.testId(row.description),
      expected.description,
    );
    await this.expectations.containsText(
      'ASO-менеджер исследуемой ниши',
      this.locate.testId(row.manager),
      expected.manager,
    );
    await this.expectations.containsText(
      'Дата создания исследуемой ниши',
      this.locate.testId(row.createdAt),
      expected.createdAt,
    );
  }

  async expectNeuroCategory(index: number): Promise<void> {
    await this.expectations.visible(
      'Иконка категории Neuro niche',
      this.locate.testId(nicheResearchTestIds.row(index).category),
    );
  }

  async expectAdminNewActions(index: number): Promise<void> {
    const row = nicheResearchTestIds.row(index);
    await this.expectations.visible('Действие Edit для новой ниши', this.locate.testId(row.edit));
    await this.expectations.visible('Действие Delete для новой ниши', this.locate.testId(row.delete));
  }

  async expectRevisionActions(index: number): Promise<void> {
    const ids = nicheResearchTestIds.row(index);
    const row = this.locate.testId(ids.root);
    await this.expectations.containsText('Статус Revision исследуемой ниши', row, 'Revision');
    await this.expectations.visible(
      'Действие More для ниши Revision',
      this.locate.within(row).role('button', { name: 'More', exact: true }),
    );
    await this.expectations.hidden('Действие Edit для ниши Revision', this.locate.testId(ids.edit));
    await this.expectations.hidden('Действие Delete для ниши Revision', this.locate.testId(ids.delete));
  }

  async expectLongDescription(index: number, description: string): Promise<void> {
    const ids = nicheResearchTestIds.row(index);
    await this.expectations.containsText(
      'Сокращённое длинное описание исследуемой ниши',
      this.locate.testId(ids.description),
      description,
    );
    await this.expectations.visible(
      'Действие See more для длинного описания',
      this.locate.testId(ids.descriptionMore),
    );
  }

  async revealLongDescription(index: number, description: string): Promise<void> {
    const ids = nicheResearchTestIds.row(index);
    await this.actions.click(
      'Раскрытие полного описания исследуемой ниши',
      this.locate.testId(ids.descriptionMore),
    );
    await this.expectations.containsText(
      'Полное описание исследуемой ниши',
      this.locate.testId(ids.descriptionCell),
      description,
    );
  }

  async expectScreenshot(name: string): Promise<void> {
    await this.expectations.screenshot('Визуальное состояние исследования ниш', this.root, name);
  }

  async useViewport(width: number, height: number): Promise<void> {
    await this.actions.run(
      'dispatchEvent',
      `Размер области исследования ниш ${width}×${height}`,
      this.root,
      () => this.page.setViewportSize({ width, height }),
    );
  }

  async expectLoading(): Promise<void> {
    await this.expectations.visible(
      'Основная область страницы исследования ниш во время загрузки',
      this.locate.role('main'),
    );
    await this.expectRowCount(0);
  }

  async expectError(): Promise<void> {
    await this.expectations.visible(
      'Ошибка загрузки списка исследуемых ниш',
      this.locate.text(/Failed to load|Something went wrong|Something's gone wrong/i),
    );
    await this.expectRowCount(0);
  }

  async expectEmpty(): Promise<void> {
    await this.expectations.visible('Страница исследования ниш без данных', this.root);
    await this.expectations.visible(
      'Сообщение об отсутствии исследуемых ниш',
      this.locate.text('No niches for research created yet', { exact: true }),
    );
    await this.expectations.hidden('Таблица исследуемых ниш без данных', this.table);
    await this.expectRowCount(0);
    await this.expectNoTechnicalValues();
  }

  async expectNoTechnicalValues(): Promise<void> {
    await this.expectations.notContainsText(
      'Страница исследования ниш без технических значений',
      this.root,
      /\b(?:null|undefined|NaN)\b|\[object Object\]/i,
    );
  }

  async search(value: string): Promise<void> {
    await this.actions.fill('Поиск по исследуемым нишам', this.searchInput, value);
  }

  async openFilters(): Promise<void> {
    await this.actions.click('Открытие фильтров исследуемых ниш', this.filtersButton);
    await this.expectations.visible(
      'Панель фильтров исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.filters),
    );
  }

  async openFilterCatalog(): Promise<void> {
    await this.actions.click(
      'Добавление фильтра исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.addFilter),
    );
    await this.expectations.countAtLeast(
      'Заголовок таблицы и фильтр ASO manager',
      this.locate.text('ASO manager', { exact: true }),
      2,
    );
    await this.expectations.visible(
      'Фильтр Category',
      this.locate.testId(nicheResearchTestIds.filtersCatalog.category),
    );
    await this.expectations.visible(
      'Фильтр Status',
      this.locate.testId(nicheResearchTestIds.filtersCatalog.status),
    );
    await this.expectations.visible(
      'Применение фильтров исследуемых ниш',
      this.locate.role('button', { name: 'Apply', exact: true }),
    );
  }

  async activateAllFilters(): Promise<void> {
    await this.openFilters();
    await this.activateAllFiltersInOpenPanel();
  }

  async activateAllFiltersInOpenPanel(): Promise<void> {
    await this.openFilterCatalog();
    await this.actions.click(
      'Добавление фильтра ASO manager',
      this.locate.testId(nicheResearchTestIds.filtersCatalog.manager),
    );
    await this.actions.click(
      'Добавление фильтра Category',
      this.locate.testId(nicheResearchTestIds.filtersCatalog.category),
    );
    await this.actions.click(
      'Добавление фильтра Status',
      this.locate.testId(nicheResearchTestIds.filtersCatalog.status),
    );
    await this.actions.click(
      'Подтверждение состава фильтров',
      this.locate.testId(nicheResearchTestIds.filtersCatalog.apply),
    );
  }

  async chooseManager(managerId: string, name: string): Promise<void> {
    const trigger = this.locate.role('button', { name: 'ASO manager', exact: true });
    const option = this.locate.testId(nicheResearchTestIds.managerFilter.option(managerId));
    if (!(await option.isVisible())) await this.actions.click('Открытие фильтра ASO manager', trigger);
    await this.actions.click(`Выбор ASO manager ${name}`, option);
    await this.actions.click(
      'Применение фильтра ASO manager',
      this.locate.testId(nicheResearchTestIds.managerFilter.apply),
    );
  }

  async chooseFirstAvailableManager(): Promise<{ id: string; name: string }> {
    const trigger = this.locate.role('button', { name: 'ASO manager', exact: true });
    const option = this.locate.testId(nicheResearchTestIds.managerFilter.anyAssignedOption).first();
    if (!(await option.isVisible())) await this.actions.click('Открытие фильтра ASO manager', trigger);
    const testId = await option.getAttribute('data-testid');
    const id = testId?.replace(/^undefined-manager__option-/, '').replace(/__checkbox-checkbox$/, '');
    if (!id) throw new Error('Не удалось определить ID доступного ASO manager');
    const name = (await option.textContent())?.trim() ?? '';
    await this.chooseManager(id, name);
    return { id, name };
  }

  async chooseNotAssignedManager(): Promise<void> {
    const trigger = this.locate.role('button', { name: 'ASO manager', exact: true });
    const option = this.locate.testId(nicheResearchTestIds.managerFilter.notAssigned);
    if (!(await option.isVisible())) await this.actions.click('Открытие фильтра ASO manager', trigger);
    await this.actions.click('Выбор неназначенного ASO manager', option);
    await this.actions.click(
      'Применение фильтра ASO manager',
      this.locate.testId(nicheResearchTestIds.managerFilter.apply),
    );
  }

  async chooseFilterValue(kind: 'category' | 'status', value: string): Promise<void> {
    await this.actions.click(
      `Открытие фильтра ${kind}`,
      this.locate.testId(nicheResearchTestIds.activeFilters[kind]),
    );
    await this.actions.click(
      `Выбор ${kind} ${value}`,
      this.locate.testId(nicheResearchTestIds.filterOption(kind, value)),
    );
    await this.actions.click(
      `Применение фильтра ${kind}`,
      this.locate.testId(nicheResearchTestIds.filterApply(kind)),
    );
  }

  async resetFilters(): Promise<void> {
    await this.actions.click(
      'Сброс всех фильтров исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.resetFilters),
    );
  }

  async expectPagination(page: string, total: string): Promise<void> {
    await this.expectations.visible(
      'Пагинация исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.pagination.root),
    );
    await this.expectations.containsText(
      'Текущая страница исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.pagination.current),
      page,
    );
    await this.expectations.containsText(
      'Количество страниц исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.pagination.total),
      total,
    );
  }

  async nextPage(): Promise<void> {
    await this.actions.click(
      'Следующая страница исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.pagination.next),
    );
  }

  async previousPage(): Promise<void> {
    await this.actions.click(
      'Предыдущая страница исследуемых ниш',
      this.locate.testId(nicheResearchTestIds.pagination.previous),
    );
  }

  async sortByCreationDate(): Promise<void> {
    await this.actions.click(
      'Сортировка исследуемых ниш по дате создания',
      this.locate.role('button', { name: 'Creation date', exact: true }),
    );
  }

  async sortByResearchDate(): Promise<void> {
    await this.actions.click(
      'Сортировка исследованных ниш по дате исследования',
      this.locate.role('button', { name: 'Research date', exact: true }),
    );
  }

  async openResearched(): Promise<void> {
    await this.actions.click('Открытие вкладки Researched niches', this.researchedTab);
  }

  async openForResearch(): Promise<void> {
    await this.actions.click('Открытие вкладки Niches for research', this.forResearchTab);
  }

  async expectResearchedNiche(name: string): Promise<void> {
    await this.expectations.visible('Строка исследованной ниши', this.locate.text(name, { exact: true }));
  }

  async expectResearchedRow(
    index: number,
    expected: { name: string; status: string; manager: string; createdAt: string; researchedAt: string },
  ): Promise<void> {
    const escapedName = expected.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = this.locate.role('row', { name: new RegExp(`^${escapedName}\\s`) });
    for (const value of Object.values(expected)) {
      await this.expectations.containsText('Данные исследованной ниши', row, value);
    }
    await this.expectations.visible(
      'Действие More исследованной ниши',
      this.locate.within(row).role('button', { name: 'More', exact: true }),
    );
  }

  async expectResearchedRowCount(count: number): Promise<void> {
    await this.expectations.count(
      'Количество строк таблицы исследованных ниш',
      this.locate.role('row', { name: /More$/ }),
      count,
    );
  }

  async expectResearchedEmpty(): Promise<void> {
    await this.expectations.visible(
      'Сообщение об отсутствии исследованных ниш',
      this.locate.text('No researches yet', { exact: true }),
    );
    await this.expectations.hidden('Таблица исследованных ниш без данных', this.table);
    await this.expectNoTechnicalValues();
  }

  async expectFilteredEmpty(): Promise<void> {
    await this.expectations.visible(
      'Сообщение об отсутствии ниш по фильтрам',
      this.locate.text('Nothing fits the specified filters', { exact: true }),
    );
    await this.expectations.visible(
      'Сброс фильтров пустого результата',
      this.locate.role('button', { name: 'Reset filters', exact: true }),
    );
    await this.expectations.hidden('Таблица результатов фильтрации без данных', this.table);
  }

  async repeatRequest(): Promise<void> {
    await this.actions.click(
      'Повторная загрузка исследованных ниш',
      this.locate.role('button', { name: 'Repeat the request', exact: true }),
    );
  }

  async expectMoreAction(name: string): Promise<void> {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const row = this.locate.role('row', { name: new RegExp(`^${escapedName}\\s`) });
    await this.expectations.visible(
      'Действие More исследованной ниши',
      this.locate.within(row).role('button', { name: 'More', exact: true }),
    );
  }

  async expectAdminControlsHidden(index = 0): Promise<void> {
    const row = nicheResearchTestIds.row(index);
    await this.expectations.hidden('Создание исследуемой ниши для обычного пользователя', this.createButton);
    await this.expectations.hidden(
      'Редактирование исследуемой ниши для обычного пользователя',
      this.locate.testId(row.edit),
    );
    await this.expectations.hidden(
      'Удаление исследуемой ниши для обычного пользователя',
      this.locate.testId(row.delete),
    );
  }

  async openCreate(): Promise<void> {
    await this.actions.click('Открытие формы создания исследуемой ниши', this.createButton);
    await this.create.expectInitial();
  }

  async openEdit(index: number, name: string, description: string): Promise<void> {
    await this.actions.click(
      'Открытие формы редактирования исследуемой ниши',
      this.locate.testId(nicheResearchTestIds.row(index).edit),
    );
    await this.edit.expectInitial(name, description);
  }

  async openDelete(index: number): Promise<void> {
    await this.actions.click(
      'Открытие подтверждения удаления исследуемой ниши',
      this.locate.testId(nicheResearchTestIds.row(index).delete),
    );
    await this.deleteDialog.expectOpen();
  }

  async deleteFirstRowIfPresent(): Promise<boolean> {
    const rows = this.locate.testId(/^niche-research-\d+-row$/);
    if ((await rows.count()) === 0) return false;
    await this.openDelete(0);
    await this.deleteDialog.confirm();
    await this.deleteDialog.expectClosed();
    return true;
  }
}
