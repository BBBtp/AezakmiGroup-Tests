import type { Page, Request, Response, Route } from '@playwright/test';

import type { CleanupRegistry } from '@framework/lifecycle';
import { UiActions } from '@framework/ui';

export type UrlMatcher = string | RegExp | ((url: string) => boolean);

export type ResponseCriteria = {
  url: UrlMatcher;
  method?: string;
  status?: number | ((status: number) => boolean);
  timeout?: number;
};

export type RequestCapture = {
  readonly urls: string[];
  stop(): void;
};

function matchesUrl(url: string, matcher: UrlMatcher): boolean {
  if (typeof matcher === 'string') return url.includes(matcher);
  if (matcher instanceof RegExp) return matcher.test(url);
  return matcher(url);
}

function matchesStatus(status: number, expected?: ResponseCriteria['status']): boolean {
  if (expected === undefined) return true;
  return typeof expected === 'number' ? status === expected : expected(status);
}

export class NetworkController {
  private readonly actions: UiActions;
  private captureSequence = 0;

  constructor(
    private readonly page: Page,
    private readonly cleanup?: CleanupRegistry,
  ) {
    this.actions = new UiActions(page);
  }

  navigate(url: string, options?: Parameters<Page['goto']>[1]) {
    return this.actions.navigate(`network navigation to ${url}`, url, options);
  }

  reload(options?: Parameters<Page['reload']>[0]) {
    return this.actions.run('navigate', 'network reload', this.page.locator('body'), () =>
      this.page.reload(options),
    );
  }

  waitForResponse(criteria: ResponseCriteria): Promise<Response> {
    return this.page.waitForResponse(
      (response) =>
        matchesUrl(response.url(), criteria.url) &&
        (!criteria.method || response.request().method() === criteria.method) &&
        matchesStatus(response.status(), criteria.status),
      { timeout: criteria.timeout },
    );
  }

  async waitForResponseWhile<T>(
    criteria: ResponseCriteria,
    action: () => Promise<T>,
  ): Promise<{ response: Response; result: T }> {
    const responsePromise = this.waitForResponse(criteria);
    const [response, result] = await Promise.all([responsePromise, action()]);
    return { response, result };
  }

  waitForSuccessfulResponse(url: UrlMatcher, method?: string): Promise<Response> {
    return this.waitForResponse({
      url,
      method,
      status: (status) => status >= 200 && status < 300,
    });
  }

  waitForFailedResponse(url: UrlMatcher, method?: string): Promise<Response> {
    return this.waitForResponse({
      url,
      method,
      status: (status) => status >= 500,
    });
  }

  async failNext(url: string | RegExp, method: string, body: unknown, status = 500): Promise<void> {
    const handler = async (route: Route) => {
      if (route.request().method() !== method) {
        await route.continue();
        return;
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    };

    await this.page.route(url, handler, { times: 1 });
  }

  captureRequests(predicate: (request: Request) => boolean): RequestCapture {
    const urls: string[] = [];
    let active = true;
    const listener = (request: Request) => {
      if (predicate(request)) urls.push(request.url());
    };
    this.page.on('request', listener);
    this.captureSequence += 1;
    const cleanupHandle = this.cleanup?.register(`request capture #${this.captureSequence}`, () => {
      if (!active) return;
      this.page.off('request', listener);
      active = false;
    });

    return {
      urls,
      stop: () => {
        if (!active) return;
        this.page.off('request', listener);
        active = false;
        cleanupHandle?.dismiss();
      },
    };
  }
}
