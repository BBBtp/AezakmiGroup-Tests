"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeRowComponent = void 0;
const test_1 = require("@playwright/test");
const parcer_1 = require("../../utils/parcer");
class EmployeeRowComponent {
    rating;
    avatarLetter;
    name;
    sublink;
    score;
    mrr;
    appsNumber;
    lastModified;
    openButton;
    constructor(root, index) {
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
        await (0, test_1.expect)(this.rating).toBeVisible();
        await (0, test_1.expect)(this.avatarLetter).toBeVisible();
        await (0, test_1.expect)(this.name).toBeVisible();
        await (0, test_1.expect)(this.score).toBeVisible();
        await (0, test_1.expect)(this.mrr).toBeVisible();
        await (0, test_1.expect)(this.appsNumber).toBeVisible();
        await (0, test_1.expect)(this.lastModified).toBeVisible();
        await (0, test_1.expect)(this.openButton).toBeVisible();
    }
    async extractData() {
        return {
            rating: Number(await this.rating.textContent()),
            name: (await this.name.textContent())?.trim() ?? "",
            letter: (await this.avatarLetter.textContent())?.trim() ?? "",
            score: Number(await this.score.textContent()),
            mrr: (0, parcer_1.parseCurrency)(await this.mrr.textContent()),
            appsNumber: Number(await this.appsNumber.textContent()),
            lastModified: (await this.lastModified.textContent())?.trim() ?? "",
        };
    }
    async verifyAvatarMatchesName() {
        const letter = (await this.avatarLetter.textContent())?.trim() ?? "";
        const name = (await this.name.textContent())?.trim() ?? "";
        await (0, test_1.expect)(letter).toBe(name.charAt(0));
    }
}
exports.EmployeeRowComponent = EmployeeRowComponent;
