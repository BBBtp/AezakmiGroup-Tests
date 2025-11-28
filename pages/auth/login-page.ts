import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base-page';
import { LoginFormComponent } from '../../components/forms/login-form-component';
import { ForgotPasswordModalComponent } from '../../components/auth/forgot-password-modal-component';
import { PageHeaderComponent } from '../../components/common/login/page-header-component';

export class LoginPage extends BasePage {
    loginForm: LoginFormComponent;
    forgotPasswordModal: ForgotPasswordModalComponent;
    pageHeader: PageHeaderComponent;
    loginContainer: Locator;
    errorMessage: Locator;
    successMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.loginContainer = page.locator('[data-testid="login"]');
        this.loginForm = new LoginFormComponent(page);
        this.forgotPasswordModal = new ForgotPasswordModalComponent(page);
        this.pageHeader = new PageHeaderComponent(page, 'login');
        this.errorMessage = page.locator('.error-message, [role="alert"]');
        this.successMessage = page.locator('.success-message, .notification-success');
    }

    async navigate(): Promise<void> {
        await this.navigateTo('/login');
        await this.waitForPageLoad();
    }

    async waitForPageLoad(): Promise<void> {
        await this.waitForLoad();
        await this.loginForm.waitForFormReady();
        await expect(this.loginContainer).toBeVisible();
    }
    async login(email: string, password: string,options?: { remember?: boolean }): Promise<void> {
        if (options?.remember) {
            const isChecked = await this.loginForm.isRememberMeChecked();
            if (!isChecked) {
                await this.loginForm.toggleRememberMe();
            }
        }
        await this.loginForm.login(email, password);
    }

    async openForgotPasswordModal(): Promise<void> {
        await this.loginForm.forgotPasswordButton.click();
        await this.forgotPasswordModal.waitForOpen();
    }

    async closeForgotPasswordModal(): Promise<void> {
        await this.forgotPasswordModal.close();
    }

    async getErrorMessage(): Promise<string> {
        return await this.errorMessage.textContent() || '';
    }

    async isErrorMessageVisible(): Promise<boolean> {
        return await this.errorMessage.isVisible();
    }

    async verifyPageContent(): Promise<void> {
        await this.pageHeader.verifyContent(
            'Log in to your account',
            'Welcome back! Please enter your credentials to get started'
        );
    }
}