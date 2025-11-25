"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginFormComponent = void 0;
const test_1 = require("@playwright/test");
const test_data_1 = __importDefault(require("../../fixtures/test-data"));
class LoginFormComponent {
    page;
    form;
    emailInput;
    passwordInput;
    toggleButtonPasswordVisibility;
    rememberMeCheckbox;
    submitButton;
    forgotPasswordButton;
    passwordVisibilityToggle;
    constructor(page) {
        this.page = page;
        this.form = page.locator('[data-testid="login__form"]');
        this.emailInput = page.locator('[data-testid="login__email-input"]');
        this.passwordInput = page.locator('[data-testid="login__password-input"]');
        this.toggleButtonPasswordVisibility = page.locator('[data-testid="login__password-input__eye-btn"]');
        this.rememberMeCheckbox = page.locator('[data-testid="login__remember-me-checkbox"]');
        this.submitButton = page.locator('[data-testid="login__submit-button"]');
        this.forgotPasswordButton = page.locator('[data-testid="login__forgot-password-button"]');
        this.passwordVisibilityToggle = page.locator('[data-testid="login__password-input__eye-btn"]');
    }
    async fillCredentials(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
    }
    async assertErrorVisible(text) {
        const error = this.page.locator(`p:has-text("${text}")`);
        await (0, test_1.expect)(error).toBeVisible({ timeout: test_data_1.default.timeouts.action });
    }
    async assertErrorHidden(text) {
        const error = this.page.locator(`p:has-text("${text}")`);
        await (0, test_1.expect)(error).not.toBeVisible();
    }
    async assertInvalidEmailError() {
        await this.assertErrorVisible(test_data_1.default.texts.login.errorLabels.invalidEmail);
    }
    async assertInvalidPasswordError() {
        await this.assertErrorVisible(test_data_1.default.texts.login.errorLabels.invalidPassword);
    }
    async assertNoEmailError() {
        // Проверяет что НЕТ ошибки email
        await this.assertErrorHidden(test_data_1.default.texts.login.errorLabels.invalidEmail);
    }
    async assertNoPasswordError() {
        // Проверяет что НЕТ ошибки пароля
        await this.assertErrorHidden(test_data_1.default.texts.login.errorLabels.invalidPassword);
    }
    async login(email, password) {
        await this.fillCredentials(email, password);
        await this.submitButton.click();
    }
    async togglePasswordVisibility() {
        await this.passwordVisibilityToggle.click();
    }
    async toggleRememberMe() {
        const checkboxButton = this.rememberMeCheckbox.locator('button[role="checkbox"]');
        await checkboxButton.click();
    }
    async isRememberMeChecked() {
        const checkboxButton = this.rememberMeCheckbox.locator('button[role="checkbox"]');
        const isChecked = await checkboxButton.getAttribute('aria-checked');
        return isChecked === 'true';
    }
    async getEmailValue() {
        return await this.emailInput.inputValue();
    }
    async getPasswordValue() {
        return await this.passwordInput.inputValue();
    }
    async getPasswordType() {
        return await this.passwordInput.getAttribute('type') || 'password';
    }
    async isSubmitButtonEnabled() {
        return await this.submitButton.isEnabled();
    }
    async waitForFormReady() {
        await (0, test_1.expect)(this.form).toBeVisible();
        await (0, test_1.expect)(this.emailInput).toBeVisible();
        await (0, test_1.expect)(this.submitButton).toBeVisible();
    }
}
exports.LoginFormComponent = LoginFormComponent;
