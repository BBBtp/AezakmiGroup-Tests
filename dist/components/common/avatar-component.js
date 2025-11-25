"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarComponent = void 0;
class AvatarComponent {
    root;
    title;
    subtitle;
    sublink;
    tooltip;
    constructor(page, testId) {
        this.root = page.locator(`[data-testid="${testId}"]`);
        this.title = page.locator(`[data-testid="${testId}-title"]`);
        this.subtitle = page.locator(`[data-testid="${testId}-subtitle"]`);
        this.sublink = page.locator(`[data-testid="${testId}-sublink"]`);
        this.tooltip = page.locator(`[data-testid="${testId}-sublink_tooltip"]`);
    }
}
exports.AvatarComponent = AvatarComponent;
