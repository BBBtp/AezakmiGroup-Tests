import { Page } from '@playwright/test';
import { CardComponent } from '../common/card-component';

export class KpiCardGroupComponent {
    readonly mrrCard: CardComponent;
    readonly scoreCard: CardComponent;
    readonly appsCard: CardComponent;
    constructor(page: Page) {
        this.mrrCard = new CardComponent(page, 'card-mrr');
        this.scoreCard = new CardComponent(page, 'card-score');
        this.appsCard = new CardComponent(page, 'card-applications');
    }

}
