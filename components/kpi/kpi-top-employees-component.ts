import { Page, Locator, expect } from '@playwright/test';
import { PodiumItemComponent } from "./podium-item-component";
import { ContenderItemComponent } from "./contender-item-component";

export class KpiTopEmployeesComponent {
    readonly root: Locator;
    readonly title: Locator;
    readonly podium: Locator;
    readonly podiumItems: PodiumItemComponent[];
    readonly contendersRoot: Locator;

    constructor(page: Page) {
        this.root = page.locator('[data-testid="top-employees"]');
        this.title = this.root.locator('[data-testid="top-employees__title"]');
        this.podium = this.root.locator('[data-testid="top-employees__podium"]');

        this.podiumItems = [
            new PodiumItemComponent(this.podium, 0),
            new PodiumItemComponent(this.podium, 1),
            new PodiumItemComponent(this.podium, 2),
        ];

        this.contendersRoot = this.root.locator('[data-testid="top-employees__contenders"]');
    }

    async getContendersCount(): Promise<number> {
        return this.contendersRoot.locator('[data-testid^="contender-"]:not([data-testid*="avatar"]):not([data-testid*="name"]):not([data-testid*="currency"])').count();
    }

    getContender(index: number): ContenderItemComponent {
        return new ContenderItemComponent(this.contendersRoot, index);
    }

    async getContenders(): Promise<ContenderItemComponent[]> {
        const count = await this.getContendersCount();
        return Array.from({ length: count }, (_, i) => this.getContender(i));
    }

    async verifyVisible(expectedTitle: string) {
        await expect(this.root).toBeVisible();
        await expect(this.title).toHaveText(expectedTitle);
    }

    async verifyPodium() {
        await expect(this.podium).toBeVisible();
        for (const item of this.podiumItems) {
            await item.verify();
        }
    }

    async verifyContenders() {
        await expect(this.contendersRoot).toBeVisible({ timeout: 10000 });
        const contendersCount = await this.getContendersCount();
        for (let i = 0; i < contendersCount; i++) {
            const contender = this.getContender(i);
            if (await contender.root.count() > 0) {
                await contender.verify();
            }
        }
    }
}
