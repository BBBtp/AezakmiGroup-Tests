import { Page, Locator, expect } from '@playwright/test';

export class CardComponent {
    readonly root: Locator;
    readonly title: Locator;
    readonly mainValue: Locator;
    readonly absValue: Locator;
    readonly percentValue: Locator;
    readonly period: Locator;

    constructor(page: Page, testId: string) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = this.root.locator(`[data-testid="${testId}__title"]`);
        this.mainValue = this.root.locator(`[data-testid^="${testId}__"][data-testid$="currency"], [data-testid$="main"]`);
        this.absValue = this.root.locator(`[data-testid="${testId}__abs"]`);
        this.percentValue = this.root.locator(`[data-testid="${testId}__percentage-value"]`);
        this.period = this.root.locator(`[data-testid="${testId}__period"]`);
    }

    /** Ассерты на видимость элементов карточки */
    async assertVisible(cardTitle: string) {
        await expect(this.root).toBeVisible();
        await expect(this.title).toBeVisible();
        await expect(this.title).toHaveText(cardTitle)
        await expect(this.mainValue).toBeVisible();
        await expect(this.absValue).toBeVisible();
        await expect(this.percentValue).toBeVisible();
        await expect(this.period).toBeVisible();
    }

}
