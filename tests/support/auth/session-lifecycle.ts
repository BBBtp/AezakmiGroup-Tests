import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { chromium, type BrowserContext } from '@playwright/test';

import { testSettings } from '@config/test-settings';
import type { CleanupRegistry } from '@framework/lifecycle';
import { ManagedTestSession, type TestSessionFactory } from '@framework/playwright';
import { LoginPage } from '@modules/auth';

type Credentials = {
  readonly email: string;
  readonly password: string;
};

const emptyStorageState = { cookies: [], origins: [] };

function exactPath(pathname: string): RegExp {
  const escaped = pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}(?:[/?#]|$)`);
}

export class AuthSessionLifecycle {
  constructor(
    private readonly sessions: TestSessionFactory,
    private readonly cleanup: CleanupRegistry,
  ) {}

  async expectAnonymousAccessBlocked(paths: readonly string[]): Promise<void> {
    const session = await this.sessions.newSession({ storageState: emptyStorageState });
    for (const path of paths) {
      await session.navigate(path, { waitUntil: 'commit' });
      await session.expectUrl(/\/login(?:[/?]|$)/, { timeout: 15000 });
    }
  }

  async expectStoredSessionAccess(storageStatePath: string, paths: readonly string[]): Promise<void> {
    const session = await this.sessions.newSession({ storageState: storageStatePath });
    for (const path of paths) {
      await session.navigate(path);
      await session.expectUrl(exactPath(path));
    }
  }

  async expectExpiredSessionBlocked(storageStatePath: string, paths: readonly string[]): Promise<void> {
    for (const path of paths) {
      const session = await this.sessions.newSession({ storageState: storageStatePath });
      await session.navigate(path);
      await session.setLocalStorage({
        token: 'expired-invalid-token',
        tokenExpiry: '0',
      });
      await session.reload();
      await session.expectUrl(/\/login/);
    }
  }

  async expectRememberMePersists(credentials: Credentials): Promise<void> {
    const userDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-remember-me-'));
    let context: BrowserContext | undefined;
    const cleanupHandle = this.cleanup.register('persistent remember-me browser session', async () => {
      await context?.close();
      context = undefined;
      await fs.promises.rm(userDataDirectory, { recursive: true, force: true });
    });

    const contextOptions = {
      baseURL: testSettings.baseUrl,
      viewport: { width: 1280, height: 720 },
    };

    context = await chromium.launchPersistentContext(userDataDirectory, contextOptions);
    const loginPage = new LoginPage(context.pages()[0] ?? (await context.newPage()));
    await loginPage.navigate();
    await loginPage.login(credentials.email, credentials.password, { remember: true });
    await loginPage.expectAuthenticated();
    await context.close();
    context = undefined;

    context = await chromium.launchPersistentContext(userDataDirectory, contextOptions);
    const restoredSession = new ManagedTestSession(
      context.pages()[0] ?? (await context.newPage()),
      this.cleanup,
    );
    await restoredSession.navigate('/dashboard');
    await restoredSession.expectUrl(/\/dashboard/);

    await cleanupHandle.runNow();
  }
}
