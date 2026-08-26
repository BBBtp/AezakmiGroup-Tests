import { type Page } from '@playwright/test';

import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import {
  TopKeywordsOverviewComponent,
  type TopKeywordsCountry,
  type TopKeywordsState,
} from '../../components/keywords/top-keywords-overview-component';
import { BasePage } from '../base-page';

export class TopKeywordsPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: TopKeywordsOverviewComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new TopKeywordsOverviewComponent(page);
  }

  async openRoute(): Promise<void> {
    await this.navigateTo('/keywords');
    await this.overview.expectShellLoaded();
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Top-3000', '/keywords', 'Keywords');
    await this.overview.expectBusinessControls();
  }

  expectFilterControls(): Promise<void> {
    return this.overview.expectFilterControls();
  }

  tableSnapshot(): Promise<string> {
    return this.overview.tableSnapshot();
  }

  selectStateAndExpectUpdate(state: TopKeywordsState, previous: string): Promise<string> {
    return this.overview.selectStateAndExpectUpdate(state, previous);
  }

  selectStateAndExpectSnapshot(state: TopKeywordsState, snapshot: string): Promise<void> {
    return this.overview.selectStateAndExpectSnapshot(state, snapshot);
  }

  expectRegionalTabsSwitchable(countries: readonly TopKeywordsCountry[]): Promise<void> {
    return this.overview.expectRegionalTabsSwitchable(countries);
  }

  expectTableInteractions(): Promise<void> {
    return this.overview.expectTableInteractions();
  }

  expectTranslateAllRoundTrip(): Promise<void> {
    return this.overview.expectTranslateAllRoundTrip();
  }
}
