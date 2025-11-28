import { Page, Locator, expect } from '@playwright/test';

export class ModalComponent {
    page: Page;
    modal: Locator;
    closeButton: Locator;
    title: Locator;

    constructor(page: Page, modalTestId: string) {
        this.page = page;
        this.modal = page.locator(`[data-testid="${modalTestId}"]`);
        this.closeButton = this.modal.locator('[data-testid="login__forgot-password-modal__close"]');
        this.title = this.modal.locator('.modal-title, h2, h3');
    }

    async waitForOpen(): Promise<void> {
        await expect(this.modal).toBeVisible();
    }

    async waitForClose(): Promise<void> {
        await expect(this.modal).not.toBeVisible();
    }

    async close(): Promise<void> {
        if (await this.closeButton.isVisible()) {
            await this.closeButton.click();
        } else {
            await this.closeByClickOutside();
        }
        await this.waitForClose();
    }

    async closeByClickOutside(): Promise<void> {
        await this.page.mouse.click(50, 50);
        await this.waitForClose();
    }

    async closeByOverlay(): Promise<void> {
        await this.closeByClickOutside();
        await this.waitForClose();
    }

    async closeByButton(): Promise<void> {
        await this.closeButton.click();
        await this.waitForClose();
    }

    async closeByEscape(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await this.waitForClose();
    }

    async getTitle(): Promise<string> {
        return await this.title.textContent() || '';
    }

    async forceClose(): Promise<void> {
        const closeMethods = [
            () => this.closeByButton(),
            () => this.closeByEscape(),
            () => this.closeByClickOutside()
        ];

        for (const method of closeMethods) {
            try {
                await method();
                if (!await this.modal.isVisible()) break;
            } catch (error) {
                continue
            }
        }
    }
}