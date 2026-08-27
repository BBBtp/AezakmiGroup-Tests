import type { Locator, Page } from '@playwright/test';

import { scenarioCheck } from '@framework/assertions';
import { UiObject } from '@framework/ui';
import { productLocators } from '@locators/product';

export type ManualImportLinks = {
  figma: string;
  apphud: string;
};

export class AbTestCreateComponent extends UiObject {
  readonly root: Locator;

  constructor(page: Page) {
    super(page);
    this.root = this.locate.role('main').first();
  }

  async expectInitialUploadVisualStates(): Promise<void> {
    await this.completeGeneralStep();
    await this.advanceToStep('Links');
    await this.completeLinksStep();
    await this.advanceToStep('Technical task');
    await this.advanceToStep('Content');

    const prompt = this.locate
      .within(this.root)
      .text(productLocators.abTests.createForm.uploadPrompt, { exact: true })
      .first();
    await this.expectations.visible('A/B tests create: initial upload prompt', prompt);
    const zone = this.locate.within(prompt).css(productLocators.abTests.createForm.uploadZoneFromPrompt);
    await this.expectations.visible('A/B tests create: initial upload zone', zone);

    const resting = await this.styleToken(zone, 'resting');
    await this.actions.hover('A/B tests create: hover initial upload', zone);
    const hover = await this.styleToken(zone, 'hover');

    await this.actions.hover(
      'A/B tests create: leave initial upload',
      this.locate.within(this.root).role('heading', { name: 'Current', exact: true }),
    );
    await this.actions.run('evaluate', 'A/B tests create: drag enter initial upload', zone, () =>
      zone.evaluate((element) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(new File(['codex'], 'hover.png', { type: 'image/png' }));
        element.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer }));
        element.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer }));
      }),
    );
    const dragHover = await this.styleToken(zone, 'drag hover');
    await this.actions.dispatch('A/B tests create: drag leave initial upload', zone, 'dragleave');

    await scenarioCheck.isTrue('Hover изменяет оформление initial upload', hover !== resting);
    await scenarioCheck.isTrue('Drag-hover изменяет оформление initial upload', dragHover !== resting);
  }

  async requestManualImportPreparation(links: ManualImportLinks): Promise<void> {
    await this.completeGeneralStep('Onboardings');
    await this.advanceToStep('Links');
    await this.completeLinksStep(links);
    await this.advanceToStep('Technical task');
  }

  private async completeLinksStep(links?: ManualImportLinks): Promise<void> {
    await this.actions.fill(
      'A/B tests create: provide Figma link',
      this.locate.within(this.root).role('textbox', {
        name: productLocators.abTests.createForm.figmaLink,
        exact: true,
      }),
      links?.figma ?? 'https://www.figma.com/file/codex-test/ab-test',
    );
    if (links) {
      await this.actions.fill(
        'A/B tests create: provide Apphud link',
        this.locate.within(this.root).role('textbox', {
          name: productLocators.abTests.createForm.apphudLink,
          exact: true,
        }),
        links.apphud,
      );
    }
    await this.actions.check(
      'A/B tests create: require manual initial upload',
      this.locate.within(this.root).role('checkbox', {
        name: productLocators.abTests.createForm.manualContentCheckbox,
        exact: true,
      }),
    );
  }

  private async completeGeneralStep(testTypeOption?: string): Promise<void> {
    await this.expectations.visible(
      'A/B tests create: General step',
      this.locate.within(this.root).role('heading', { name: 'General', exact: true }),
    );
    const comboboxes = this.locate
      .within(this.root)
      .css(productLocators.abTests.createForm.visibleComboboxes);
    await this.expectations.count('A/B tests create: General selectors', comboboxes, 3);
    for (const [index, name] of ['Test type', 'App', 'Niche'].entries()) {
      const combobox = comboboxes.nth(index);
      await this.actions.click(`A/B tests create: open ${name}`, combobox);
      const option =
        index === 0 && testTypeOption
          ? this.locate.role('option', { name: testTypeOption, exact: true })
          : this.locate.css(productLocators.abTests.createForm.visibleOptions).first();
      const optionLabel = index === 0 && testTypeOption ? testTypeOption : `first ${name}`;
      await this.expectations.visible(`A/B tests create: ${optionLabel} option`, option);
      await this.actions.click(`A/B tests create: select ${optionLabel}`, option);
    }
  }

  private async advanceToStep(name: 'Links' | 'Technical task' | 'Content'): Promise<void> {
    const navigation = this.locate
      .within(this.root)
      .css(productLocators.abTests.createForm.navigationButtons);
    const next = navigation.last();
    await this.expectations.enabled(`A/B tests create: continue to ${name}`, next);
    await this.actions.click(`A/B tests create: open ${name} step`, next);
    await this.expectations.visible(
      `A/B tests create: ${name} step`,
      this.locate
        .within(this.root)
        .role('heading', { name: name === 'Content' ? 'Current' : name, exact: true }),
    );
  }

  private styleToken(zone: Locator, state: string): Promise<string> {
    return this.actions.run('evaluate', `A/B tests create: ${state} upload style`, zone, () =>
      zone.evaluate((element) => {
        const style = getComputedStyle(element);
        return [
          style.backgroundColor,
          style.borderColor,
          style.boxShadow,
          style.outlineColor,
          style.outlineStyle,
        ].join('|');
      }),
    );
  }
}
