import { type Page, type Locator } from '@playwright/test';
import { authSelectors, authTestIds, authText } from '@locators/auth';
import { BasePage } from '../base-page';
import { LoginFormComponent } from '../../components/forms/login-form-component';
import { ForgotPasswordModalComponent } from '../../components/auth/forgot-password-modal-component';
import { PageHeaderComponent } from '../../components/common/login/page-header-component';

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
    this.loginContainer = this.locate.testId(authTestIds.page);
    this.loginForm = new LoginFormComponent(page);
    this.forgotPasswordModal = new ForgotPasswordModalComponent(page);
    this.pageHeader = new PageHeaderComponent(page, {
      container: authTestIds.page,
      title: authTestIds.title,
      subtitle: authTestIds.subtitle,
    });
    this.errorMessage = this.locate.css(authSelectors.errorMessage);
    this.successMessage = this.locate.css(authSelectors.successMessage);
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
    await this.expectations.visible('login page', this.loginContainer);
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

  /** Выполняет вход для Playwright setup-project. */
  async loginForSetup(email: string, password: string): Promise<void> {
    await this.loginForm.waitForFormReady();
    await this.loginForm.login(email, password);
  }

  /** Открыть модальное окно "Забыли пароль" */
  async openForgotPasswordModal(): Promise<void> {
    await this.actions.click('login: forgot password', this.loginForm.forgotPasswordButton);
    await this.forgotPasswordModal.waitForOpen();
  }

  /** Закрыть модальное окно "Забыли пароль" */
  async closeForgotPasswordModal(): Promise<void> {
    await this.forgotPasswordModal.close();
  }

  /** Получить текст ошибки на странице */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || '';
  }

  /** Проверить видимость блока ошибки */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /** Проверка контента страницы логина */
  async verifyPageContent(): Promise<void> {
    await this.pageHeader.verifyContent(authText.title, authText.subtitle);
  }

  async expectPageVisible(): Promise<void> {
    await this.expectations.url('login URL', /login/);
    await this.expectations.visible('login page', this.loginContainer);
  }

  async expectPrimaryControlsVisible(): Promise<void> {
    await this.verifyPageContent();
    await this.loginForm.expectPrimaryControlsVisible();
  }

  async expectErrorVisible(): Promise<void> {
    await this.expectations.visible('login error message', this.errorMessage);
  }

  async expectAuthenticated(): Promise<void> {
    await this.expectations.url('authenticated dashboard URL', /dashboard/);
  }
}
