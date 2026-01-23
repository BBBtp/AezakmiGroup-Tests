import { Page, Locator, expect } from '@playwright/test';
import { PodiumItemComponent } from "./podium-item-component";
import { ContenderItemComponent } from "./contender-item-component";

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
export class KpiTopEmployeesComponent {
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
        this.root = page.locator('[data-testid="top-employees"]');
        this.title = this.root.locator('[data-testid="top-employees__title"]');
        this.podium = this.root.locator('[data-testid="top-employees__podium"]');

        this.podiumItems = [
            new PodiumItemComponent(this.podium, 0),
            new PodiumItemComponent(this.podium, 1),
            new PodiumItemComponent(this.podium, 2),
        ];

        this.contendersRoot = this.root.locator('[data-testid="top-employees__contenders"]');
    }

    /**
     * Возвращает количество претендентов
     */
    async getContendersCount(): Promise<number> {
        return this.contendersRoot
            .locator('[data-testid^="contender-"]:not([data-testid*="avatar"]):not([data-testid*="name"]):not([data-testid*="currency"])')
            .count();
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
        await expect(this.root).toBeVisible();
        await expect(this.title).toHaveText(expectedTitle);
    }

    /**
     * Проверяет видимость подиума и всех элементов внутри
     */
    async verifyPodium(): Promise<void> {
        await expect(this.podium).toBeVisible();
        for (const item of this.podiumItems) {
            await item.verify();
        }
    }

    /**
     * Проверяет видимость претендентов и корректность каждого элемента
     */
    async verifyContenders(): Promise<void> {
        await expect(this.contendersRoot).toBeVisible({ timeout: 10000 });
        const contendersCount = await this.getContendersCount();
        for (let i = 0; i < contendersCount; i++) {
            const contender = this.getContender(i);
            if (await contender.root.count() > 0) {
                await contender.verify();
            }
        }
    }
}
