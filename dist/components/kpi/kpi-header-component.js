"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiHeaderComponent = void 0;
class KpiHeaderComponent {
    root;
    settingsButton;
    subtitle;
    errorBlock;
    constructor(page) {
        this.root = page.locator('[data-testid="kpi"]');
        this.settingsButton = this.root.locator('[data-testid="settings-button"]');
        this.subtitle = this.root.locator('[data-testid="subtitle"]');
        this.errorBlock = this.root.locator('[data-testid="error-content"]');
    }
}
exports.KpiHeaderComponent = KpiHeaderComponent;
