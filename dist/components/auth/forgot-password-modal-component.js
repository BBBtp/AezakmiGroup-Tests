"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotPasswordModalComponent = void 0;
const modal_component_1 = require("../common/modal-component");
class ForgotPasswordModalComponent extends modal_component_1.ModalComponent {
    telegramButton;
    cancelButton;
    constructor(page) {
        super(page, 'login__forgot-password-modal');
        this.telegramButton = this.modal.locator('[data-testid="login__telegram-button"]');
        this.cancelButton = this.modal.locator('[data-testid="login__forgot-password-modal__close"]');
    }
    async openTelegram() {
        await this.telegramButton.click();
    }
    async cancel() {
        await this.close();
    }
    async closeByOverlay() {
        await super.closeByOverlay();
    }
    async closeByButton() {
        await super.closeByButton();
    }
    async getTelegramButtonHref() {
        return await this.telegramButton.getAttribute('href');
    }
}
exports.ForgotPasswordModalComponent = ForgotPasswordModalComponent;
