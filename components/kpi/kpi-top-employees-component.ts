import { Page, Locator } from '@playwright/test';
import { UiObject } from '@framework/ui';
import { kpiTestIds } from '@locators/kpi';
import { PodiumItemComponent } from './podium-item-component';
import { ContenderItemComponent } from './contender-item-component';

/**
 * Компонент блока «Топ сотрудников» (Top Employees) KPI.
 *
 * Page Object для работы с блоком Top Employees.
 * Поддерживает:
 * - заголовок блока;
 * - подиум (топ-3 сотрудников) с отдельными PodiumItemComponent;
 * - список претендентов (contenders) с ContenderItemComponent;
 * - проверки видимости и правильности отображения элементов.
 */
export class KpiTopEmployeesComponent extends UiObject {
  /** Корневой элемент блока Top Employees */
  readonly root: Locator;

  /** Заголовок блока */
  readonly title: Locator;

  /** Контейнер подиума (топ-3 сотрудников) */
  readonly podium: Locator;

  /** Список элементов подиума (3 PodiumItemComponent) */
  readonly podiumItems: PodiumItemComponent[];

  /** Контейнер претендентов */
  readonly contendersRoot: Locator;

  /**
   * @param page Экземпляр страницы Playwright
   */
  constructor(page: Page) {
    super(page);
    this.root = this.locate.testId(kpiTestIds.topEmployees.root);
    const topEmployees = this.locate.within(this.root);
    this.title = topEmployees.testId(kpiTestIds.topEmployees.title);
    this.podium = topEmployees.testId(kpiTestIds.topEmployees.podium);

    this.podiumItems = [
      new PodiumItemComponent(this.podium, 0),
      new PodiumItemComponent(this.podium, 1),
      new PodiumItemComponent(this.podium, 2),
    ];

    this.contendersRoot = topEmployees.testId(kpiTestIds.topEmployees.contenders);
  }

  /**
   * Возвращает количество претендентов
   */
  async getContendersCount(): Promise<number> {
    return this.locate.within(this.contendersRoot).css(kpiTestIds.topEmployees.contendersSelector).count();
  }

  /**
   * Возвращает компонент претендента по индексу
   * @param index индекс претендента
   */
  getContender(index: number): ContenderItemComponent {
    return new ContenderItemComponent(this.contendersRoot, index);
  }

  /**
   * Возвращает массив всех компонентов претендентов
   */
  async getContenders(): Promise<ContenderItemComponent[]> {
    const count = await this.getContendersCount();
    return Array.from({ length: count }, (_, i) => this.getContender(i));
  }

  /**
   * Проверяет видимость блока и заголовка
   * @param expectedTitle ожидаемый текст заголовка
   */
  async verifyVisible(expectedTitle: string): Promise<void> {
    await this.expectations.visible('KPI top employees', this.root);
    await this.expectations.text('KPI top employees title', this.title, expectedTitle);
  }

  /**
   * Проверяет видимость подиума и всех элементов внутри
   */
  async verifyPodium(): Promise<void> {
    await this.expectations.visible('KPI top employees podium', this.podium);
    for (const item of this.podiumItems) {
      await item.verify();
    }
  }

  /**
   * Проверяет видимость претендентов и корректность каждого элемента
   */
  async verifyContenders(): Promise<void> {
    await this.expectations.visible('KPI top employees contenders', this.contendersRoot, {
      timeout: 10000,
    });
    const contendersCount = await this.getContendersCount();
    for (let i = 0; i < contendersCount; i++) {
      const contender = this.getContender(i);
      if ((await contender.root.count()) > 0) {
        await contender.verify();
      }
    }
  }
}
