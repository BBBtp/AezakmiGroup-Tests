import type { Page } from '@playwright/test';

import { TaskGeneratorComponent } from '../../components/task-generator/task-generator-component';
import { ApplicationShellComponent } from '../../components/common/application-shell-component';
import { BasePage } from '../base-page';

export class TaskGeneratorPage extends BasePage {
  readonly shell: ApplicationShellComponent;
  readonly content: TaskGeneratorComponent;

  constructor(page: Page) {
    super(page);
    this.shell = new ApplicationShellComponent(page);
    this.content = new TaskGeneratorComponent(page);
  }

  async openFromSidebar(): Promise<void> {
    await this.shell.openSidebarDestination('Task generator', '/task-generator');
    await this.content.expectLoaded();
  }

  async openWithoutContentWait(): Promise<void> {
    await this.shell.openSidebarDestination('Task generator', '/task-generator');
  }
}
