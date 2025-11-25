"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionComponent = void 0;
class DescriptionComponent {
    root;
    title;
    message;
    constructor(page, testId) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = this.root.locator(`[data-testid="${testId}__title"]`);
        this.message = this.root.locator(`[data-testid="${testId}__message"]`);
    }
}
exports.DescriptionComponent = DescriptionComponent;
