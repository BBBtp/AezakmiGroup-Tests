import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { checksTestIds } from '@locators/checks';

export class EditKeywordsModalComponent extends UiObject {
  readonly root: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;
  readonly keywordList: Locator;
  readonly addKeywordButton: Locator;
  readonly keywordInput: Locator;
  readonly countrySelectTrigger: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(checksTestIds.editKeywordsModal);
    const modal = this.locate.within(this.root);
    this.title = modal.testId(checksTestIds.editKeywordsModalTitle);
    this.closeButton = modal.testId(checksTestIds.editKeywordsModalClose);
    this.keywordList = modal.testId(checksTestIds.keywordList);
    this.addKeywordButton = modal.testId(checksTestIds.addKeywordButton);
    this.keywordInput = modal.testId(checksTestIds.keywordInput);
    this.countrySelectTrigger = modal.testId(checksTestIds.countrySelectTrigger);
    this.submitButton = modal.testId(checksTestIds.submitButton);
  }

  keywordItem(keyword: string): Locator {
    return this.locate
      .within(this.keywordList)
      .testId(checksTestIds.keywordItem)
      .filter({ has: this.locate.testId(checksTestIds.keywordText).filter({ hasText: keyword }) });
  }

  async expectListOpen(): Promise<void> {
    await this.expectations.visible('Edit keywords modal', this.root);
    await this.expectations.text('Edit keywords modal title', this.title, 'Editing keywords');
    await this.expectations.visible('tracked keywords list', this.keywordList);
  }

  async openAddForm(): Promise<void> {
    await this.actions.click('Edit keywords: add new keyword', this.addKeywordButton);
    await this.expectations.text('Add keyword modal title', this.title, 'Add new keyword');
    await this.expectations.visible('keyword input', this.keywordInput);
  }

  async fillAddForm(keyword: string, country: string): Promise<void> {
    await this.actions.fill('new tracked keyword', this.keywordInput, keyword);
    await this.actions.click('new tracked keyword country', this.countrySelectTrigger);
    await this.actions.click(
      `new tracked keyword country ${country}`,
      this.locate.testId(checksTestIds.countryOption(country)),
    );
  }

  async submitAdd(): Promise<void> {
    await this.actions.click('Edit keywords: confirm add', this.submitButton);
    await this.expectations.hidden('Edit keywords modal after add', this.root);
  }

  async close(): Promise<void> {
    await this.actions.click('Edit keywords: close', this.closeButton);
    await this.expectations.hidden('Edit keywords modal', this.root);
  }

  async expectValidationAndCancel(): Promise<void> {
    await this.openAddForm();
    await this.expectations.disabled('сохранение пустого keyword', this.submitButton);
    await this.actions.fill('невалидный keyword из спецсимволов', this.keywordInput, '!!!');
    await this.expectations.disabled('сохранение невалидного keyword', this.submitButton);
    await this.actions.fill('валидный keyword', this.keywordInput, 'automation keyword');
    await this.actions.click('страна валидного keyword', this.countrySelectTrigger);
    await this.actions.click(
      'страна GB для валидного keyword',
      this.locate.testId(checksTestIds.countryOption('GB')),
    );
    await this.expectations.enabled('сохранение валидного keyword после заполнения', this.submitButton);
    await this.close();
  }

  async expectDraftDiscarded(keyword: string): Promise<void> {
    await this.openAddForm();
    await this.actions.fill('несохранённый черновик keyword', this.keywordInput, keyword);
    await this.close();
  }

  async expectEmptyDraft(): Promise<void> {
    await this.openAddForm();
    await this.expectations.value('пустой keyword после повторного открытия', this.keywordInput, '');
    await this.close();
  }

  async expectKeywordTracked(keyword: string): Promise<void> {
    await this.expectations.visible(`tracked keyword ${keyword}`, this.keywordItem(keyword));
  }

  async expectKeywordNotTracked(keyword: string): Promise<void> {
    await this.expectations.hidden(`untracked keyword ${keyword}`, this.keywordItem(keyword));
  }

  async stopTracking(keyword: string): Promise<void> {
    const item = this.keywordItem(keyword);
    await this.expectations.visible(`tracked keyword ${keyword}`, item);
    await this.actions.click(
      `stop tracking ${keyword}`,
      this.locate.within(item).testId(checksTestIds.stopTrackingButton),
    );
    const confirmation = this.locate.testId(checksTestIds.stopTrackingModal);
    await this.expectations.visible(`stop tracking ${keyword} confirmation`, confirmation);
    await this.actions.click(
      `confirm stop tracking ${keyword}`,
      this.locate.within(confirmation).testId(checksTestIds.stopTrackingConfirmButton),
    );
    await this.expectations.hidden(`removed tracked keyword ${keyword}`, item);
  }
}
