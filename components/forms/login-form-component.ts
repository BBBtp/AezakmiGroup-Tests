import { type Page, type Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { authTestIds } from '@locators/auth';
import TestData from '../../fixtures/test-data';

/**
 * Компонент формы логина.
 *
 * Page Object для работы с формой входа на страницу.
 * Поддерживает:
 * - ввод email и пароля;
 * - переключение видимости пароля;
 * - работу с чекбоксом «Запомнить меня»;
 * - кнопки отправки и восстановления пароля;
 * - проверку ошибок валидации.
 */
export class LoginFormComponent extends UiObject {
  /** Корневой элемент формы */
  form: Locator;

  /** Поле ввода email */
  emailInput: Locator;

  /** Поле ввода пароля */
  passwordInput: Locator;

  /** Кнопка переключения видимости пароля */
  toggleButtonPasswordVisibility: Locator;

  /** Чекбокс «Запомнить меня» */
  rememberMeCheckbox: Locator;

  /** Кнопка отправки формы */
  submitButton: Locator;

  /** Кнопка «Забыли пароль?» */
  forgotPasswordButton: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page) {
    super(page);
    this.form = this.locate.testId(authTestIds.form);
    this.emailInput = this.locate.testId(authTestIds.emailInput);
    this.passwordInput = this.locate.testId(authTestIds.passwordInput);
    this.toggleButtonPasswordVisibility = this.locate.testId(authTestIds.passwordVisibilityButton);
    this.rememberMeCheckbox = this.locate.testId(authTestIds.rememberMeCheckbox);
    this.submitButton = this.locate.testId(authTestIds.submitButton);
    this.forgotPasswordButton = this.locate.testId(authTestIds.forgotPasswordButton);
  }

  /**
   * Заполняет поля email и пароль
   *
   * @param email email пользователя
   * @param password пароль пользователя
   */
  async fillCredentials(email: string, password: string): Promise<void> {
    await this.actions.fill('login email', this.emailInput, email);
    await this.actions.fill('login password', this.passwordInput, password);
  }

  /**
   * Проверяет видимость ошибки с указанным текстом
   * @param text текст ошибки
   */
  async assertErrorVisible(text: string): Promise<void> {
    const error = this.locate.text(text, { exact: true });
    await this.expectations.visible(`login error: ${text}`, error, {
      timeout: TestData.timeouts.action,
    });
  }

  /**
   * Проверяет отсутствие ошибки с указанным текстом
   * @param text текст ошибки
   */
  async assertErrorHidden(text: string): Promise<void> {
    const error = this.locate.text(text, { exact: true });
    await this.expectations.hidden(`login error: ${text}`, error);
  }

  /** Проверяет отображение ошибки «Неверный email» */
  async assertInvalidEmailError(): Promise<void> {
    await this.assertErrorVisible(TestData.texts.login.errorLabels.invalidEmail);
  }

  /** Проверяет отображение ошибки «Неверный пароль» */
  async assertInvalidPasswordError(): Promise<void> {
    await this.assertErrorVisible(TestData.texts.login.errorLabels.invalidPassword);
  }

  /** Проверяет отсутствие ошибки «Неверный email» */
  async assertNoEmailError(): Promise<void> {
    await this.assertErrorHidden(TestData.texts.login.errorLabels.invalidEmail);
  }

  /** Проверяет отсутствие ошибки «Неверный пароль» */
  async assertNoPasswordError(): Promise<void> {
    await this.assertErrorHidden(TestData.texts.login.errorLabels.invalidPassword);
  }

  /**
   * Выполняет вход, заполняя email и пароль, и нажимая Submit
   * @param email email пользователя
   * @param password пароль пользователя
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async submit(): Promise<void> {
    await this.actions.click('login: submit credentials', this.submitButton);
  }

  /** Переключает видимость пароля */
  async togglePasswordVisibility(): Promise<void> {
    await this.actions.click('login: toggle password visibility', this.toggleButtonPasswordVisibility);
  }

  /** Переключает чекбокс «Запомнить меня» */
  async toggleRememberMe(): Promise<void> {
    await this.actions.click('login: toggle remember me', this.rememberMeCheckbox);
  }

  /** Проверяет, отмечен ли чекбокс «Запомнить меня» */
  async isRememberMeChecked(): Promise<boolean> {
    const isChecked = await this.rememberMeCheckbox.getAttribute('aria-checked');
    return isChecked === 'true';
  }

  /** Возвращает текущее значение поля email */
  async getEmailValue(): Promise<string> {
    return await this.emailInput.inputValue();
  }

  /** Возвращает текущее значение поля пароль */
  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  /** Возвращает тип поля пароля ('password' или 'text') */
  async getPasswordType(): Promise<string> {
    return (await this.passwordInput.getAttribute('type')) || 'password';
  }

  /** Проверяет, что кнопка Submit активна */
  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /** Ожидает готовность формы к взаимодействию */
  async waitForFormReady(): Promise<void> {
    await this.expectations.visible('login form', this.form);
    await this.expectations.visible('login email input', this.emailInput);
    await this.expectations.visible('login submit action', this.submitButton);
  }

  async expectPrimaryControlsVisible(): Promise<void> {
    await this.waitForFormReady();
    await this.expectations.visible('login password input', this.passwordInput);
    await this.expectations.visible('login forgot password action', this.forgotPasswordButton);
  }

  async expectPasswordType(type: 'password' | 'text'): Promise<void> {
    await this.expectations.attribute('login password input type', this.passwordInput, 'type', type);
  }
}
