import { type Page } from '@playwright/test';

import { nichesTestIds } from '@locators/master-sections';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { NichesOverviewComponent } from '../../components/niches/niches-overview-component';
import { NicheCreateComponent } from '../../components/niches/niche-create-component';
import { NicheDetailComponent } from '../../components/niches/niche-detail-component';
import { NicheEditComponent } from '../../components/niches/niche-edit-component';
import { SortedAppsOverviewComponent } from '../../components/niches/sorted-apps-overview-component';
import { BasePage } from '../base-page';

export class NichesPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly overview: NichesOverviewComponent;
  readonly sortedApps: SortedAppsOverviewComponent;
  readonly asoMobileCreate: SortedAppsOverviewComponent['asoMobileCreate'];
  readonly create: NicheCreateComponent;
  readonly edit: NicheEditComponent;
  readonly detail: NicheDetailComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.overview = new NichesOverviewComponent(page);
    this.sortedApps = new SortedAppsOverviewComponent(page);
    this.asoMobileCreate = this.sortedApps.asoMobileCreate;
    this.create = new NicheCreateComponent(page);
    this.edit = new NicheEditComponent(page);
    this.detail = new NicheDetailComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Niche list', '/niche-list', 'Niches');
    await this.overview.expectBusinessControls();
  }

  async navigateToList(): Promise<void> {
    await this.navigateTo('/niche-list');
    await this.expectations.url('Niches: list URL', /\/niche-list$/);
  }

  async expectListLoading(): Promise<void> {
    await this.expectations.visible('Niches loading: application main', this.locate.role('main'));
    await this.expectations.disabled('Niches loading: search disabled', this.overview.search);
    await this.expectations.count('Niches loading: no stale rows', this.locate.testId(/^niche-row-\d+$/), 0);
  }

  async expectListError(): Promise<void> {
    await this.expectations.visible(
      'Niches: error state',
      this.locate.text(/Something went wrong|Something's gone wrong/i),
    );
    await this.expectations.visible(
      'Niches: retry',
      this.locate.role('button', { name: /Repeat the request/i }),
    );
    await this.expectations.count('Niches: stale rows hidden', this.locate.testId(/^niche-row-\d+$/), 0);
  }

  async repeatListRequest(): Promise<void> {
    await this.actions.click(
      'Niches: repeat request',
      this.locate.role('button', { name: /Repeat the request/i }),
    );
  }

  async openSortedAppsFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Sorted by apps', '/sorted-apps', 'Niches');
    await this.sortedApps.expectBusinessControls();
  }

  openAsoMobileCreate(): Promise<void> {
    return this.sortedApps.asoMobileCreate.open();
  }

  async openArchive(): Promise<void> {
    await this.actions.click('Niches: open Archive', this.overview.archiveButton);
    await this.expectations.url('Niches: Archive URL', /\/niche-list\/archive$/);
  }

  async navigateToArchive(): Promise<void> {
    await this.navigateTo('/niche-list/archive');
    await this.expectations.url('Niches: Archive URL', /\/niche-list\/archive$/);
  }

  async expectArchiveBreadcrumbs(): Promise<void> {
    const breadcrumbs = this.locate.testId(nichesTestIds.breadcrumbs);
    await this.expectations.visible(
      'Niches Archive: Niche list breadcrumb',
      breadcrumbs.filter({ hasText: /^Niche list$/ }),
    );
    await this.expectations.visible(
      'Niches Archive: Archive breadcrumb',
      breadcrumbs.filter({ hasText: /^Archive$/ }),
    );
  }

  async expectArchiveLoading(): Promise<void> {
    await this.expectations.visible('Niches Archive loading: application main', this.locate.role('main'));
    await this.expectations.hidden(
      'Niches Archive loading: breadcrumbs pending',
      this.locate.testId(nichesTestIds.breadcrumbs),
    );
    await this.expectations.hidden('Niches Archive loading: list pending', this.overview.nicheList);
  }

  async expectArchiveError(): Promise<void> {
    await this.expectations.visible(
      'Niches Archive: error state',
      this.locate.text(/Something went wrong|Something's gone wrong/i),
    );
    await this.expectations.visible(
      'Niches Archive: retry',
      this.locate.role('button', { name: /Repeat the request/i }),
    );
  }

  async repeatArchiveRequest(): Promise<void> {
    await this.actions.click(
      'Niches Archive: repeat request',
      this.locate.role('button', { name: /Repeat the request/i }),
    );
  }

  async expectNotice(message: string | RegExp): Promise<void> {
    await this.expectations.visible(`Niches notification: ${String(message)}`, this.locate.text(message));
  }

  async expectTranslationFailureNotice(): Promise<void> {
    await Promise.all([
      this.expectations.visible('Niches translation error: title', this.locate.text(/^Failed to translate$/)),
      this.expectations.visible(
        'Niches translation error: retry hint',
        this.locate.text(/^Try repeating the request\.?$/),
      ),
    ]);
  }

  async expectArchiveDetailActions(): Promise<void> {
    await this.expectations.visible(
      'Niches Archive detail: Delete',
      this.locate.role('button', { name: 'Delete', exact: true }),
    );
    await this.expectations.visible(
      'Niches Archive detail: Move to niche list',
      this.locate.role('button', { name: 'Move to niche list', exact: true }),
    );
    await this.expectations.hidden('Niches Archive detail: no Add keyword', this.detail.addKeywordButton);
  }

  async expectArchiveDetail(name?: string, module?: string): Promise<void> {
    await this.expectations.visible('Niches Archive detail: title', this.detail.title);
    await this.expectations.visible('Niches Archive detail: module', this.detail.module);
    if (name) await this.expectations.text('Niches Archive detail: title value', this.detail.title, name);
    if (module)
      await this.expectations.text('Niches Archive detail: module value', this.detail.module, module);
  }

  async moveArchivedNiche(): Promise<void> {
    await this.actions.click(
      'Niches Archive detail: Move to niche list',
      this.locate.role('button', { name: 'Move to niche list', exact: true }),
    );
  }

  async moveActiveNicheToArchive(): Promise<void> {
    await this.detail.moveToArchive();
  }

  async deleteArchivedNiche(confirm: boolean): Promise<void> {
    await this.actions.click(
      'Niches Archive detail: Delete',
      this.locate.role('button', { name: 'Delete', exact: true }),
    );
    const dialog = this.locate.role('dialog');
    await this.expectations.visible('Niches Archive detail: delete confirmation', dialog);
    await this.actions.click(
      confirm ? 'Niches Archive detail: confirm Delete' : 'Niches Archive detail: cancel Delete',
      this.locate.within(dialog).role('button', { name: confirm ? 'Delete' : 'Cancel', exact: true }),
    );
  }

  async openCreate(): Promise<void> {
    await this.actions.click('Niches: open Create new niche', this.overview.createNicheButton);
    await this.create.expectInitial();
  }

  async openFirstDetail(): Promise<{ name: string; module: string }> {
    const snapshot = await this.overview.openFirstRow();
    await this.detail.expectLoaded(snapshot.name, snapshot.module);
    return snapshot;
  }
}
