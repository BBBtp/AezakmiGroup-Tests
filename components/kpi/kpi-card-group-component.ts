import { Page } from '@playwright/test';
import { CardComponent } from '../common/card-component';

/**
 * Компонент группы KPI карточек.
 *
 * Page Object для работы с блоком карточек KPI.
 * Поддерживает работу с отдельными карточками:
 * - MRR (Monthly Recurring Revenue)
 * - Score (баллы)
 * - Applications (количество приложений)
 *
 * Каждый CardComponent предоставляет свои методы для проверки видимости
 * и извлечения данных.
 */
export class KpiCardGroupComponent {
  /** Карточка MRR */
  readonly mrrCard: CardComponent;

  /** Карточка Score */
  readonly scoreCard: CardComponent;

  /** Карточка Applications */
  readonly appsCard: CardComponent;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page) {
    this.mrrCard = new CardComponent(page, 'card-mrr');
    this.scoreCard = new CardComponent(page, 'card-score');
    this.appsCard = new CardComponent(page, 'card-applications');
  }
}
