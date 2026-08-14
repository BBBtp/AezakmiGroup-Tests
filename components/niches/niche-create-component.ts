import { type Locator, type Page } from '@playwright/test';

import { UiObject } from '@framework/ui';
import { nichesTestIds } from '@locators/master-sections';

const ids = nichesTestIds.form;

export class NicheCreateComponent extends UiObject {
  readonly modal: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;
  readonly nameInput: Locator;
  readonly moduleTrigger: Locator;
  readonly moduleContent: Locator;
  readonly appsButton: Locator;
  readonly appCheckboxes: Locator;
  readonly selectedApps: Locator;
  readonly saveAppsButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.modal = this.locate.testId(ids.modal);
    this.title = this.locate.testId(ids.title);
    this.closeButton = this.locate.testId(ids.close);
    this.nameInput = this.locate.testId(ids.nameInput);
    this.moduleTrigger = this.locate.testId(ids.moduleTrigger);
    this.moduleContent = this.locate.testId(ids.moduleContent);
    this.appsButton = this.locate.testId(ids.appsButton);
    this.appCheckboxes = this.locate.testId(ids.appCheckboxes);
    this.selectedApps = this.locate.testId(ids.selectedApps);
    this.saveAppsButton = this.locate.testId(ids.saveApps);
    this.submitButton = this.locate.testId(ids.submit);
  }

  async expectInitial(): Promise<void> {
    await this.expectations.visible('Create niche: modal', this.modal);
    await this.expectations.value('Create niche: empty name', this.nameInput, '');
    await this.expectations.containsText('Create niche: no module', this.moduleTrigger, 'Select module');
    await this.expectations.disabled('Create niche: submit disabled', this.submitButton);
  }

  async expectModuleOptions(): Promise<void> {
    await this.actions.click('Create niche: open Module', this.moduleTrigger);
    await this.expectations.visible('Create niche: Module options', this.moduleContent);
    await this.expectations.visible('Create niche: ASO option', this.locate.testId(ids.moduleOption('ASO')));
    await this.expectations.visible(
      'Create niche: Web View option',
      this.locate.testId(ids.moduleOption('Web View')),
    );
  }

  async selectModule(module: 'ASO' | 'Web View'): Promise<void> {
    if (!(await this.moduleContent.isVisible())) {
      await this.actions.click('Create niche: open Module', this.moduleTrigger);
    }
    await this.actions.click(`Create niche: select ${module}`, this.locate.testId(ids.moduleOption(module)));
    await this.expectations.containsText(`Create niche: selected ${module}`, this.moduleTrigger, module);
  }

  async selectFirstApp(): Promise<void> {
    await this.actions.click('Create niche: select apps', this.appsButton);
    await this.expectations.nonEmpty('Create niche: app options', this.appCheckboxes);
    const firstTestId = await this.appCheckboxes.first().getAttribute('data-testid');
    if (!firstTestId) throw new Error('Create niche: first app checkbox has no test id');
    await this.actions.click('Create niche: first app', this.locate.testId(firstTestId));
    await this.actions.click('Create niche: save apps', this.saveAppsButton);
    await this.expectations.nonEmptyText('Create niche: selected app', this.selectedApps);
  }

  async fillName(value: string): Promise<void> {
    await this.actions.fill('Create niche: name', this.nameInput, value);
  }

  async expectName(value: string): Promise<void> {
    await this.expectations.value('Niche form: name', this.nameInput, value);
  }

  async expectModule(module: 'ASO' | 'Web View'): Promise<void> {
    await this.expectations.containsText('Niche form: module', this.moduleTrigger, module);
  }

  async expectSubmitEnabled(): Promise<void> {
    await this.expectations.enabled('Niche form: submit enabled', this.submitButton);
  }

  async expectSubmitDisabled(): Promise<void> {
    await this.expectations.disabled('Niche form: submit disabled', this.submitButton);
  }

  async submit(): Promise<void> {
    await this.actions.click('Create niche: submit', this.submitButton);
  }

  async close(): Promise<void> {
    await this.actions.click('Create niche: close', this.closeButton);
    await this.expectations.hidden('Create niche: closed', this.modal);
  }
}
