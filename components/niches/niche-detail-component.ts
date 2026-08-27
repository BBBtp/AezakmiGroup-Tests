import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { nichesTestIds } from '@locators/master-sections';

const ids = nichesTestIds.detail;

export class NicheDetailComponent extends UiObject {
  readonly root: Locator;
  readonly nameBlock: Locator;
  readonly title: Locator;
  readonly lastEdited: Locator;
  readonly module: Locator;
  readonly actionsButton: Locator;
  readonly editButton: Locator;
  readonly exportButton: Locator;
  readonly moveToArchiveButton: Locator;
  readonly addKeywordButton: Locator;
  readonly table: Locator;
  readonly translateAll: Locator;
  readonly selectAll: Locator;
  readonly addKeywordsModal: Locator;
  readonly addKeywordsTitle: Locator;
  readonly addKeywordsClose: Locator;
  readonly addKeywordsManual: Locator;
  readonly addKeywordsFromApp: Locator;
  readonly addKeywordsGeoTrigger: Locator;
  readonly addKeywordsInput: Locator;
  readonly addKeywordsSubmit: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(ids.page);
    this.nameBlock = this.locate.testId(ids.nameBlock);
    this.title = this.locate.testId(ids.title);
    this.lastEdited = this.locate.within(this.root).text(ids.lastEdited);
    this.module = this.locate.testId(ids.module);
    this.actionsButton = this.locate.testId(ids.actions);
    this.editButton = this.locate.testId(ids.edit);
    this.exportButton = this.locate.testId(ids.export);
    this.moveToArchiveButton = this.locate.testId(ids.moveToArchive);
    this.addKeywordButton = this.locate.testId(ids.addKeyword);
    this.table = this.locate.testId(ids.table);
    this.translateAll = this.locate.testId(ids.translateAll);
    this.selectAll = this.locate.testId(ids.selectAll);
    this.addKeywordsModal = this.locate.testId(ids.addKeywords.modal);
    this.addKeywordsTitle = this.locate.testId(ids.addKeywords.title);
    this.addKeywordsClose = this.locate.testId(ids.addKeywords.close);
    this.addKeywordsManual = this.locate.testId(ids.addKeywords.manual);
    this.addKeywordsFromApp = this.locate.testId(ids.addKeywords.fromApp);
    this.addKeywordsGeoTrigger = this.locate.testId(ids.addKeywords.geoTrigger);
    this.addKeywordsInput = this.locate.testId(ids.addKeywords.keywordInput);
    this.addKeywordsSubmit = this.locate.testId(ids.addKeywords.submit);
  }

  async expectLoaded(name?: string, module?: string, updatedAt?: string): Promise<void> {
    await this.expectations.visible('Niche detail', this.root);
    await this.expectations.visible('Niche detail: keyword table', this.table);
    if (name) await this.expectations.text('Niche detail: title', this.title, name);
    if (module) await this.expectations.text('Niche detail: module', this.module, module);
    if (updatedAt)
      await this.expectations.containsText(
        'Niche detail: Last edited under title',
        this.lastEdited,
        updatedAt,
      );
  }

  async expectTranslationControls(): Promise<void> {
    await this.expectations.visible('Niche translation: Translate all', this.translateAll);
    await this.expectations.visible('Niche translation: row action', this.row(0).translate);
    await this.expectations.visible('Niche translation: GEO selection', this.row(0).checkbox);
  }

  async translateRow(index = 0): Promise<void> {
    await this.actions.click(`Niche translation: row ${index}`, this.row(index).translate);
  }

  async translateEveryGeo(): Promise<void> {
    await this.actions.click('Niche translation: all GEOs', this.translateAll);
  }

  async selectRows(...indexes: number[]): Promise<void> {
    for (const index of indexes) {
      await this.actions.click(`Niche translation: select row ${index}`, this.row(index).checkbox);
    }
  }

  async expectRowNumbersUnchanged(index: number, count: string, keywords: string): Promise<void> {
    await this.expectations.text(`Niche row ${index}: count`, this.row(index).count, count);
    await this.expectations.containsText(`Niche row ${index}: keywords`, this.row(index).keywords, keywords);
  }

  rowKeywordsText(index = 0): Promise<string> {
    return this.row(index).keywords.innerText();
  }

  async expectRowKeywordsChanged(previousValue: string, index = 0): Promise<void> {
    await this.expectations.textChanged(
      `Niche translation: row ${index} keywords changed`,
      this.row(index).keywords,
      previousValue,
    );
  }

  async expectRowKeywords(previousValue: string, index = 0): Promise<void> {
    await this.expectations.text(
      `Niche translation: row ${index} keywords`,
      this.row(index).keywords,
      previousValue,
    );
  }

  async expectTranslationPending(index = 0): Promise<void> {
    await this.expectations.visible(
      `Niche translation: row ${index} loading`,
      this.row(index).translationLoading,
    );
  }

  async expectTranslationReady(index = 0): Promise<void> {
    await this.expectations.hidden(
      `Niche translation: row ${index} loading completed`,
      this.row(index).translationLoading,
    );
    await this.expectations.visible(
      `Niche translation: row ${index} action restored`,
      this.row(index).translate,
    );
  }

  async openAddKeywords(): Promise<void> {
    await this.actions.click('Niche detail: Add keyword', this.addKeywordButton);
    await this.expectations.visible('Niche Add keyword: modal', this.addKeywordsModal);
    await this.expectations.text('Niche Add keyword: title', this.addKeywordsTitle, 'Adding keywords');
    await this.expectations.count(
      'Niche Add keyword: initial loader completed',
      this.locate.within(this.addKeywordsModal).css(ids.addKeywords.busySelector),
      0,
    );
    await this.expectations.visible('Niche Add keyword: manual mode', this.addKeywordsManual);
    await this.expectations.visible('Niche Add keyword: from app mode', this.addKeywordsFromApp);
  }

  async fillManualKeyword(geo: string, keyword: string): Promise<void> {
    await this.actions.click('Niche Add keyword: manual mode', this.addKeywordsManual);
    await this.actions.click('Niche Add keyword: GEO selector', this.addKeywordsGeoTrigger);
    await this.actions.click(
      `Niche Add keyword: GEO ${geo}`,
      this.locate.testId(ids.addKeywords.geoOption(geo)),
    );
    await this.actions.fill('Niche Add keyword: keyword', this.addKeywordsInput, keyword);
    await this.expectations.enabled('Niche Add keyword: submit', this.addKeywordsSubmit);
  }

  async submitKeyword(): Promise<void> {
    await this.actions.click('Niche Add keyword: submit', this.addKeywordsSubmit);
  }

  async closeAddKeywords(): Promise<void> {
    await this.actions.click('Niche Add keyword: close', this.addKeywordsClose);
    await this.expectAddKeywordsClosed();
  }

  async expectAddKeywordsClosed(): Promise<void> {
    await this.expectations.hidden('Niche Add keyword: modal closed', this.addKeywordsModal);
  }

  async openActions(): Promise<void> {
    await this.actions.click('Niche detail: actions', this.actionsButton);
  }

  async expectActiveActions(): Promise<void> {
    await this.openActions();
    await this.expectations.visible('Niche detail: Edit', this.editButton);
    await this.expectations.visible('Niche detail: Export XLSX', this.exportButton);
    await this.expectations.visible('Niche detail: Move to archive', this.moveToArchiveButton);
  }

  async openEdit(): Promise<void> {
    await this.openActions();
    await this.actions.click('Niche detail: Edit', this.editButton);
  }

  async exportXlsx(): Promise<void> {
    await this.openActions();
    await this.actions.click('Niche detail: Export XLSX', this.exportButton);
  }

  async moveToArchive(): Promise<void> {
    await this.openActions();
    await this.actions.click('Niche detail: Move to archive', this.moveToArchiveButton);
  }

  async openRowActions(index = 0): Promise<void> {
    await this.actions.click(`Niche row ${index}: actions`, this.row(index).actions);
  }

  async expectRowActions(index = 0): Promise<void> {
    await this.openRowActions(index);
    await this.expectations.visible(`Niche row ${index}: Edit`, this.row(index).edit);
    await this.expectations.visible(`Niche row ${index}: Delete`, this.row(index).delete);
  }

  private row(index: number) {
    const rowIds = ids.row(index);
    return {
      root: this.locate.testId(rowIds.root),
      checkbox: this.locate.testId(rowIds.checkbox),
      count: this.locate.testId(rowIds.count),
      keywords: this.locate.testId(rowIds.keywords),
      copy: this.locate.testId(rowIds.copy),
      translate: this.locate.testId(rowIds.translate),
      translationLoading: this.locate.testId(rowIds.translationLoading),
      actions: this.locate.testId(rowIds.actions),
      edit: this.locate.testId(rowIds.edit),
      delete: this.locate.testId(rowIds.delete),
    };
  }
}
