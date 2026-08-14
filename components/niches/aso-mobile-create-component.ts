import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { sortedAppsTestIds } from '@locators/master-sections';

const createIds = sortedAppsTestIds.asoMobileCreate;

export class AsoMobileCreateComponent extends UiObject {
  readonly openButton: Locator;
  readonly modal: Locator;
  readonly closeButton: Locator;
  readonly form: Locator;
  readonly content: Locator;
  readonly urlInput: Locator;
  readonly nicheTrigger: Locator;
  readonly nicheContent: Locator;
  readonly geosTrigger: Locator;
  readonly geosContent: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page, root: Locator) {
    super(page);
    const section = this.locate.within(root);
    this.openButton = section.testId(sortedAppsTestIds.createAsoMobileAppButton);
    this.modal = this.locate.testId(createIds.modal);
    this.closeButton = this.locate.testId(createIds.closeButton);
    this.form = this.locate.testId(createIds.form);
    this.content = this.locate.testId(createIds.content);
    this.urlInput = this.locate.testId(createIds.urlInput);
    this.nicheTrigger = this.locate.testId(createIds.nicheTrigger);
    this.nicheContent = this.locate.testId(createIds.nicheContent);
    this.geosTrigger = this.locate.testId(createIds.geosTrigger);
    this.geosContent = this.locate.testId(createIds.geosContent);
    this.submitButton = this.locate.testId(createIds.submitButton);
    this.errorMessage = this.locate.within(this.modal).text(createIds.errorMessage, { exact: true });
    this.successMessage = this.locate.text(createIds.successMessage, { exact: true });
  }

  async open(): Promise<void> {
    await this.actions.click('ASO Mobile: open create modal', this.openButton);
    await this.expectInitialState();
  }

  async fillValidForm(options: { url: string; niche: string; geo: string }): Promise<void> {
    await this.actions.fill('ASO Mobile: App Store URL', this.urlInput, options.url);
    await this.actions.click('ASO Mobile: open niche select', this.nicheTrigger);
    await this.expectations.visible('ASO Mobile: niche options', this.nicheContent);
    await this.actions.click(
      `ASO Mobile: select niche ${options.niche}`,
      this.locate.testId(createIds.nicheOption(options.niche)),
    );
    await this.expectations.visible('ASO Mobile: GEO select enabled', this.geosTrigger);
    await this.actions.click('ASO Mobile: open GEO select', this.geosTrigger);
    await this.expectations.visible('ASO Mobile: GEO options', this.geosContent);
    await this.actions.click(
      `ASO Mobile: select GEO ${options.geo}`,
      this.locate.testId(createIds.geoOption(options.geo)),
    );
    await this.actions.click('ASO Mobile: close GEO select', this.geosTrigger);
    await this.expectations.enabled('ASO Mobile: submit enabled', this.submitButton);
  }

  async submit(): Promise<void> {
    await this.actions.click('ASO Mobile: submit create request', this.submitButton);
  }

  async expectSubmitting(): Promise<void> {
    await this.expectations.notContainsText(
      'ASO Mobile: submit shows streaming loader',
      this.submitButton,
      'Create app',
    );
    await this.expectations.visible('ASO Mobile: modal remains visible while streaming', this.modal);
  }

  async expectSuccess(): Promise<void> {
    await this.expectations.hidden('ASO Mobile: create modal closed after success', this.modal);
    await this.expectations.visible('ASO Mobile: success notification', this.successMessage);
  }

  async expectError(): Promise<void> {
    await this.expectations.visible('ASO Mobile: SSE error message', this.errorMessage);
    await this.expectations.enabled('ASO Mobile: submit unlocked after SSE error', this.submitButton);
    await this.expectations.visible('ASO Mobile: modal remains controllable after error', this.closeButton);
  }

  async close(): Promise<void> {
    await this.actions.click('ASO Mobile: close create modal', this.closeButton);
    await this.expectations.hidden('ASO Mobile: create modal closed', this.modal);
  }

  async expectInitialState(): Promise<void> {
    await this.expectations.visible('ASO Mobile: create modal', this.modal);
    await this.expectations.visible('ASO Mobile: create form', this.form);
    await this.expectations.visible('ASO Mobile: form content', this.content);
    await this.expectations.value('ASO Mobile: empty App Store URL', this.urlInput, '');
    await this.expectations.disabled('ASO Mobile: initial submit disabled', this.submitButton);
    await this.expectations.hidden('ASO Mobile: previous error cleared', this.errorMessage);
  }
}
