import { Locator, expect } from '@playwright/test';

export class ContenderItemComponent {
    readonly root: Locator;
    readonly name: Locator;
    readonly currency: Locator;
    readonly avatarLetter: Locator;
    //TODO: Добавить индикатор для места в топе
    constructor(root: Locator, index: number) {
        this.root = root.locator(`[data-testid="contender-${index}"]`);
        this.name = this.root.locator(`[data-testid="contender-${index}__name"]`);
        this.currency = this.root.locator(`[data-testid="contender-${index}__currency"] p`);
        this.avatarLetter = this.root.locator(`[data-testid="contender-${index}-avatar"] p`).first();

    }

    async verify() {
        await expect(this.root).toBeVisible();
        await expect(this.name).toBeVisible();
        await expect(this.currency).toBeVisible();
        await expect(this.avatarLetter).toBeVisible();
        const nameText = (await this.name.textContent())?.trim() || '';
        const avatarText = (await this.avatarLetter.textContent())?.trim() || '';
        const expectedInitial = nameText.charAt(0).toUpperCase();
        await expect(avatarText).toBe(expectedInitial);
    }
}
