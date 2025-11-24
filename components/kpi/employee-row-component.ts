import { Locator, expect } from '@playwright/test';
import {EmployeeData} from "./kpi-employees-table-component";
import {parseCurrency} from "../../utils/parcer";
export class EmployeeRowComponent {
    readonly rating: Locator;
    readonly avatarLetter: Locator;
    readonly name: Locator;
    readonly sublink: Locator;
    readonly score: Locator;
    readonly mrr: Locator;
    readonly appsNumber: Locator;
    readonly lastModified: Locator;
    readonly openButton: Locator;

    constructor(root: Locator, index: number) {
        this.rating = root.locator(`[data-testid="employees-table__rating-${index}"]`);
        this.avatarLetter = root.locator(`[data-testid="employees-table__avatar-${index}"] p`).first();
        this.name = root.locator(`[data-testid="employees-table__avatar-${index}-title"]`);
        this.sublink = root.locator(`[data-testid="employees-table__avatar-${index}-sublink"]`);
        this.score = root.locator(`[data-testid="employees-table__score-${index}"]`);
        this.mrr = root.locator(`[data-testid="employees-table__mrr-${index}"]`);
        this.appsNumber = root.locator(`[data-testid="employees-table__apps-number-${index}"]`);
        this.lastModified = root.locator(`[data-testid="employees-table__last-modified-${index}"]`);
        this.openButton = root.locator('text=Open').first();
    }

    async verify() {
        await expect(this.rating).toBeVisible();
        await expect(this.avatarLetter).toBeVisible();
        await expect(this.name).toBeVisible();
        await expect(this.score).toBeVisible();
        await expect(this.mrr).toBeVisible();
        await expect(this.appsNumber).toBeVisible();
        await expect(this.lastModified).toBeVisible();
        await expect(this.openButton).toBeVisible();
    }

    async extractData(): Promise<EmployeeData> {
        return {
            rating: Number(await this.rating.textContent()),
            name: (await this.name.textContent())?.trim() ?? "",
            letter: (await this.avatarLetter.textContent())?.trim() ?? "",
            score: Number(await this.score.textContent()),
            mrr: parseCurrency(await this.mrr.textContent()),
            appsNumber: Number(await this.appsNumber.textContent()),
            lastModified: (await this.lastModified.textContent())?.trim() ?? "",
        };
    }


    async verifyAvatarMatchesName() {
        const letter = (await this.avatarLetter.textContent())?.trim() ?? "";
        const name = (await this.name.textContent())?.trim() ?? "";
        await expect(letter).toBe(name.charAt(0));
    }
}
