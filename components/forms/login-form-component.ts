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
    await this.actions.fill('поле электронной почты', this.emailInput, email);
    await this.actions.fill('поле пароля', this.passwordInput, password);
  }

  /**
   * Проверяет видимость ошибки с указанным текстом
   * @param text текст ошибки
   */
  async assertErrorVisible(text: string): Promise<void> {
    const error = this.locate.text(text, { exact: true });
    await this.expectations.visible(`ошибка входа: ${text}`, error, {
      timeout: TestData.timeouts.action,
    });
  }

  /**
   * Проверяет отсутствие ошибки с указанным текстом
   * @param text текст ошибки
   */
  async assertErrorHidden(text: string): Promise<void> {
    const error = this.locate.text(text, { exact: true });
    await this.expectations.hidden(`ошибка входа: ${text}`, error);
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
    await this.actions.click('форма входа: отправить учётные данные', this.submitButton);
  }

  /** Переключает видимость пароля */
  async togglePasswordVisibility(): Promise<void> {
    await this.actions.click('форма входа: изменить видимость пароля', this.toggleButtonPasswordVisibility);
  }

  /** Переключает чекбокс «Запомнить меня» */
  async toggleRememberMe(): Promise<void> {
    await this.actions.click('форма входа: переключить «Запомнить меня»', this.rememberMeCheckbox);
  }

  /** Проверяет, отмечен ли чекбокс «Запомнить меня» */
  async isRememberMeChecked(): Promise<boolean> {
    const isChecked = await this.rememberMeCheckbox.getAttribute('aria-checked');
    return isChecked === 'true';
  }

  /** Ожидает готовность формы к взаимодействию */
  async waitForFormReady(): Promise<void> {
    await this.expectations.visible('форма входа', this.form);
    await this.expectations.visible('поле электронной почты', this.emailInput);
    await this.expectations.visible('кнопка отправки формы входа', this.submitButton);
  }

  async expectPrimaryControlsVisible(): Promise<void> {
    await this.waitForFormReady();
    await this.expectations.visible('поле пароля', this.passwordInput);
    await this.expectations.visible('кнопка восстановления пароля', this.forgotPasswordButton);
  }

  async expectPasswordType(type: 'password' | 'text'): Promise<void> {
    await this.expectations.attribute('тип поля пароля', this.passwordInput, 'type', type);
  }

  async expectRememberMeChecked(checked: boolean): Promise<void> {
    await this.expectations.attribute(
      'состояние флажка «Запомнить меня»',
      this.rememberMeCheckbox,
      'aria-checked',
      String(checked),
    );
  }

  async expectCredentialValues(email: string, password: string): Promise<void> {
    await this.expectations.value('значение поля электронной почты', this.emailInput, email);
    await this.expectations.value('значение поля пароля', this.passwordInput, password);
  }
}
