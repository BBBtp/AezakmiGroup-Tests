"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastComponent = void 0;
class ToastComponent {
    root;
    title;
    subtitle;
    constructor(page, testId) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = this.root.locator(`[data-testid$="__alert-title"]`);
        this.subtitle = this.root.locator(`[data-testid$="__alert-subtitle"]`);
    }
}
exports.ToastComponent = ToastComponent;
