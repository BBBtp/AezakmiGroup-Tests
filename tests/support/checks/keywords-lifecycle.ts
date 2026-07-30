import type { TestDataFactory } from '@framework/data';
import type { CleanupHandle, CleanupRegistry } from '@framework/lifecycle';
import { ChecksPage } from '@modules/checks';

export class ManagedTrackedKeyword {
  constructor(
    readonly value: string,
    private readonly cleanupHandle: CleanupHandle,
  ) {}

  remove(): Promise<void> {
    return this.cleanupHandle.runNow();
  }
}

export class ChecksKeywordsLifecycle {
  constructor(
    private readonly checksPage: ChecksPage,
    private readonly cleanup: CleanupRegistry,
    private readonly dataFactory: TestDataFactory,
  ) {}

  async navigate(): Promise<void> {
    await this.checksPage.navigate();
  }

  nextKeyword(): string {
    return this.dataFactory.uniqueLabel('autotest').toLowerCase();
  }

  async cancelAdding(keyword: string, country = 'GB'): Promise<void> {
    const modal = await this.checksPage.openEditKeywords();
    await modal.expectKeywordNotTracked(keyword);
    await modal.openAddForm();
    await modal.fillAddForm(keyword, country);
    await modal.close();

    const reopened = await this.checksPage.openEditKeywords();
    await reopened.expectKeywordNotTracked(keyword);
    await reopened.close();
  }

  async add(keyword: string, country = 'GB'): Promise<ManagedTrackedKeyword> {
    const modal = await this.checksPage.openEditKeywords();
    await modal.openAddForm();
    await modal.fillAddForm(keyword, country);
    await modal.submitAdd();

    const cleanupHandle = this.cleanup.register(`tracked keyword ${country}:${keyword}`, async () => {
      await this.checksPage.navigate();
      const cleanupModal = await this.checksPage.openEditKeywords();
      await cleanupModal.stopTracking(keyword);
      await cleanupModal.close();
    });

    const reopened = await this.checksPage.openEditKeywords();
    await reopened.expectKeywordTracked(keyword);
    await reopened.close();

    return new ManagedTrackedKeyword(keyword, cleanupHandle);
  }

  async expectPersisted(keyword: string): Promise<void> {
    await this.checksPage.navigate();
    const modal = await this.checksPage.openEditKeywords();
    await modal.expectKeywordTracked(keyword);
    await modal.close();
  }
}
