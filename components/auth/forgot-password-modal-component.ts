import { Page, Locator } from '@playwright/test';
import { ModalComponent } from '../common/modal-component';
import { loggedClick } from '../../utils/playwright-logger';

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
    super(page, 'login__forgot-password-modal');

    // Локаторы элементов внутри модального окна
    this.telegramButton = this.modal.locator('[data-testid="login__telegram-button"]');
    this.cancelButton = this.modal.locator('[data-testid="login__forgot-password-modal__close"]');
  }

  /**
   * Нажимает на кнопку перехода в Telegram.
   *
   * Используется для:
   * - проверки редиректа;
   * - сценариев восстановления пароля через Telegram.
   */
  async openTelegram(): Promise<void> {
    await loggedClick(this.page, 'forgot password: open Telegram', this.telegramButton);
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

  /**
   * Возвращает значение атрибута `href` у кнопки Telegram.
   *
   * @returns ссылка Telegram или `null`, если атрибут отсутствует
   *
   * Используется для проверки корректности ссылки
   * без фактического перехода.
   */
  async getTelegramButtonHref(): Promise<string | null> {
    return await this.telegramButton.getAttribute('href');
  }
}
