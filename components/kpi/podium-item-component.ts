import { Locator, expect } from '@playwright/test';

export class PodiumItemComponent {
    readonly root: Locator;
    readonly name: Locator;
    readonly currency: Locator;
    //TODO: Добавить локатор для инициала аватара и локатор для места в топе
    constructor(root: Locator, index: number) {
        this.root = root.locator(`[data-testid="podium-${index}"]`);
        this.name = this.root.locator(`[data-testid="podium-${index}__name"]`);
        this.currency = this.root.locator(`[data-testid="podium-${index}__currency"] p`);
    }

    async verify() {
        await expect(this.root).toBeVisible();
        await expect(this.name).toBeVisible();
        await expect(this.currency).toBeVisible();
        const text = await this.currency.textContent();
        await expect(text?.trim().length).toBeGreaterThan(0);

    }
}
