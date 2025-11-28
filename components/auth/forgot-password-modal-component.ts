import { Page, Locator, expect } from '@playwright/test';
import { ModalComponent } from '../common/modal-component';

export class ForgotPasswordModalComponent extends ModalComponent {
     telegramButton: Locator;
     cancelButton: Locator;

    constructor(page: Page) {
        super(page, 'login__forgot-password-modal');
        this.telegramButton = this.modal.locator('[data-testid="login__telegram-button"]');
        this.cancelButton = this.modal.locator('[data-testid="login__forgot-password-modal__close"]');
    }
    async openTelegram(): Promise<void> {
        await this.telegramButton.click();

    }
    async cancel(): Promise<void> {
            await this.close();
    }
    async closeByOverlay(): Promise<void> {
        await super.closeByOverlay();
    }
    async closeByButton(): Promise<void> {
        await super.closeByButton();
    }
    async getTelegramButtonHref(): Promise<string | null> {
        return await this.telegramButton.getAttribute('href');
    }
}