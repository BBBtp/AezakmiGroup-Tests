"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiCardGroupComponent = void 0;
const card_component_1 = require("../common/card-component");
class KpiCardGroupComponent {
    mrrCard;
    scoreCard;
    appsCard;
    constructor(page) {
        this.mrrCard = new card_component_1.CardComponent(page, 'card-mrr');
        this.scoreCard = new card_component_1.CardComponent(page, 'card-score');
        this.appsCard = new card_component_1.CardComponent(page, 'card-applications');
    }
}
exports.KpiCardGroupComponent = KpiCardGroupComponent;
