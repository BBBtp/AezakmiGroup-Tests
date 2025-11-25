"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarningComponent = void 0;
class WarningComponent {
    root;
    constructor(page, testId = 'month-end-warning') {
        this.root = page.locator(`[data-testid="${testId}"]`);
    }
}
exports.WarningComponent = WarningComponent;
