import { Page, Locator } from '@playwright/test';
import { authTestIds } from '@locators/auth';
import { ModalComponent } from '../common/modal-component';

/**
 * Компонент модального окна «Забыли пароль».
 *
 * Page Object для автотестов на Playwright, инкапсулирующий
 * взаимодействие с модальным окном восстановления пароля.
 *
 * Ответственность компонента:
 * - работа с кнопкой перехода в Telegram;
 * - закрытие модального окна разными способами;
 * - получение ссылки Telegram без перехода.
 */
export class ForgotPasswordModalComponent extends ModalComponent {
  /**
   * Кнопка перехода в Telegram
   */
  telegramButton: Locator;

  /**
   * Кнопка закрытия модального окна
   */
  cancelButton: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page) {
    // Инициализация базового модального компонента
    // login__forgot-password-modal — корневой data-testid модали
    super(page, authTestIds.forgotPasswordModal);

    // Локаторы элементов внутри модального окна
    const modal = this.locate.within(this.modal);
    this.telegramButton = modal.testId(authTestIds.telegramButton);
    this.cancelButton = modal.testId(authTestIds.forgotPasswordCloseButton);
  }

  /**
   * Нажимает на кнопку перехода в Telegram.
   *
   * Используется для:
   * - проверки редиректа;
   * - сценариев восстановления пароля через Telegram.
   */
  async openTelegram(): Promise<void> {
    await this.actions.click('forgot password: open Telegram', this.telegramButton);
  }

  /**
   * Закрывает модальное окно.
   *
   * Семантический алиас для базового метода `close()`,
   * повышающий читаемость тестов.
   */
  async cancel(): Promise<void> {
    await this.close();
  }

  /**
   * Закрывает модальное окно кликом по оверлею.
   */
  async closeByOverlay(): Promise<void> {
    await super.closeByOverlay();
  }

  /**
   * Закрывает модальное окно нажатием на кнопку закрытия.
   */
  async closeByButton(): Promise<void> {
    await super.closeByButton();
  }

  async expectContentVisible(): Promise<void> {
    await this.waitForOpen();
    await this.expectations.visible('forgot password Telegram action', this.telegramButton);
  }

  async expectHidden(): Promise<void> {
    await this.waitForClose();
  }

  async expectTelegramLink(): Promise<void> {
    await this.expectations.attribute(
      'forgot password Telegram link',
      this.telegramButton,
      'href',
      /t\.me|telegram/i,
    );
  }
}
