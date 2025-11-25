"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = void 0;
const test_1 = require("@playwright/test");
const base_page_1 = require("../base-page");
const login_form_component_1 = require("../../components/forms/login-form-component");
const forgot_password_modal_component_1 = require("../../components/auth/forgot-password-modal-component");
const page_header_component_1 = require("../../components/common/login/page-header-component");
class LoginPage extends base_page_1.BasePage {
    loginForm;
    forgotPasswordModal;
    pageHeader;
    // Корневой контейнер
    loginContainer;
    // Уведомления и ошибки
    errorMessage;
    successMessage;
    constructor(page) {
        super(page);
        this.loginContainer = page.locator('[data-testid="login"]');
        this.loginForm = new login_form_component_1.LoginFormComponent(page);
        this.forgotPasswordModal = new forgot_password_modal_component_1.ForgotPasswordModalComponent(page);
        this.pageHeader = new page_header_component_1.PageHeaderComponent(page, 'login');
        this.errorMessage = page.locator('.error-message, [role="alert"]');
        this.successMessage = page.locator('.success-message, .notification-success');
    }
    async navigate() {
        await this.navigateTo('/login');
        await this.waitForPageLoad();
    }
    async waitForPageLoad() {
        await this.waitForLoad();
        await this.loginForm.waitForFormReady();
        await (0, test_1.expect)(this.loginContainer).toBeVisible();
    }
    async login(email, password, options) {
        if (options?.remember) {
            const isChecked = await this.loginForm.isRememberMeChecked();
            if (!isChecked) {
                await this.loginForm.toggleRememberMe();
            }
        }
        await this.loginForm.login(email, password);
    }
    async openForgotPasswordModal() {
        await this.loginForm.forgotPasswordButton.click();
        await this.forgotPasswordModal.waitForOpen();
    }
    async closeForgotPasswordModal() {
        await this.forgotPasswordModal.close();
    }
    async getErrorMessage() {
        return await this.errorMessage.textContent() || '';
    }
    async isErrorMessageVisible() {
        return await this.errorMessage.isVisible();
    }
    async verifyPageContent() {
        await this.pageHeader.verifyContent('Log in to your account', 'Welcome back! Please enter your credentials to get started');
    }
}
exports.LoginPage = LoginPage;
