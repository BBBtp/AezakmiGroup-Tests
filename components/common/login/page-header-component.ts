import { Page, Locator, expect } from '@playwright/test';

export class PageHeaderComponent {
    page: Page;
    title: Locator;
    subtitle: Locator;

    constructor(page: Page, containerTestId: string) {
        this.page = page;
        const container = page.locator(`[data-testid="${containerTestId}"]`);
        this.title = container.locator('[data-testid="login__title"]');
        this.subtitle = container.locator('[data-testid="login__subtitle"]');
    }

    async getTitle(): Promise<string> {
        return await this.title.textContent() || '';
    }

    async getSubtitle(): Promise<string> {
        return await this.subtitle.textContent() || '';
    }

    async verifyContent(expectedTitle: string, expectedSubtitle?: string): Promise<void> {
        await expect(this.title).toHaveText(expectedTitle);
        if (expectedSubtitle) {
            await expect(this.subtitle).toHaveText(expectedSubtitle);
        }
    }
}