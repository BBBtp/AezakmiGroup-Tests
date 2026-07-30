import { type Page, type Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { commonComponentSelectors } from '@locators/common';

/**
 * Базовый компонент модального окна.
 *
 * Предоставляет универсальные методы для:
 * - ожидания открытия и закрытия модали;
 * - закрытия модали различными способами;
 * - получения заголовка модального окна;
 * - принудительного закрытия (forceClose).
 *
 * Этот компонент используется как базовый для всех Page Object модалей.
 */
export class ModalComponent extends UiObject {
  /**
   * Корневой элемент модального окна
   */
  modal: Locator;

  /**
   * Кнопка закрытия модального окна
   */
  closeButton: Locator;

  /**
   * Заголовок модального окна
   */
  title: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   * @param modalTestId data-testid корневого модального окна
   */
  constructor(page: Page, modalTestId: string) {
    super(page);
    const selectors = commonComponentSelectors.modal(modalTestId);

    // Корень модального окна
    this.modal = this.locate.testId(selectors.root);

    // Кнопка закрытия модального окна
    const modal = this.locate.within(this.modal);
    this.closeButton = modal.css(selectors.close).first();

    // Заголовок модального окна
    this.title = modal.css(selectors.title);
  }

  /**
   * Ожидает открытия модального окна
   */
  async waitForOpen(): Promise<void> {
    await this.expectations.visible('modal', this.modal);
  }

  /**
   * Ожидает закрытия модального окна
   */
  async waitForClose(): Promise<void> {
    await this.expectations.hidden('modal', this.modal);
  }

  /**
   * Закрывает модальное окно безопасным образом:
   * через кнопку или клик вне модали.
   */
  async close(): Promise<void> {
    if (await this.closeButton.isVisible()) {
      await this.actions.click('modal: close button', this.closeButton);
    } else {
      await this.closeByClickOutside();
    }
    await this.waitForClose();
  }

  /**
   * Закрывает модальное окно кликом вне него
   */
  async closeByClickOutside(): Promise<void> {
    await this.actions.run('click', 'modal: click outside', this.modal, () => this.page.mouse.click(1, 1));
    if (await this.modal.isVisible().catch(() => false)) {
      await this.actions.run('press', 'modal: Escape', this.modal, () => this.page.keyboard.press('Escape'));
      if (await this.modal.isVisible().catch(() => false)) {
        await this.actions.run('click', 'modal: second click outside', this.modal, () =>
          this.page.mouse.click(1, 1),
        );
      }
    }
    await this.waitForClose();
  }

  /**
   * Закрывает модальное окно через оверлей (клик вне модали)
   */
  async closeByOverlay(): Promise<void> {
    await this.closeByClickOutside();
  }

  /**
   * Закрывает модальное окно через кнопку закрытия
   */
  async closeByButton(): Promise<void> {
    await this.expectations.visible('modal close action', this.closeButton);
    await this.actions.click('modal: close button', this.closeButton);
    await this.waitForClose();
  }

  /**
   * Закрывает модальное окно нажатием Escape
   */
  async closeByEscape(): Promise<void> {
    await this.actions.run('press', 'modal: Escape', this.modal, () => this.page.keyboard.press('Escape'));
    await this.waitForClose();
  }

  /**
   * Возвращает текст заголовка модального окна
   *
   * @returns текст заголовка или пустую строку
   */
  async getTitle(): Promise<string> {
    return (await this.title.textContent()) || '';
  }

  /**
   * Принудительно закрывает модальное окно,
   * перебирая разные методы закрытия.
   */
  async forceClose(): Promise<void> {
    const closeMethods = [
      () => this.closeByButton(),
      () => this.closeByEscape(),
      () => this.closeByClickOutside(),
    ];

    for (const method of closeMethods) {
      try {
        await method();
        if (!(await this.modal.isVisible())) break;
      } catch {
        continue;
      }
    }
  }
}
