import { Page, Locator, expect } from '@playwright/test';
import TestData from "../../fixtures/test-data";

export class LoginFormComponent {
    page: Page;
    form: Locator;
    emailInput: Locator;
    passwordInput: Locator;
    toggleButtonPasswordVisibility: Locator;
    rememberMeCheckbox: Locator;
    submitButton: Locator;
    forgotPasswordButton: Locator;
    passwordVisibilityToggle: Locator;
    constructor(page: Page) {
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

    async fillCredentials(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
    }

    async assertErrorVisible(text: string): Promise<void> {
        const error = this.page.locator(`p:has-text("${text}")`);
        await expect(error).toBeVisible({ timeout: TestData.timeouts.action });
    }

    async assertErrorHidden(text: string): Promise<void> {
        const error = this.page.locator(`p:has-text("${text}")`);
        await expect(error).not.toBeVisible();
    }

    async assertInvalidEmailError(): Promise<void> {
        await this.assertErrorVisible(TestData.texts.login.errorLabels.invalidEmail);
    }

    async assertInvalidPasswordError(): Promise<void> {
        await this.assertErrorVisible(TestData.texts.login.errorLabels.invalidPassword);
    }

    async assertNoEmailError(): Promise<void> {
        await this.assertErrorHidden(TestData.texts.login.errorLabels.invalidEmail);
    }

    async assertNoPasswordError(): Promise<void> {
        await this.assertErrorHidden(TestData.texts.login.errorLabels.invalidPassword);
    }

    async login(email: string, password: string): Promise<void> {
        await this.fillCredentials(email, password);
        await this.submitButton.click();
    }

    async togglePasswordVisibility(): Promise<void> {
        await this.passwordVisibilityToggle.click();
    }

    async toggleRememberMe(): Promise<void> {
        const checkboxButton = this.rememberMeCheckbox.locator('button[role="checkbox"]');
        await checkboxButton.click();
    }

    async isRememberMeChecked(): Promise<boolean> {
        const checkboxButton = this.rememberMeCheckbox.locator('button[role="checkbox"]');
        const isChecked = await checkboxButton.getAttribute('aria-checked');
        return isChecked === 'true';
    }

    async getEmailValue(): Promise<string> {
        return await this.emailInput.inputValue();
    }

    async getPasswordValue(): Promise<string> {
        return await this.passwordInput.inputValue();
    }

    async getPasswordType(): Promise<string> {
        return await this.passwordInput.getAttribute('type') || 'password';
    }

    async isSubmitButtonEnabled(): Promise<boolean> {
        return await this.submitButton.isEnabled();
    }

    async waitForFormReady(): Promise<void> {
        await expect(this.form).toBeVisible();
        await expect(this.emailInput).toBeVisible();
        await expect(this.submitButton).toBeVisible();
    }
}