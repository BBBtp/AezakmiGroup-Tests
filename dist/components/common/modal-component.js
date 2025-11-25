"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalComponent = void 0;
const test_1 = require("@playwright/test");
class ModalComponent {
    page;
    modal;
    closeButton;
    title;
    constructor(page, modalTestId) {
        this.page = page;
        this.modal = page.locator(`[data-testid="${modalTestId}"]`);
        this.closeButton = this.modal.locator('[data-testid="login__forgot-password-modal__close"]');
        this.title = this.modal.locator('.modal-title, h2, h3');
    }
    async waitForOpen() {
        await (0, test_1.expect)(this.modal).toBeVisible();
    }
    async waitForClose() {
        await (0, test_1.expect)(this.modal).not.toBeVisible();
    }
    async close() {
        if (await this.closeButton.isVisible()) {
            await this.closeButton.click();
        }
        else {
            await this.closeByClickOutside();
        }
        await this.waitForClose();
    }
    async closeByClickOutside() {
        await this.page.mouse.click(50, 50);
        await this.waitForClose();
    }
    async closeByOverlay() {
        await this.closeByClickOutside();
        await this.waitForClose();
    }
    async closeByButton() {
        await this.closeButton.click();
        await this.waitForClose();
    }
    async closeByEscape() {
        await this.page.keyboard.press('Escape');
        await this.waitForClose();
    }
    async getTitle() {
        return await this.title.textContent() || '';
    }
    // Универсальный метод который пробует все способы закрытия
    async forceClose() {
        const closeMethods = [
            () => this.closeByButton(),
            () => this.closeByEscape(),
            () => this.closeByClickOutside()
        ];
        for (const method of closeMethods) {
            try {
                await method();
                if (!await this.modal.isVisible())
                    break;
            }
            catch (error) {
                continue;
            }
        }
    }
}
exports.ModalComponent = ModalComponent;
