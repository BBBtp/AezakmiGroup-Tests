import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base-page';
import { LoginFormComponent } from '../../components/forms/login-form-component';
import { ForgotPasswordModalComponent } from '../../components/auth/forgot-password-modal-component';
import { PageHeaderComponent } from '../../components/common/login/page-header-component';
import { loggedClick } from '../../utils/playwright-logger';

/**
 * Страница логина
 */
export class LoginPage extends BasePage {
    /** Форма логина */
    loginForm: LoginFormComponent;

    /** Модальное окно восстановления пароля */
    forgotPasswordModal: ForgotPasswordModalComponent;

    /** Заголовок страницы */
    pageHeader: PageHeaderComponent;

    /** Контейнер страницы логина */
    loginContainer: Locator;

    /** Блок с сообщением об ошибке */
    errorMessage: Locator;

    /** Блок с успешным сообщением */
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

    /** Переход на страницу логина */
    async navigate(): Promise<void> {
        await this.navigateTo('/login');
        await this.waitForPageLoad();
    }

    /** Ожидание полной загрузки страницы логина */
    async waitForPageLoad(): Promise<void> {
        await this.waitForLoad();
        await this.loginForm.waitForFormReady();
        await expect(this.loginContainer).toBeVisible();
    }

    /**
     * Выполняет вход с заданными учетными данными
     * @param email Email пользователя
     * @param password Пароль пользователя
     * @param options Опции (например, remember me)
     */
    async login(email: string, password: string, options?: { remember?: boolean }): Promise<void> {
        if (options?.remember) {
            const isChecked = await this.loginForm.isRememberMeChecked();
            if (!isChecked) await this.loginForm.toggleRememberMe();
        }
        await this.loginForm.login(email, password);
    }

    /**
     * Вход для глобальной настройки тестов (используется в globalSetup)
     * @param email Email пользователя
     * @param password Пароль пользователя
     * @param options Опции (например, remember me)
     */
    async loginToGlobalSetup(email: string, password: string, options?: { remember?: boolean }): Promise<void> {
        await this.loginForm.waitForFormReady();

        if (options?.remember) {
            const checkboxVisible = await this.loginForm.rememberMeCheckbox
                .isVisible({ timeout: 5000 })
                .catch(() => false);
            if (checkboxVisible) {
                const isChecked = await this.loginForm.isRememberMeChecked();
                if (!isChecked) await this.loginForm.toggleRememberMe();
            }
        }
        await this.loginForm.login(email, password);
    }

    /** Открыть модальное окно "Забыли пароль" */
    async openForgotPasswordModal(): Promise<void> {
        await loggedClick(this.page, 'login: forgot password', this.loginForm.forgotPasswordButton);
        await this.forgotPasswordModal.waitForOpen();
    }

    /** Закрыть модальное окно "Забыли пароль" */
    async closeForgotPasswordModal(): Promise<void> {
        await this.forgotPasswordModal.close();
    }

    /** Получить текст ошибки на странице */
    async getErrorMessage(): Promise<string> {
        return await this.errorMessage.textContent() || '';
    }

    /** Проверить видимость блока ошибки */
    async isErrorMessageVisible(): Promise<boolean> {
        return await this.errorMessage.isVisible();
    }

    /** Проверка контента страницы логина */
    async verifyPageContent(): Promise<void> {
        await this.pageHeader.verifyContent(
            'Log in to your account',
            'Welcome back! Please enter your credentials to get started'
        );
    }
}
